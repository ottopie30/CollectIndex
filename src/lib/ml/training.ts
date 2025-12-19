import tf from './tensorflow'
import { buildRebondModel } from './models/lstm-rebond'
import { normalizeData, createSequences } from './preprocessing'

export interface TrainingConfig {
    windowSize: number
    epochs: number
    batchSize: number
    validationSplit: number
}

const DEFAULT_CONFIG: TrainingConfig = {
    windowSize: 30,
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2
}

/**
 * Train the Rebond Model
 * @param historicalData Array of price objects { price: number, volume: number }
 * @param config Training configuration
 */
export async function trainModel(
    historicalData: { price: number, volume: number, label?: number }[],
    config: Partial<TrainingConfig> = {}
) {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    // 1. Prepare Data
    const prices = historicalData.map(d => d.price)
    const volumes = historicalData.map(d => d.volume)

    const { normalized: normPrices, min: minPrice, max: maxPrice } = normalizeData(prices)
    const { normalized: normVolumes } = normalizeData(volumes)

    // Combine features [price, volume]
    const features: number[][] = []
    for (let i = 0; i < normPrices.length; i++) {
        features.push([normPrices[i], normVolumes[i]])
    }

    // Create Sequences
    // For training, we need labels (1 = rebound, 0 = no rebound)
    // If labels are not provided, logic must generate them (e.g. price increase in next N days)
    // For now assuming passed data has logic or we define simple logic: Y = 1 if price[t+w] > price[t+w-1]

    // Simplification for prototype:
    // Input X: Sequence of [Price, Volume]
    // Output Y: 1 if Price[next] > Price[current] (Rebound/Up trend)

    const X: number[][][] = [] // [samples, window, features]
    const Y: number[] = []

    for (let i = 0; i <= features.length - cfg.windowSize - 1; i++) {
        const sequence = features.slice(i, i + cfg.windowSize) // [[p1,v1], [p2,v2]...]

        // Label logic: Is the NEXT price higher than current? (Simple Trend)
        // Or specific rebound logic
        const currentPrice = prices[i + cfg.windowSize - 1]
        const nextPrice = prices[i + cfg.windowSize]
        const label = nextPrice > currentPrice ? 1 : 0

        X.push(sequence)
        Y.push(label)
    }

    // Convert to Tensors
    const inputsTensor = tf.tensor3d(X)
    const labelsTensor = tf.tensor2d(Y, [Y.length, 1])

    // 2. Build Model
    const model = buildRebondModel(cfg.windowSize, 2)

    console.log('Starting training...')

    // 3. Train
    const history = await model.fit(inputsTensor, labelsTensor, {
        epochs: cfg.epochs,
        batchSize: cfg.batchSize,
        validationSplit: cfg.validationSplit,
        callbacks: {
            onEpochEnd: (epoch: number, logs?: any) => {
                console.log(`Epoch ${epoch + 1}: loss=${logs?.loss.toFixed(4)}, acc=${logs?.acc.toFixed(4)}`)
            }
        }
    })

    console.log('Training complete.')

    // Cleanup tensors
    inputsTensor.dispose()
    labelsTensor.dispose()

    return { model, history, meta: { minPrice, maxPrice } }
}
