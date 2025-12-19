/**
 * Simple Training Script with Mock Data
 * Run with: npm run train
 */

import * as tf from '@tensorflow/tfjs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import training after TF is loaded
import { buildRebondModel } from '../src/lib/ml/models/lstm-rebond.js'
import { normalizeData, createSequences } from '../src/lib/ml/preprocessing.js'

// Generate mock training data
function generateMockData(numSamples = 1000) {
    const data = []

    for (let i = 0; i < numSamples; i++) {
        const basePrice = 50 + Math.random() * 100
        const trend = Math.random() > 0.5 ? 1 : -1

        // Generate a trend
        const prices = []
        for (let j = 0; j < 40; j++) {
            const noise = (Math.random() - 0.5) * 5
            const newPrice = basePrice + (trend * j * 0.5) + noise
            prices.push(Math.max(1, newPrice)) // Ensure positive
        }

        // Label: 1 if price goes up in next 7 days
        const currentPrice = prices[30]
        const futurePrice = prices[37]

        data.push({
            price: currentPrice,
            volume: 500 + Math.random() * 500,
            label: futurePrice > currentPrice ? 1 : 0
        })
    }

    return data
}

async function trainModelSimple(trainingData, config) {
    const { windowSize, epochs, batchSize, validationSplit } = config

    // Prepare Data
    const prices = trainingData.map(d => d.price)
    const volumes = trainingData.map(d => d.volume)

    const { normalized: normPrices } = normalizeData(prices)
    const { normalized: normVolumes } = normalizeData(volumes)

    // Combine features
    const features = []
    for (let i = 0; i < normPrices.length; i++) {
        features.push([normPrices[i], normVolumes[i]])
    }

    // Create Sequences
    const X = []
    const Y = []

    for (let i = 0; i <= features.length - windowSize - 1; i++) {
        const sequence = features.slice(i, i + windowSize)
        const label = trainingData[i + windowSize].label

        X.push(sequence)
        Y.push(label)
    }

    // Convert to Tensors
    const inputsTensor = tf.tensor3d(X)
    const labelsTensor = tf.tensor2d(Y, [Y.length, 1])

    // Build Model
    const model = buildRebondModel(windowSize, 2)

    console.log('🧠 Training...')

    // Train
    const history = await model.fit(inputsTensor, labelsTensor, {
        epochs,
        batchSize,
        validationSplit,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                if (epoch % 5 === 0 || epoch === epochs - 1) {
                    console.log(`Epoch ${epoch + 1}/${epochs}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`)
                }
            }
        }
    })

    inputsTensor.dispose()
    labelsTensor.dispose()

    return { model, history }
}

async function main() {
    console.log('🚀 Starting LSTM Training (Mock Data)...\n')

    const trainingData = generateMockData(1000)
    console.log(`✅ Generated ${trainingData.length} mock examples\n`)

    const result = await trainModelSimple(trainingData, {
        windowSize: 30,
        epochs: 20,
        batchSize: 32,
        validationSplit: 0.2
    })

    // Save model
    const modelDir = path.join(__dirname, '..', 'public', 'models', 'rebond')
    if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true })
    }

    const modelPath = `file://${modelDir}`
    console.log(`\n💾 Saving model to ${modelPath}...`)
    await result.model.save(modelPath)

    // Save metadata
    fs.writeFileSync(
        path.join(modelDir, 'metadata.json'),
        JSON.stringify({
            trainedAt: new Date().toISOString(),
            trainingSize: trainingData.length,
            windowSize: 30,
            epochs: 20,
            type: 'mock_data'
        }, null, 2)
    )

    const finalAcc = result.history.history.acc[result.history.history.acc.length - 1]
    const finalLoss = result.history.history.loss[result.history.history.loss.length - 1]

    console.log('\n✅ Training complete!')
    console.log(`📈 Accuracy: ${(finalAcc * 100).toFixed(2)}%`)
    console.log(`📉 Loss: ${finalLoss.toFixed(4)}`)
    console.log('\n🎉 Model ready! Activate it in cards/[id]/page.tsx')

    process.exit(0)
}

main().catch(err => {
    console.error('❌ Training failed:', err)
    process.exit(1)
})
