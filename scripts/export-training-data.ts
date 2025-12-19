
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Safe initialization
let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
} else {
    console.warn('⚠️ Missing Supabase credentials. Switching to SYNTHETIC DATA MODE.')
}

async function exportData() {
    console.log('📦 Fetching training data...')

    let prices: any[] | null = null

    // Only try fetching if authorized
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('price_history')
                .select('*')
                .order('recorded_at', { ascending: true })
                .limit(2000)

            if (!error) prices = data
        } catch (e) {
            console.warn('Failed to connect to DB, using synthetic data.')
        }
    }

    let exportData = []

    if (!prices || prices.length < 100) {
        console.warn('⚠️ No suficient real data found. Generating synthetic dataset for training demo...')
        exportData = generateSyntheticData()
    } else {
        exportData = prices.map(p => ({
            price: p.price,
            volume: 1000 + Math.random() * 500, // Volume is often missing in simple price history
            date: p.recorded_at
        }))
    }

    const outputPath = path.join(process.cwd(), 'dataset.json')
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2))

    console.log(`✅ Exported ${exportData.length} records to ${outputPath}`)
}

function generateSyntheticData() {
    const data = []
    let price = 50
    const now = Date.now()

    for (let i = 0; i < 2000; i++) {
        // Random walk with trend
        const change = (Math.random() - 0.5) * 2 // -1 to +1
        price += change
        price = Math.max(1, price) // No negative prices

        data.push({
            price: parseFloat(price.toFixed(2)),
            volume: Math.floor(500 + Math.random() * 1000),
            date: new Date(now - (2000 - i) * 3600 * 1000).toISOString()
        })
    }
    return data
}

exportData()
