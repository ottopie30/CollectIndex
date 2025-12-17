import { NextResponse } from 'next/server'
import { getCardPrice, getCardPrices, generatePriceHistory, getCacheStats } from '@/lib/prices'

export const dynamic = 'force-dynamic'

// GET /api/prices?cardId=xxx or ?cardIds=xxx,yyy,zzz
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')
    const cardIds = searchParams.get('cardIds')
    const includeHistory = searchParams.get('history') === 'true'
    const days = parseInt(searchParams.get('days') || '90')

    try {
        // Single card price
        if (cardId) {
            const price = await getCardPrice(cardId)

            if (!price) {
                return NextResponse.json(
                    { error: 'Card not found' },
                    { status: 404 }
                )
            }

            const response: Record<string, unknown> = { ...price }

            if (includeHistory) {
                response.history = generatePriceHistory(cardId, days)
            }

            return NextResponse.json(response)
        }

        // Multiple cards prices
        if (cardIds) {
            const ids = cardIds.split(',').slice(0, 50) // Max 50 cards
            const prices = await getCardPrices(ids)

            return NextResponse.json({
                prices: Object.fromEntries(prices),
                count: prices.size,
                requested: ids.length
            })
        }

        // No card specified - return cache stats
        const stats = getCacheStats()
        return NextResponse.json({
            message: 'Price API',
            usage: 'GET /api/prices?cardId=xxx or ?cardIds=xxx,yyy',
            cache: stats
        })

    } catch (error) {
        console.error('Price API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/prices/sync - Sync prices for specified cards
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { cardIds } = body

        if (!cardIds || !Array.isArray(cardIds)) {
            return NextResponse.json(
                { error: 'cardIds array required' },
                { status: 400 }
            )
        }

        // Limit to 100 cards per sync
        const ids = cardIds.slice(0, 100)
        const prices = await getCardPrices(ids)

        return NextResponse.json({
            success: true,
            synced: prices.size,
            prices: Object.fromEntries(prices)
        })

    } catch (error) {
        console.error('Price sync error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
