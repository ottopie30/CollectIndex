// API v1 Cards Search Endpoint
// GET /api/v1/cards/search?q=charizard&limit=20

import { NextResponse } from 'next/server'
import { searchCards, TCGdexCard } from '@/lib/tcgdex'
import { getMultilingualSearchTerms } from '@/lib/translations'
import { getTierFromRequest } from '@/lib/api/apiKeys'
import { withRateLimit } from '@/lib/api/rateLimit'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    if (!query || query.length < 2) {
        return NextResponse.json(
            { error: 'Query parameter "q" is required and must be at least 2 characters' },
            { status: 400 }
        )
    }

    // Get tier and check rate limit
    const { tier, identifier } = await getTierFromRequest(request)
    const { allowed, headers, result } = withRateLimit(identifier, tier)

    if (!allowed) {
        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                resetAt: result.resetAt.toISOString()
            },
            { status: 429, headers }
        )
    }

    try {
        // Search with multilingual support
        const searchTerms = getMultilingualSearchTerms(query)

        const allResults = await Promise.all(
            searchTerms.map(term => searchCards(term))
        )

        // Merge and deduplicate
        const seen = new Set<string>()
        const cards: TCGdexCard[] = []

        for (const results of allResults) {
            for (const card of results) {
                if (!seen.has(card.id)) {
                    seen.add(card.id)
                    cards.push(card)
                }
            }
        }

        // Format response
        const response = cards.slice(0, limit).map(card => ({
            id: card.id,
            name: card.name,
            set: card.set?.name || null,
            setId: card.set?.id || null,
            rarity: card.rarity || null,
            imageUrl: card.image ? `${card.image}/high.webp` : null
        }))

        return NextResponse.json(response, { headers })

    } catch (error) {
        console.error('API search error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers }
        )
    }
}
