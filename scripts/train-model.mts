/**
 * Training Script for LSTM Rebond Model
 * Run with: node --loader ts-node/esm scripts/train-model.mts
 */

import { trainModel } from '../src/lib/ml/training.js'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchTrainingData() {
    console.log('📊 Fetching historical price data...')

    // Fetch all price history from database
    const { data: priceData, error } = await supabase
        .from('price_history')
        .select('card_id, date, price')
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching data:', error)
        return []
    }

    // Group by card_id and create training examples
    const cardGroups = new Map<string, Array<{ date: string, price: number }>>()

    for (const record of priceData || []) {
        if (!cardGroups.has(record.card_id)) {
            cardGroups.set(record.card_id, [])
        }
        cardGroups.get(record.card_id)!.push({
            date: record.date,
            price: record.price
        })
    }

    // Generate labeled training examples
    // Label = 1 if price went up in next 7 days, 0 otherwise
    const trainingExamples: Array<{ price: number, volume: number, label: number }> = []

    for (const [cardId, history] of cardGroups.entries()) {
        if (history.length < 40) continue // Need at least 40 days

        for (let i = 0; i < history.length - 37; i++) {
            const currentPrice = history[i + 30].price
            const futurePrice = history[i + 37].price // 7 days ahead

            trainingExamples.push({
                price: history[i].price,
                volume: Math.random() * 1000, // Mock volume for now
                label: futurePrice > currentPrice ? 1 : 0
            })
        }
    }

    console.log(`✅ Prepared ${trainingExamples.length} training examples from ${cardGroups.size} cards`)
    return trainingExamples
}

async function main() {
    console.log('🚀 Starting LSTM Model Training...\n')

    // 1. Fetch data
    const trainingData = await fetchTrainingData()

    if (trainingData.length < 100) {
        console.error('❌ Not enough training data. Need at least 100 examples.')
        console.log('💡 Tip: Run price sync first to populate database')
        process.exit(1)
    }

    // 2. Train model
    console.log('\n🧠 Training model...')
    const { model, history, meta } = await trainModel(trainingData, {
        windowSize: 30,
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2
    })

    // 3. Save model
    const modelDir = path.join(process.cwd(), 'public', 'models', 'rebond')
    if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true })
    }

    const modelPath = `file://${modelDir}`
    console.log(`\n💾 Saving model to ${modelPath}...`)
    await model.save(modelPath)

    // Save metadata
    fs.writeFileSync(
        path.join(modelDir, 'metadata.json'),
        JSON.stringify({
            trainedAt: new Date().toISOString(),
            trainingSize: trainingData.length,
            windowSize: 30,
            epochs: 50,
            ...meta
        }, null, 2)
    )

    console.log('\n✅ Training complete!')
    console.log(`📈 Final accuracy: ${((history.history.acc?.slice(-1)[0] as number) || 0).toFixed(4)}`)
    console.log(`📉 Final loss: ${((history.history.loss?.slice(-1)[0] as number) || 0).toFixed(4)}`)
    console.log('\n🎉 Model ready for inference!')
}

main().catch(console.error)
