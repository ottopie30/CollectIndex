import { NextRequest, NextResponse } from 'next/server'
import * as tf from '@tensorflow/tfjs'
import { buildRebondModel } from '@/lib/ml/models/lstm-rebond'
import { normalizeData } from '@/lib/ml/preprocessing'
import fs from 'fs'
import path from 'path'

// Generate mock training data
function generateMockData(numSamples = 1000) {
    const data = []

    for (let i = 0; i < numSamples; i++) {
        const basePrice = 50 + Math.random() * 100
        const trend = Math.random() > 0.5 ? 1 : -1

        const prices = []
        for (let j = 0; j < 40; j++) {
            const noise = (Math.random() - 0.5) * 5
            const newPrice = basePrice + (trend * j * 0.5) + noise
            prices.push(Math.max(1, newPrice))
        }

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

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Starting model training...')

        // Generate training data
        const trainingData = generateMockData(1000)
        console.log(`✅ Generated ${trainingData.length} examples`)

        // Prepare data
        const prices = trainingData.map(d => d.price)
        const volumes = trainingData.map(d => d.volume)

        const { normalized: normPrices } = normalizeData(prices)
        const { normalized: normVolumes } = normalizeData(volumes)

        const features = []
        for (let i = 0; i < normPrices.length; i++) {
            features.push([normPrices[i], normVolumes[i]])
        }

        // Create sequences
        const windowSize = 30
        const X: number[][][] = []
        const Y: number[] = []

        for (let i = 0; i <= features.length - windowSize - 1; i++) {
            const sequence = features.slice(i, i + windowSize)
            const label = trainingData[i + windowSize].label
            X.push(sequence)
            Y.push(label)
        }

        // Build model
        const model = buildRebondModel(windowSize, 2)
        console.log('🧠 Model built, starting training...')

        // Convert to tensors
        const inputsTensor = tf.tensor3d(X)
        const labelsTensor = tf.tensor2d(Y, [Y.length, 1])

        // Train
        const history = await model.fit(inputsTensor, labelsTensor, {
            epochs: 20,
            batchSize: 32,
            validationSplit: 0.2,
            verbose: 0
        })

        inputsTensor.dispose()
        labelsTensor.dispose()

        console.log('💾 Training complete, saving model...')

        // Save model to public directory
        const modelDir = path.join(process.cwd(), 'public', 'models', 'rebond')
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, { recursive: true })
        }

        await model.save(`file://${modelDir}`)

        // Save metadata
        const finalAcc = history.history.acc[history.history.acc.length - 1] as number
        const finalLoss = history.history.loss[history.history.loss.length - 1] as number

        const metadata = {
            trainedAt: new Date().toISOString(),
            trainingSize: trainingData.length,
            windowSize: 30,
            epochs: 20,
            accuracy: finalAcc,
            loss: finalLoss,
            type: 'mock_data'
        }

        fs.writeFileSync(
            path.join(modelDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        )

        console.log('✅ Model saved successfully!')

        return NextResponse.json({
            success: true,
            accuracy: (finalAcc * 100).toFixed(2) + '%',
            loss: finalLoss.toFixed(4),
            epochs: 20,
            samples: trainingData.length,
            path: '/models/rebond/'
        })

    } catch (error: any) {
        console.error('❌ Training failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Model training endpoint. Use POST to start training.',
        endpoint: '/api/train'
    })
}
