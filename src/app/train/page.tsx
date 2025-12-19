'use client'

/**
 * Training Page - Browser-based ML Training
 * Navigate to /train in the browser to execute training
 */

import { useState, useEffect } from 'react'
import { buildRebondModel } from '@/lib/ml/models/lstm-rebond'
import { normalizeData } from '@/lib/ml/preprocessing'
import * as tf from '@tensorflow/tfjs'

export default function TrainPage() {
    const [status, setStatus] = useState('Ready to train')
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<any>(null)
    const [backend, setBackend] = useState<string>('')

    // Training Presets
    const PRESETS = {
        quick: {
            name: '⚡ Quick Test',
            samples: 5000,
            epochs: 50,
            batchSize: 128,
            windowSize: 30,
            validationSplit: 0.2,
            lstmUnits: 128,
            depth: 2
        },
        balanced: {
            name: '⚙️ Balanced',
            samples: 20000,
            epochs: 200,
            batchSize: 256,
            windowSize: 60,
            validationSplit: 0.2,
            lstmUnits: 256,
            depth: 3
        },
        beast: {
            name: '🔥 BEAST MODE',
            samples: 100000,
            epochs: 1000,
            batchSize: 512,
            windowSize: 90,
            validationSplit: 0.15,
            lstmUnits: 512,
            depth: 4
        }
    }

    // GPU-Optimized Configuration
    const [preset, setPreset] = useState<'quick' | 'balanced' | 'beast'>('beast')
    const [config, setConfig] = useState(PRESETS.beast)

    // Detect TensorFlow backend on mount
    useEffect(() => {
        async function detectBackend() {
            await tf.ready()
            const tfBackend = tf.getBackend()
            setBackend(tfBackend)
            console.log(`TensorFlow.js backend: ${tfBackend}`)
        }
        detectBackend()
    }, [])

    // Generate mock data
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

    async function trainModel() {
        setStatus('Generating data...')
        setProgress(5)

        const trainingData = generateMockData(config.samples)

        setStatus('Preparing sequences...')
        setProgress(10)

        // Prepare Data
        const prices = trainingData.map(d => d.price)
        const volumes = trainingData.map(d => d.volume)

        const { normalized: normPrices } = normalizeData(prices)
        const { normalized: normVolumes } = normalizeData(volumes)

        const features = []
        for (let i = 0; i < normPrices.length; i++) {
            features.push([normPrices[i], normVolumes[i]])
        }

        // Create Sequences
        const X = []
        const Y = []

        for (let i = 0; i <= features.length - config.windowSize - 1; i++) {
            const sequence = features.slice(i, i + config.windowSize)
            const label = trainingData[i + config.windowSize].label
            X.push(sequence)
            Y.push(label)
        }

        setStatus('Building BEAST MODE GPU-optimized model...')
        setProgress(15)

        const inputsTensor = tf.tensor3d(X)
        const labelsTensor = tf.tensor2d(Y, [Y.length, 1])

        // Build DEEP LSTM model with variable depth
        const model = tf.sequential()

        // Stack LSTM layers based on depth config
        for (let i = 0; i < config.depth; i++) {
            const units = Math.floor(config.lstmUnits / Math.pow(2, i))
            const returnSequences = i < config.depth - 1

            model.add(tf.layers.lstm({
                units: units,
                returnSequences: returnSequences,
                inputShape: i === 0 ? [config.windowSize, 2] : undefined,
                activation: 'tanh',
                recurrentActivation: 'sigmoid',
                kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
            }))

            // Add batch normalization for deeper networks
            if (config.depth > 2) {
                model.add(tf.layers.batchNormalization())
            }

            // Dropout between LSTM layers
            model.add(tf.layers.dropout({ rate: 0.3 }))
        }

        // Dense layers for final prediction
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }))
        model.add(tf.layers.dropout({ rate: 0.2 }))

        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu'
        }))
        model.add(tf.layers.dropout({ rate: 0.2 }))

        // Output layer
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))

        model.compile({
            optimizer: tf.train.adam(0.0005), // Lower learning rate for stability
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        })

        setStatus(`Training on ${backend} backend... (${config.epochs} epochs, this will take several minutes)`)
        setProgress(20)

        const startTime = Date.now()

        const history = await model.fit(inputsTensor, labelsTensor, {
            epochs: config.epochs,
            batchSize: config.batchSize,
            validationSplit: config.validationSplit,
            callbacks: {
                onEpochEnd: (epoch, logs: any) => {
                    const progressPct = 20 + ((epoch + 1) / config.epochs) * 70
                    setProgress(Math.round(progressPct))

                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
                    const eta = ((elapsed / (epoch + 1)) * (config.epochs - epoch - 1)).toFixed(0)

                    if (epoch % 5 === 0 || epoch === config.epochs - 1) {
                        setStatus(`Epoch ${epoch + 1}/${config.epochs} - Loss: ${logs.loss.toFixed(4)}, Acc: ${(logs.acc * 100).toFixed(2)}% - ETA: ${eta}s`)
                    }
                }
            }
        })

        inputsTensor.dispose()
        labelsTensor.dispose()

        setStatus('Saving model...')
        setProgress(95)

        await model.save('downloads://rebond-model-gpu')

        setProgress(100)

        const trainingTime = ((Date.now() - startTime) / 1000).toFixed(0)
        setStatus(`Training complete in ${trainingTime}s!`)

        const finalAcc = history.history.acc[history.history.acc.length - 1] as number
        const finalLoss = history.history.loss[history.history.loss.length - 1] as number
        const finalValAcc = history.history.val_acc ? (history.history.val_acc[history.history.val_acc.length - 1] as number) : null

        setResult({
            accuracy: (finalAcc * 100).toFixed(2) + '%',
            valAccuracy: finalValAcc ? (finalValAcc * 100).toFixed(2) + '%' : 'N/A',
            loss: finalLoss.toFixed(4),
            epochs: config.epochs,
            samples: trainingData.length,
            backend: backend,
            trainingTime: trainingTime + 's',
            lstmUnits: config.lstmUnits,
            depth: config.depth,
            preset: PRESETS[preset].name
        })
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="glass rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-white mb-2">🧠 ML Model Training</h1>
                <p className="text-white/60">Train the LSTM Rebond Prediction Model</p>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-blue-400 text-sm">
                        💎 GPU Detected: <strong>{backend || 'Loading...'}</strong>
                        {backend === 'webgl' && ' - RTX 2080 Ready!'}
                    </p>
                </div>
            </div>

            {/* Configuration Panel */}
            <div className="glass rounded-2xl p-8 space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">⚙️ Training Configuration</h2>

                {/* Preset Selector */}
                <div>
                    <label className="block text-white/70 text-sm mb-3">Training Preset</label>
                    <div className="grid grid-cols-3 gap-3">
                        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setPreset(key)
                                    setConfig(PRESETS[key])
                                }}
                                disabled={progress > 0 && progress < 100}
                                className={`p-4 rounded-xl border-2 transition-all ${preset === key
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                                    } disabled:opacity-50`}
                            >
                                <p className="text-lg font-bold text-white">{PRESETS[key].name}</p>
                                <p className="text-xs text-white/50 mt-1">
                                    {PRESETS[key].samples.toLocaleString()} samples
                                </p>
                                <p className="text-xs text-white/50">
                                    {PRESETS[key].epochs} epochs
                                </p>
                                {key === 'beast' && (
                                    <p className="text-xs text-amber-400 mt-2 font-semibold">
                                        ~{Math.ceil(PRESETS[key].epochs * PRESETS[key].samples / 150000)}h training
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Settings */}
                <details className="mt-4">
                    <summary className="cursor-pointer text-white/70 text-sm hover:text-white">
                        Advanced Settings (Override Preset)
                    </summary>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-white/70 text-sm mb-2">Samples</label>
                            <input
                                type="number"
                                value={config.samples}
                                onChange={(e) => setConfig({ ...config, samples: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                                disabled={progress > 0 && progress < 100}
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm mb-2">Epochs</label>
                            <input
                                type="number"
                                value={config.epochs}
                                onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                                disabled={progress > 0 && progress < 100}
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm mb-2">Batch Size</label>
                            <input
                                type="number"
                                value={config.batchSize}
                                onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                                disabled={progress > 0 && progress < 100}
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm mb-2">LSTM Units</label>
                            <input
                                type="number"
                                value={config.lstmUnits}
                                onChange={(e) => setConfig({ ...config, lstmUnits: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                                disabled={progress > 0 && progress < 100}
                            />
                        </div>
                    </div>
                </details>

                {/* Training Info */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <p className="text-purple-400 text-sm font-semibold mb-1">Model Complexity</p>
                        <p className="text-white text-2xl font-bold">{config.depth}-Layer LSTM</p>
                        <p className="text-white/50 text-xs mt-1">{config.lstmUnits} units → {Math.floor(config.lstmUnits / Math.pow(2, config.depth - 1))} units</p>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <p className="text-amber-400 text-sm font-semibold mb-1">Estimated Time</p>
                        <p className="text-white text-2xl font-bold">
                            {preset === 'beast' ? '3-6h' : preset === 'balanced' ? '30-60m' : '5-15m'}
                        </p>
                        <p className="text-white/50 text-xs mt-1">RTX 2080 WebGL</p>
                    </div>
                </div>

                {preset === 'beast' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 text-sm">
                            <strong>⚠️ BEAST MODE:</strong> Training avec {config.samples.toLocaleString()} samples et {config.epochs} epochs va prendre plusieurs heures.
                            Le navigateur doit rester ouvert. Vous pouvez ouvrir un autre onglet mais ne fermez pas cette page.
                        </p>
                    </div>
                )}
            </div>

            <div className="glass rounded-2xl p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Training Status</h2>
                    <p className="text-white/80 mb-4">{status}</p>

                    {/* Progress Bar */}
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-white/50 text-sm mt-2">{progress}%</p>
                </div>

                {result && (
                    <div className="p-6 bg-white/5 rounded-xl space-y-3">
                        <h3 className="text-lg font-semibold text-white">Training Results</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-white/50 text-sm">Train Accuracy</p>
                                <p className="text-white font-bold text-2xl">{result.accuracy}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Val Accuracy</p>
                                <p className="text-white font-bold text-2xl">{result.valAccuracy}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Loss</p>
                                <p className="text-white font-bold text-2xl">{result.loss}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Training Time</p>
                                <p className="text-white font-bold text-2xl">{result.trainingTime}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Epochs</p>
                                <p className="text-white font-bold text-xl">{result.epochs}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Samples</p>
                                <p className="text-white font-bold text-xl">{result.samples}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Backend</p>
                                <p className="text-white font-bold text-xl uppercase">{result.backend}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">LSTM Units</p>
                                <p className="text-white font-bold text-xl">{result.lstmUnits}</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={trainModel}
                    disabled={progress > 0 && progress < 100}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {progress === 100 ? 'Train Again' : progress > 0 ? 'Training...' : 'Start Training'}
                </button>

                {result && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <p className="text-amber-400 text-sm">
                            ⚠️ Model downloaded to your browser. Upload the files manually to <code className="px-2 py-1 bg-white/10 rounded">public/models/rebond/</code>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
