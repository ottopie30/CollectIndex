// API v1 Card Details Endpoint
// GET /api/v1/cards/[id]

import { NextResponse } from 'next/server'
import { getCard } from '@/lib/tcgdex'
import { getCardWithPrices, getAllPrices } from '@/lib/pokemontcg'
import { calculateSimplifiedScore } from '@/lib/scoring'
import { getTierFromRequest } from '@/lib/api/apiKeys'
import { withRateLimit } from '@/lib/api/rateLimit'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: cardId } = await params

    // Get tier and check rate limit
    const { tier, identifier } = await getTierFromRequest(request)
    const { allowed, headers, result } = withRateLimit(identifier, tier)

    if (!allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded', resetAt: result.resetAt.toISOString() },
            { status: 429, headers }
        )
    }

    try {
        // Fetch card data from TCGdex
        const card = await getCard(cardId)

        if (!card) {
            return NextResponse.json(
                { error: 'Card not found' },
                { status: 404, headers }
            )
        }

        // Try to get price data from Pokemon TCG API
        const priceCard = await getCardWithPrices(cardId)
        const prices = priceCard ? getAllPrices(priceCard) : null

        // Calculate speculation score
        const score = calculateSimplifiedScore({
            rarity: card.rarity,
            setId: card.set?.id,
            pokemonName: card.name
        })

        const response = {
            id: card.id,
            name: card.name,
            set: {
                id: card.set?.id || null,
                name: card.set?.name || null,
                logo: card.set?.logo || null
            },
            rarity: card.rarity || null,
            category: card.category || null,
            hp: card.hp || null,
            types: card.types || [],
            illustrator: card.illustrator || null,
            images: {
                small: card.image ? `${card.image}/low.webp` : null,
                large: card.image ? `${card.image}/high.webp` : null
            },
            prices: prices ? {
                cardmarket: prices.cardmarket ? {
                    trendPrice: prices.cardmarket.trend,
                    lowPrice: prices.cardmarket.low,
                    avg30: prices.cardmarket.avg30,
                    avg7: prices.cardmarket.avg7
                } : null,
                tcgplayer: prices.tcgplayer ? {
                    market: prices.tcgplayer.market,
                    low: prices.tcgplayer.low,
                    high: prices.tcgplayer.high
                } : null
            } : null,
            scores: {
                speculation: score
            }
        }

        return NextResponse.json(response, { headers })

    } catch (error) {
        console.error('API card detail error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers }
        )
    }
}
