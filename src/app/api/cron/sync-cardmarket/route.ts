import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchPriceGuide } from '@/lib/cardmarket'

/**
 * Cardmarket Daily Price Sync
 * 
 * This cron job fetches ALL prices from Cardmarket's public PriceGuide
 * in a SINGLE HTTP call (~180,000 prices in one 13MB JSON file)
 * 
 * Much more efficient than individual API calls!
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sends this)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const startTime = Date.now()
    console.log('🔄 Starting Cardmarket daily price sync...')

    try {
        // 1. Fetch ALL prices from Cardmarket (one HTTP call!)
        const priceGuide = await fetchPriceGuide()
        console.log(`💰 Loaded ${priceGuide.size} price entries from Cardmarket`)

        // 2. Get today's date
        const today = new Date().toISOString().split('T')[0]

        // 3. Get all cards we have mappings for
        const { data: mappings, error: mappingError } = await supabase
            .from('cardmarket_mapping')
            .select('cardmarket_id, tcgdex_id, card_name')

        if (mappingError) {
            console.error('❌ Failed to fetch mappings:', mappingError)
            throw mappingError
        }

        console.log(`📋 Found ${mappings?.length || 0} mapped cards`)

        // 4. Prepare batch of prices to insert
        const priceRecords: any[] = []
        const cardPriceUpdates: any[] = []

        for (const mapping of mappings || []) {
            const price = priceGuide.get(mapping.cardmarket_id)
            if (price) {
                // For price_history table (historical tracking)
                priceRecords.push({
                    cardmarket_id: mapping.cardmarket_id,
                    date: today,
                    avg: price.avg,
                    low: price.low,
                    trend: price.trend,
                    avg1: price.avg1,
                    avg7: price.avg7,
                    avg30: price.avg30,
                    avg_holo: price['avg-holo'],
                    low_holo: price['low-holo'],
                    trend_holo: price['trend-holo'],
                    avg7_holo: price['avg7-holo'],
                    avg30_holo: price['avg30-holo']
                })

                // For card_prices table (current prices for quick lookup)
                cardPriceUpdates.push({
                    id: mapping.tcgdex_id,
                    name: mapping.card_name,
                    trend_price: price.trend,
                    avg_sell_price: price.avg,
                    low_price: price.low,
                    updated_at: new Date().toISOString()
                })
            }
        }

        console.log(`📊 Prepared ${priceRecords.length} price records`)

        // 5. Batch insert price history
        const BATCH_SIZE = 500
        let historyInserted = 0

        for (let i = 0; i < priceRecords.length; i += BATCH_SIZE) {
            const batch = priceRecords.slice(i, i + BATCH_SIZE)
            const { error } = await supabase
                .from('price_history')
                .upsert(batch, { onConflict: 'cardmarket_id,date' })

            if (error) {
                console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error)
            } else {
                historyInserted += batch.length
            }
        }

        // 6. Update card_prices for quick lookup
        let pricesUpdated = 0
        for (let i = 0; i < cardPriceUpdates.length; i += BATCH_SIZE) {
            const batch = cardPriceUpdates.slice(i, i + BATCH_SIZE)
            const { error } = await supabase
                .from('card_prices')
                .upsert(batch, { onConflict: 'id' })

            if (!error) {
                pricesUpdated += batch.length
            }
        }

        const duration = Date.now() - startTime
        console.log(`✅ Cardmarket sync complete in ${duration}ms`)
        console.log(`   📈 History: ${historyInserted} records`)
        console.log(`   💵 Prices: ${pricesUpdated} cards updated`)

        return NextResponse.json({
            success: true,
            date: today,
            totalPricesAvailable: priceGuide.size,
            mappedCards: mappings?.length || 0,
            historyInserted,
            pricesUpdated,
            duration: `${duration}ms`
        })

    } catch (error: any) {
        console.error('❌ Cardmarket sync failed:', error)
        return NextResponse.json(
            { error: error.message || 'Sync failed' },
            { status: 500 }
        )
    }
}
