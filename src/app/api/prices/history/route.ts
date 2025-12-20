import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client for reading
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const cardmarketId = searchParams.get('cardmarketId')
    const tcgdexId = searchParams.get('tcgdexId')
    const days = parseInt(searchParams.get('days') || '90')

    // Need either cardmarketId or tcgdexId
    if (!cardmarketId && !tcgdexId) {
        return NextResponse.json(
            { error: 'cardmarketId or tcgdexId required' },
            { status: 400 }
        )
    }

    try {
        let cmId = cardmarketId ? parseInt(cardmarketId) : null

        // If tcgdexId provided, look up cardmarket mapping
        if (tcgdexId && !cmId) {
            const { data: mapping, error: mapError } = await supabase
                .from('cardmarket_mapping')
                .select('cardmarket_id')
                .eq('tcgdex_id', tcgdexId)
                .single()

            if (mapError || !mapping) {
                return NextResponse.json({
                    history: [],
                    message: 'No Cardmarket mapping found for this card'
                })
            }

            cmId = mapping.cardmarket_id
        }

        if (!cmId) {
            return NextResponse.json({ history: [] })
        }

        // Get price history for the last N days
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        const startDateStr = startDate.toISOString().split('T')[0]

        const { data: history, error } = await supabase
            .from('price_history')
            .select('date, avg, low, trend, avg7, avg30, trend_holo')
            .eq('cardmarket_id', cmId)
            .gte('date', startDateStr)
            .order('date', { ascending: true })

        if (error) {
            console.error('Failed to fetch price history:', error)
            throw error
        }

        // Format for chart
        const chartData = (history || []).map(h => ({
            date: h.date,
            price: h.trend || h.avg || h.low || 0,
            low: h.low,
            trend: h.trend,
            avg7: h.avg7,
            avg30: h.avg30,
            trendHolo: h.trend_holo
        }))

        // Calculate price change
        let priceChange = 0
        if (chartData.length >= 2) {
            const first = chartData[0].price
            const last = chartData[chartData.length - 1].price
            if (first > 0) {
                priceChange = ((last - first) / first) * 100
            }
        }

        return NextResponse.json({
            cardmarketId: cmId,
            history: chartData,
            priceChange: Math.round(priceChange * 10) / 10,
            currentPrice: chartData.length > 0 ? chartData[chartData.length - 1].price : null,
            dataPoints: chartData.length
        })
    } catch (error: any) {
        console.error('Price history error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch price history' },
            { status: 500 }
        )
    }
}
