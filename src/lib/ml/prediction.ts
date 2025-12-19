import tf from './tensorflow'
import { normalizeData } from './preprocessing'

let loadedModel: tf.LayersModel | null = null

/**
 * Load the Rebond Model
 * @param modelPath Path to model.json (default 'file://./model/model.json' or public URL)
 */
export async function loadRebondModel(modelPath: string) {
    if (loadedModel) return loadedModel

    try {
        loadedModel = await tf.loadLayersModel(modelPath)
        return loadedModel
    } catch (e) {
        console.error('Failed to load model', e)
        return null
    }
}

/**
 * Predict Probability of Rebound
 * @param recentData Sequence of recent [Price, Volume] (last 30 days)
 * @param modelPath Optional model path
 */
export async function predictRebond(
    recentData: { price: number, volume: number }[],
    modelPath: string = '/models/rebond/model.json'
): Promise<number | null> {
    const model = await loadRebondModel(modelPath)
    if (!model) return null // Fallback if model not available

    // Preprocess (must match training)
    const prices = recentData.map(d => d.price)
    const volumes = recentData.map(d => d.volume)

    const { normalized: normPrices } = normalizeData(prices)
    const { normalized: normVolumes } = normalizeData(volumes)

    // Combine
    const sequence: number[][] = []
    for (let i = 0; i < normPrices.length; i++) {
        sequence.push([normPrices[i], normVolumes[i]])
    }

    // Predict
    // Input shape: [1, window, features]
    const input = tf.tensor3d([sequence])
    const prediction = model.predict(input) as tf.Tensor
    const score = (await prediction.data())[0]

    input.dispose()
    prediction.dispose()

    return score
}
