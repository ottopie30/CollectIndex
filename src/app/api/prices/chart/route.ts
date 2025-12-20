import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/prices/chart?cardId=xxx&days=90
 * Returns price history from snapshots table for charting
 */
export async function GET(request: NextRequest) {
    const cardId = request.nextUrl.searchParams.get('cardId')
    const days = parseInt(request.nextUrl.searchParams.get('days') || '90')

    if (!cardId) {
        return NextResponse.json({ error: 'cardId required' }, { status: 400 })
    }

    try {
        // Calculate start date
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        const startDateStr = startDate.toISOString().split('T')[0]

        // Fetch price snapshots
        const { data: snapshots, error } = await supabase
            .from('price_snapshots')
            .select('date, trend_price, avg_sell_price, low_price, tcgplayer_price')
            .eq('card_id', cardId)
            .gte('date', startDateStr)
            .order('date', { ascending: true })

        if (error) {
            console.error('Error fetching price snapshots:', error)
            throw error
        }

        // Format for chart
        const chartData = (snapshots || []).map(s => ({
            date: s.date,
            price: s.trend_price || s.avg_sell_price || 0,
            trend: s.trend_price,
            avg: s.avg_sell_price,
            low: s.low_price,
            tcgplayer: s.tcgplayer_price
        }))

        // Calculate statistics
        let priceChange = 0
        let highestPrice = 0
        let lowestPrice = Infinity

        if (chartData.length >= 2) {
            const first = chartData[0].price || 0
            const last = chartData[chartData.length - 1].price || 0
            if (first > 0) {
                priceChange = ((last - first) / first) * 100
            }
        }

        for (const point of chartData) {
            if (point.price) {
                highestPrice = Math.max(highestPrice, point.price)
                lowestPrice = Math.min(lowestPrice, point.price)
            }
        }

        return NextResponse.json({
            cardId,
            days,
            history: chartData,
            stats: {
                priceChange: Math.round(priceChange * 10) / 10,
                currentPrice: chartData.length > 0 ? chartData[chartData.length - 1].price : null,
                highestPrice: highestPrice > 0 ? highestPrice : null,
                lowestPrice: lowestPrice < Infinity ? lowestPrice : null,
                dataPoints: chartData.length
            }
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch price history' },
            { status: 500 }
        )
    }
}
