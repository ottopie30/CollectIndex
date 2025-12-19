/**
 * API Route: GET /api/data/sentiment
 * Returns Reddit sentiment data for Pokemon TCG market
 * Query params: ?card=<cardName> for specific card, omit for market-wide
 */

import { NextResponse } from 'next/server'
import { getCardSentiment, getMarketSentiment } from '@/lib/data/sentiment'

export const dynamic = 'force-dynamic'
export const revalidate = 600 // 10 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const cardName = searchParams.get('card')

        if (cardName) {
            // Get sentiment for specific card
            const sentiment = await getCardSentiment(cardName)
            return NextResponse.json({
                success: true,
                type: 'card',
                data: sentiment,
                timestamp: new Date().toISOString()
            })
        } else {
            // Get overall market sentiment
            const sentiment = await getMarketSentiment()
            return NextResponse.json({
                success: true,
                type: 'market',
                data: sentiment,
                timestamp: new Date().toISOString()
            })
        }
    } catch (error) {
        console.error('Error fetching sentiment data:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sentiment data' },
            { status: 500 }
        )
    }
}
