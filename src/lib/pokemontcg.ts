// Pokemon TCG API integration for real market prices
// API: https://pokemontcg.io - Free, provides TCGPlayer prices

// Use local proxy to avoid CORS and hide API Key
const POKEMON_TCG_API_BASE = '/api'

// API Key is handled server-side in the proxy route
const API_KEY = ''

export type PokemonTCGPrice = {
    low: number | null
    mid: number | null
    high: number | null
    market: number | null
    directLow: number | null
}

export type PokemonTCGPrices = {
    tcgplayer?: {
        url: string
        updatedAt: string
        prices?: {
            normal?: PokemonTCGPrice
            holofoil?: PokemonTCGPrice
            reverseHolofoil?: PokemonTCGPrice
            '1stEditionHolofoil'?: PokemonTCGPrice
        }
    }
    cardmarket?: {
        url: string
        updatedAt: string
        prices?: {
            averageSellPrice: number | null
            lowPrice: number | null
            trendPrice: number | null
            avg1: number | null
            avg7: number | null
            avg30: number | null
            reverseHoloAvg1?: number | null
            reverseHoloAvg7?: number | null
            reverseHoloAvg30?: number | null
        }
    }
}

export type PokemonTCGCard = {
    id: string
    name: string
    supertype: string
    subtypes?: string[]
    hp?: string
    types?: string[]
    evolvesFrom?: string
    evolvesTo?: string[]
    rules?: string[]
    set: {
        id: string
        name: string
        series: string
        printedTotal: number
        total: number
        releaseDate: string
        images: {
            symbol: string
            logo: string
        }
    }
    number: string
    artist?: string
    rarity?: string
    nationalPokedexNumbers?: number[]
    images: {
        small: string
        large: string
    }
    tcgplayer?: PokemonTCGPrices['tcgplayer']
    cardmarket?: PokemonTCGPrices['cardmarket']
}

// Fetch headers (No API Key needed here anymore)
function getHeaders(): HeadersInit {
    return {}
}

// Search cards by name
// Search cards (Flexible query)
export async function searchCardsWithPrices(query: string, limit = 20): Promise<PokemonTCGCard[]> {
    try {
        // If query contains ':', treat as raw query (e.g. '!name:"Aggron" number:1')
        // Otherwise treat as simple name search
        const qParam = query.includes(':')
            ? query
            : `name:"${query}*"` // Wildcard for better matches

        const response = await fetch(
            `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(qParam)}&pageSize=${limit}&orderBy=-set.releaseDate`,
            { headers: getHeaders() }
        )
        if (!response.ok) {
            console.error('Pokemon TCG API error:', response.status)
            return []
        }
        const data = await response.json()
        return data.data || []
    } catch (error) {
        console.error('Pokemon TCG API search error:', error)
        return []
    }
}

// Get single card with prices
export async function getCardWithPrices(cardId: string): Promise<PokemonTCGCard | null> {
    try {
        const response = await fetch(
            `${POKEMON_TCG_API_BASE}/cards/${cardId}`,
            { headers: getHeaders() }
        )
        if (!response.ok) {
            console.error('Pokemon TCG API error:', response.status)
            return null
        }
        const data = await response.json()
        return data.data || null
    } catch (error) {
        console.error('Pokemon TCG API get card error:', error)
        return null
    }
}

// Get best market price from a card
export function getBestMarketPrice(card: PokemonTCGCard): { price: number; source: string; variant: string } | null {
    // Try CardMarket first (EUR)
    if (card.cardmarket?.prices) {
        const cm = card.cardmarket.prices
        if (cm.trendPrice) {
            return { price: cm.trendPrice, source: 'cardmarket', variant: 'trend' }
        }
        if (cm.averageSellPrice) {
            return { price: cm.averageSellPrice, source: 'cardmarket', variant: 'average' }
        }
    }

    // Fallback to TCGPlayer (USD)
    if (card.tcgplayer?.prices) {
        const tcg = card.tcgplayer.prices
        // Check different variants
        for (const variant of ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil'] as const) {
            const variantPrices = tcg[variant]
            if (variantPrices?.market) {
                return { price: variantPrices.market, source: 'tcgplayer', variant }
            }
        }
    }

    return null
}

// Get all prices for a card
export function getAllPrices(card: PokemonTCGCard): {
    cardmarket: { trend?: number; low?: number; avg30?: number; avg7?: number; avg1?: number } | null
    tcgplayer: { market?: number; low?: number; mid?: number; high?: number } | null
} {
    const result = {
        cardmarket: null as { trend?: number; low?: number; avg30?: number; avg7?: number; avg1?: number } | null,
        tcgplayer: null as { market?: number; low?: number; mid?: number; high?: number } | null
    }

    if (card.cardmarket?.prices) {
        const cm = card.cardmarket.prices
        result.cardmarket = {
            trend: cm.trendPrice ?? undefined,
            low: cm.lowPrice ?? undefined,
            avg30: cm.avg30 ?? undefined,
            avg7: cm.avg7 ?? undefined,
            avg1: cm.avg1 ?? undefined
        }
    }

    if (card.tcgplayer?.prices) {
        // Get normal or holofoil prices
        const variant = card.tcgplayer.prices.holofoil || card.tcgplayer.prices.normal
        if (variant) {
            result.tcgplayer = {
                market: variant.market ?? undefined,
                low: variant.low ?? undefined,
                mid: variant.mid ?? undefined,
                high: variant.high ?? undefined
            }
        }
    }

    return result
}

// Convert TCGdex ID to Pokemon TCG ID format
// TCGdex: "base1-4" → Pokemon TCG: "base1-4" (usually same)
export function convertTCGdexId(tcgdexId: string): string {
    // Most IDs are compatible, but some sets might differ
    return tcgdexId
}
