// Cron Job: Sync top 20,000 most expensive cards' prices daily
// Protected by CRON_SECRET header
// Run at midnight UTC via Vercel Cron

import { NextRequest, NextResponse } from 'next/server'
import { bulkUpsertPrices, CachedPrice } from '@/lib/priceCache'

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const PAGE_SIZE = 250  // Max allowed by API
const MAX_CARDS = 20000
const MAX_PAGES = Math.ceil(MAX_CARDS / PAGE_SIZE)  // 80 pages

// Rate limiting: wait between requests to avoid 429s
const DELAY_MS = 500

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minute max (enough for 80 pages with delays)

export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sends this automatically)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow local dev without secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    console.log('🚀 Starting price sync job...')
    const startTime = Date.now()

    const apiKey = process.env.POKEMON_TCG_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'POKEMON_TCG_API_KEY not set' }, { status: 500 })
    }

    let totalSynced = 0
    let page = 1
    let hasMore = true

    try {
        while (hasMore && page <= MAX_PAGES) {
            console.log(`📄 Fetching page ${page}/${MAX_PAGES}...`)

            // Query expensive cards: filter by set.releaseDate (recent sets have expensive cards)
            // Then we'll sort by price client-side for first sync
            const url = `${POKEMON_TCG_API}?q=cardmarket.prices.trendPrice:[10 TO *]&page=${page}&pageSize=${PAGE_SIZE}`
            console.log('API URL:', url)

            const response = await fetch(url, {
                headers: {
                    'X-Api-Key': apiKey
                }
            })

            console.log('API Response Status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`API error on page ${page}: ${response.status}`, errorText)
                // If rate limited, wait and retry
                if (response.status === 429) {
                    console.log('Rate limited, waiting 5s...')
                    await delay(5000)
                    continue
                }
                break
            }

            const data = await response.json()
            const cards = data.data || []

            if (cards.length === 0) {
                hasMore = false
                break
            }

            // Transform to cache format
            const cacheable: Partial<CachedPrice>[] = cards.map((card: any) => ({
                id: card.id,
                name: card.name,
                set_id: card.set?.id || null,
                set_name: card.set?.name || null,
                number: card.number || null,
                rarity: card.rarity || null,
                trend_price: card.cardmarket?.prices?.trendPrice || null,
                avg_sell_price: card.cardmarket?.prices?.averageSellPrice || null,
                low_price: card.cardmarket?.prices?.lowPrice || null,
                tcgplayer_price: card.tcgplayer?.prices?.holofoil?.market ||
                    card.tcgplayer?.prices?.normal?.market || null,
                image_small: card.images?.small || null,
                image_large: card.images?.large || null
            }))

            // Bulk upsert to Supabase
            const synced = await bulkUpsertPrices(cacheable)
            totalSynced += synced

            console.log(`✅ Page ${page}: synced ${synced} cards (total: ${totalSynced})`)

            // Check if we've reached the end
            if (cards.length < PAGE_SIZE) {
                hasMore = false
            }

            page++

            // Rate limit ourselves
            await delay(DELAY_MS)
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`🎉 Sync complete! ${totalSynced} cards in ${duration}s`)

        return NextResponse.json({
            success: true,
            synced: totalSynced,
            pages: page - 1,
            duration: `${duration}s`
        })

    } catch (error) {
        console.error('Sync job failed:', error)
        return NextResponse.json({
            error: 'Sync failed',
            synced: totalSynced,
            details: String(error)
        }, { status: 500 })
    }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
    return GET(request)
}
