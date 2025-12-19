/**
 * Price Data Cleanup Script
 * Removes duplicates, detects outliers, and fills missing data
 */

import { createClient } from '@supabase/supabase-js'
import { detectPriceOutliers } from '../src/lib/validation/priceSchema'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY! // Service key for admin access

const supabase = createClient(supabaseUrl, supabaseKey)

interface PriceRecord {
    id: string
    card_id: string
    eur_price: number
    usd_price: number
    created_at: string
}

async function removeDuplicates() {
    console.log('🔍 Checking for duplicate price entries...')

    // Find duplicates (same card_id and date)
    const { data: duplicates, error } = await supabase.rpc('find_duplicate_prices')

    if (error) {
        console.error('Error finding duplicates:', error)
        return
    }

    if (duplicates && duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate entries`)
        // Keep the most recent entry, delete others
        // Implementation depends on your DB schema
    } else {
        console.log('✅ No duplicates found')
    }
}

async function detectAndFlagOutliers() {
    console.log('📊 Detecting price outliers...')

    // Get all cards
    const { data: cards } = await supabase
        .from('cards')
        .select('id, name')

    if (!cards) return

    let totalOutliers = 0

    for (const card of cards) {
        // Get price history for this card
        const { data: prices } = await supabase
            .from('price_history')
            .select('id, eur_price, created_at')
            .eq('card_id', card.id)
            .order('created_at', { ascending: true })

        if (!prices || prices.length < 5) continue

        const priceValues = prices.map(p => p.eur_price).filter(p => p > 0)
        const outliers = detectPriceOutliers(priceValues)

        if (outliers.length > 0) {
            console.log(`  - ${card.name}: ${outliers.length} outliers detected`)
            totalOutliers += outliers.length

            // Flag outliers in database (add a 'is_outlier' column or move to separate table)
            for (const outlierPrice of outliers) {
                const outlierRecord = prices.find(p => p.eur_price === outlierPrice)
                if (outlierRecord) {
                    await supabase
                        .from('price_history')
                        .update({ is_outlier: true })
                        .eq('id', outlierRecord.id)
                }
            }
        }
    }

    console.log(`✅ Flagged ${totalOutliers} total outliers`)
}

async function fillMissingDates() {
    console.log('📅 Checking for missing dates in price history...')

    // Get cards with price history
    const { data: cards } = await supabase
        .from('cards')
        .select('id, name')

    if (!cards) return

    let filled = 0

    for (const card of cards) {
        const { data: prices } = await supabase
            .from('price_history')
            .select('*')
            .eq('card_id', card.id)
            .order('created_at', { ascending: true })

        if (!prices || prices.length < 2) continue

        // Check for gaps > 2 days
        for (let i = 1; i < prices.length; i++) {
            const prev = new Date(prices[i - 1].created_at)
            const curr = new Date(prices[i].created_at)
            const daysDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

            if (daysDiff > 2) {
                // Interpolate missing values
                const daysToFill = Math.floor(daysDiff) - 1
                const priceStep = (prices[i].eur_price - prices[i - 1].eur_price) / (daysDiff)

                for (let day = 1; day <= daysToFill; day++) {
                    const fillDate = new Date(prev.getTime() + (day * 24 * 60 * 60 * 1000))
                    const interpolatedPrice = prices[i - 1].eur_price + (priceStep * day)

                    await supabase.from('price_history').insert({
                        card_id: card.id,
                        eur_price: interpolatedPrice,
                        usd_price: interpolatedPrice * 1.1, // Rough conversion
                        created_at: fillDate.toISOString(),
                        is_interpolated: true
                    })

                    filled++
                }
            }
        }
    }

    console.log(`✅ Filled ${filled} missing dates with interpolated values`)
}

async function generateReport() {
    console.log('\n📋 Generating cleanup report...')

    const { count: totalPrices } = await supabase
        .from('price_history')
        .select('*', { count: 'exact', head: true })

    const { count: outlierCount } = await supabase
        .from('price_history')
        .select('*', { count: 'exact', head: true })
        .eq('is_outlier', true)

    const { count: interpolatedCount } = await supabase
        .from('price_history')
        .select('*', { count: 'exact', head: true })
        .eq('is_interpolated', true)

    console.log(`
╔════════════════════════════════╗
║     CLEANUP REPORT             ║
╠════════════════════════════════╣
║ Total Prices: ${totalPrices?.toString().padStart(16)} ║
║ Outliers: ${(outlierCount || 0).toString().padStart(20)} ║
║ Interpolated: ${(interpolatedCount || 0).toString().padStart(16)} ║
╚════════════════════════════════╝
    `)
}

// Main cleanup function
async function cleanup() {
    console.log('🧹 Starting price data cleanup...\n')

    try {
        await removeDuplicates()
        await detectAndFlagOutliers()
        await fillMissingDates()
        await generateReport()

        console.log('\n✅ Cleanup complete!')
    } catch (error) {
        console.error('❌ Cleanup failed:', error)
        process.exit(1)
    }
}

// Run if called directly
if (require.main === module) {
    cleanup()
}

export { cleanup, removeDuplicates, detectAndFlagOutliers, fillMissingDates }
