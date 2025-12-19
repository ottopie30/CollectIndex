import * as tf from '@tensorflow/tfjs'

// Conditional import for Node.js backend
// Using require to avoid build issues in browser environment
const isServer = typeof window === 'undefined'

if (isServer) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@tensorflow/tfjs-node')
    } catch (e) {
        console.warn('Failed to load @tensorflow/tfjs-node, falling back to vanilla tfjs', e)
    }
}

export const initTensorFlow = async () => {
    await tf.ready()
    const backend = tf.getBackend()
    console.log(`TensorFlow.js initialized using backend: ${backend}`)
    return backend
}

export default tf
