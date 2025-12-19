import tf from '../tensorflow'

/**
 * Build LSTM Model for Rebound Prediction
 * @param windowSize length of input sequence (e.g. 30 days)
 * @param featureCount number of features (e.g. 2: Price, Volume)
 * @returns Compiled TensorFlow model
 */
export function buildRebondModel(windowSize: number, featureCount: number = 2) {
    const model = tf.sequential()

    // LSTM Layer
    model.add(tf.layers.lstm({
        units: 64,
        returnSequences: false,
        inputShape: [windowSize, featureCount],
        activation: 'tanh',
        recurrentActivation: 'sigmoid'
    }))

    // Dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.2 }))

    // Dense Output Layer (Probability 0-1)
    model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
    }))

    // Compile model
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    })

    return model
}
