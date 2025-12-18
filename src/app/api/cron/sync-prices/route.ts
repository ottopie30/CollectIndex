// Cron job API route for syncing prices to database
// This endpoint is called daily by Vercel Cron

import { NextResponse } from 'next/server'
import { searchCardsWithPrices } from '@/lib/pokemontcg'
import { savePricesBatch } from '@/lib/priceDb'

// Popular Pokemon cards to sync daily
const POPULAR_POKEMON = [
    'charizard',
    'pikachu',
    'mewtwo',
    'mew',
    'blastoise',
    'gyarados',
    'gengar',
    'alakazam',
    'dragonite',
    'snorlax',
    'eevee',
    'lugia',
    'ho-oh',
    'rayquaza',
    'umbreon'
]

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds timeout

export async function GET(request: Request) {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const startTime = Date.now()
        let totalSaved = 0
        let totalFailed = 0

        console.log(`[CRON] Starting price sync at ${new Date().toISOString()}`)

        // Sync prices for popular Pokemon
        for (const pokemon of POPULAR_POKEMON) {
            try {
                const cards = await searchCardsWithPrices(pokemon, 10)
                const { saved, failed } = await savePricesBatch(cards)
                totalSaved += saved
                totalFailed += failed
                console.log(`[CRON] ${pokemon}: ${saved} saved, ${failed} failed`)
            } catch (error) {
                console.error(`[CRON] Error syncing ${pokemon}:`, error)
                totalFailed += 1
            }

            // Rate limiting - wait 500ms between calls
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        const duration = Date.now() - startTime

        return NextResponse.json({
            success: true,
            message: 'Price sync completed',
            stats: {
                saved: totalSaved,
                failed: totalFailed,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('[CRON] Price sync failed:', error)
        return NextResponse.json(
            { error: 'Price sync failed', details: String(error) },
            { status: 500 }
        )
    }
}

// Also allow POST for manual triggers
export async function POST(request: Request) {
    return GET(request)
}
