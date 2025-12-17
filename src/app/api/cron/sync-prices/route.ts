import { NextResponse } from 'next/server'
import { getCardPrices, clearExpiredCache } from '@/lib/prices'

// This endpoint is called by Vercel Cron
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/sync-prices", "schedule": "0 */6 * * *" }] }

export const dynamic = 'force-dynamic'

// List of popular cards to sync regularly
const POPULAR_CARDS = [
    'base1-4', // Charizard
    'base1-58', // Pikachu
    'neo1-9', // Lugia
    'neo1-11', // Mewtwo
    'sv1-1', // Sprigatito
    'sv1-195', // Koraidon
    'swsh12pt5-160', // Pikachu VMAX
    'swsh9-166', // Charizard V
    'sm12-195', // Umbreon
    'xy12-26', // Reshiram
]

export async function GET(request: Request) {
    // Verify cron secret (set in Vercel environment)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, verify the request is from Vercel Cron
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        const startTime = Date.now()

        // Clear expired cache first
        const cleared = clearExpiredCache()

        // Sync popular cards
        const prices = await getCardPrices(POPULAR_CARDS)

        const duration = Date.now() - startTime

        return NextResponse.json({
            success: true,
            synced: prices.size,
            cacheCleared: cleared,
            cards: POPULAR_CARDS,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Cron sync error:', error)
        return NextResponse.json(
            { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
