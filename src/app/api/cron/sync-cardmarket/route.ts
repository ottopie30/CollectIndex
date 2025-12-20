import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchPriceGuide, CardmarketPriceGuide } from '@/lib/cardmarket'

// Supabase admin client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.log('🔄 Starting Cardmarket price sync...')

    try {
        // 1. Fetch all Cardmarket price guides
        const priceGuide = await fetchPriceGuide()
        console.log(`📦 Loaded ${priceGuide.size} price entries`)

        // 2. Get today's date
        const today = new Date().toISOString().split('T')[0]

        // 3. Get all mapped card IDs from database
        const { data: mappings, error: mappingError } = await supabase
            .from('cardmarket_mapping')
            .select('cardmarket_id')

        if (mappingError) {
            console.error('❌ Failed to fetch mappings:', mappingError)
            throw mappingError
        }

        if (!mappings || mappings.length === 0) {
            console.log('⚠️ No card mappings found. Syncing top 1000 prices instead.')
            // If no mappings exist, store top 1000 entries (highest trend prices)
            const topPrices = Array.from(priceGuide.values())
                .filter(p => p.trend !== null && p.trend > 10) // Only cards worth > 10€
                .sort((a, b) => (b.trend || 0) - (a.trend || 0))
                .slice(0, 1000)

            const priceRecords = topPrices.map(p => formatPriceRecord(p, today))

            const { error: insertError } = await supabase
                .from('price_history')
                .upsert(priceRecords, { onConflict: 'cardmarket_id,date' })

            if (insertError) {
                console.error('❌ Failed to insert prices:', insertError)
                throw insertError
            }

            const duration = Date.now() - startTime
            return NextResponse.json({
                success: true,
                message: `Synced ${topPrices.length} top prices (no mappings)`,
                duration: `${duration}ms`
            })
        }

        // 4. Filter and format price records for mapped cards
        const cardmarketIds = new Set(mappings.map(m => m.cardmarket_id))
        const priceRecords: any[] = []

        for (const [idProduct, guide] of priceGuide) {
            if (cardmarketIds.has(idProduct)) {
                priceRecords.push(formatPriceRecord(guide, today))
            }
        }

        console.log(`📊 Syncing ${priceRecords.length} prices for mapped cards`)

        // 5. Upsert price records in batches
        const BATCH_SIZE = 500
        let inserted = 0

        for (let i = 0; i < priceRecords.length; i += BATCH_SIZE) {
            const batch = priceRecords.slice(i, i + BATCH_SIZE)

            const { error: upsertError } = await supabase
                .from('price_history')
                .upsert(batch, { onConflict: 'cardmarket_id,date' })

            if (upsertError) {
                console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, upsertError)
            } else {
                inserted += batch.length
            }
        }

        const duration = Date.now() - startTime
        console.log(`✅ Cardmarket sync complete: ${inserted} prices in ${duration}ms`)

        return NextResponse.json({
            success: true,
            synced: inserted,
            total: priceGuide.size,
            date: today,
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

/**
 * Format a Cardmarket price guide entry for database insertion
 */
function formatPriceRecord(guide: CardmarketPriceGuide, date: string): any {
    return {
        cardmarket_id: guide.idProduct,
        date,
        avg: guide.avg,
        low: guide.low,
        trend: guide.trend,
        avg1: guide.avg1,
        avg7: guide.avg7,
        avg30: guide.avg30,
        avg_holo: guide['avg-holo'],
        low_holo: guide['low-holo'],
        trend_holo: guide['trend-holo'],
        avg7_holo: guide['avg7-holo'],
        avg30_holo: guide['avg30-holo']
    }
}
