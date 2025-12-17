import { supabase, Card, PriceHistory } from '../supabase'

// TCGdex API pour récupérer les données avec prix
const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en'

export type TCGdexCardWithPricing = {
    id: string
    localId: string
    name: string
    image?: string
    category?: string
    illustrator?: string
    rarity?: string
    set: {
        id: string
        name: string
        logo?: string
        symbol?: string
    }
    variants?: {
        firstEdition: boolean
        holo: boolean
        normal: boolean
        reverse: boolean
    }
    hp?: number
    types?: string[]
    stage?: string
    // Pricing data
    tcgplayer?: {
        url?: string
        updatedAt?: string
        prices?: {
            normal?: { low?: number; mid?: number; high?: number; market?: number }
            holofoil?: { low?: number; mid?: number; high?: number; market?: number }
            reverseHolofoil?: { low?: number; mid?: number; high?: number; market?: number }
            firstEdition?: { low?: number; mid?: number; high?: number; market?: number }
        }
    }
    cardmarket?: {
        url?: string
        updatedAt?: string
        prices?: {
            averageSellPrice?: number
            avg1?: number
            avg7?: number
            avg30?: number
            lowPrice?: number
            trendPrice?: number
            germanProLow?: number
            suggestedPrice?: number
        }
    }
}

/**
 * Fetch a single card with full pricing data
 */
export async function fetchCardWithPricing(cardId: string): Promise<TCGdexCardWithPricing | null> {
    try {
        const response = await fetch(`${TCGDEX_API_BASE}/cards/${cardId}`)
        if (!response.ok) return null
        return response.json()
    } catch (error) {
        console.error(`Error fetching card ${cardId}:`, error)
        return null
    }
}

/**
 * Fetch all cards from a set
 */
export async function fetchSetCards(setId: string): Promise<TCGdexCardWithPricing[]> {
    try {
        const response = await fetch(`${TCGDEX_API_BASE}/sets/${setId}`)
        if (!response.ok) return []
        const set = await response.json()

        // Get basic card list from set
        const cardIds = set.cards?.map((c: { id: string }) => c.id) || []

        // Fetch full details for each card (with rate limiting)
        const cards: TCGdexCardWithPricing[] = []
        for (const cardId of cardIds) {
            const card = await fetchCardWithPricing(cardId)
            if (card) {
                cards.push(card)
            }
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        return cards
    } catch (error) {
        console.error(`Error fetching set ${setId}:`, error)
        return []
    }
}

/**
 * Get all available sets
 */
export async function fetchAllSets(): Promise<{ id: string; name: string; total: number }[]> {
    try {
        const response = await fetch(`${TCGDEX_API_BASE}/sets`)
        if (!response.ok) return []
        const sets = await response.json()
        return sets.map((s: { id: string; name: string; cardCount?: { total?: number } }) => ({
            id: s.id,
            name: s.name,
            total: s.cardCount?.total || 0
        }))
    } catch (error) {
        console.error('Error fetching sets:', error)
        return []
    }
}

/**
 * Extract best price from TCGdex card data
 */
export function extractPrice(card: TCGdexCardWithPricing): {
    priceEUR: number | null
    priceUSD: number | null
    source: 'cardmarket' | 'tcgplayer' | null
} {
    // Try CardMarket first (EUR)
    const cardmarketPrice = card.cardmarket?.prices?.trendPrice
        || card.cardmarket?.prices?.averageSellPrice
        || card.cardmarket?.prices?.avg7

    // Try TCGPlayer (USD)
    const tcgplayerPrices = card.tcgplayer?.prices
    const tcgplayerPrice =
        tcgplayerPrices?.holofoil?.market ||
        tcgplayerPrices?.normal?.market ||
        tcgplayerPrices?.reverseHolofoil?.market ||
        tcgplayerPrices?.firstEdition?.market

    return {
        priceEUR: cardmarketPrice || null,
        priceUSD: tcgplayerPrice || null,
        source: cardmarketPrice ? 'cardmarket' : tcgplayerPrice ? 'tcgplayer' : null
    }
}

/**
 * Upsert a card into Supabase
 */
export async function upsertCard(card: TCGdexCardWithPricing): Promise<string | null> {
    try {
        const { priceEUR, priceUSD, source } = extractPrice(card)

        // Upsert card
        const { data, error } = await supabase
            .from('cards')
            .upsert({
                tcgdex_id: card.id,
                name: card.name,
                set_name: card.set?.name || 'Unknown',
                set_id: card.set?.id || 'unknown',
                rarity: card.rarity || null,
                category: card.category || null,
                illustrator: card.illustrator || null,
                hp: card.hp || null,
                types: card.types || [],
                image_url: card.image ? `${card.image}/high.webp` : null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'tcgdex_id'
            })
            .select('id')
            .single()

        if (error) {
            console.error(`Error upserting card ${card.id}:`, error)
            return null
        }

        const cardId = data?.id

        // Record price history if available
        if (cardId && (priceEUR || priceUSD)) {
            await recordPriceHistory(cardId, priceEUR, priceUSD, source)
        }

        return cardId
    } catch (error) {
        console.error(`Error in upsertCard for ${card.id}:`, error)
        return null
    }
}

/**
 * Record price history for a card
 */
export async function recordPriceHistory(
    cardId: string,
    priceEUR: number | null,
    priceUSD: number | null,
    source: 'cardmarket' | 'tcgplayer' | null
): Promise<void> {
    try {
        const records: Partial<PriceHistory>[] = []

        if (priceEUR) {
            records.push({
                card_id: cardId,
                price: priceEUR,
                source: 'cardmarket',
                listing_type: 'sold',
                recorded_at: new Date().toISOString()
            })
        }

        if (priceUSD) {
            records.push({
                card_id: cardId,
                price: priceUSD,
                source: 'tcgplayer',
                listing_type: 'sold',
                recorded_at: new Date().toISOString()
            })
        }

        if (records.length > 0) {
            const { error } = await supabase.from('price_history').insert(records)
            if (error) {
                console.error(`Error recording price history for ${cardId}:`, error)
            }
        }
    } catch (error) {
        console.error(`Error in recordPriceHistory:`, error)
    }
}

/**
 * Ingest all cards from a set
 */
export async function ingestSet(setId: string): Promise<{
    success: number
    failed: number
    withPricing: number
}> {
    console.log(`Starting ingestion for set: ${setId}`)

    const cards = await fetchSetCards(setId)
    console.log(`Found ${cards.length} cards in set ${setId}`)

    let success = 0
    let failed = 0
    let withPricing = 0

    for (const card of cards) {
        const cardId = await upsertCard(card)
        if (cardId) {
            success++
            const { priceEUR, priceUSD } = extractPrice(card)
            if (priceEUR || priceUSD) {
                withPricing++
            }
        } else {
            failed++
        }
    }

    console.log(`Set ${setId} ingestion complete: ${success} success, ${failed} failed, ${withPricing} with pricing`)

    return { success, failed, withPricing }
}

/**
 * Ingest multiple sets
 */
export async function ingestSets(setIds: string[]): Promise<{
    totalSuccess: number
    totalFailed: number
    totalWithPricing: number
    setResults: Record<string, { success: number; failed: number; withPricing: number }>
}> {
    let totalSuccess = 0
    let totalFailed = 0
    let totalWithPricing = 0
    const setResults: Record<string, { success: number; failed: number; withPricing: number }> = {}

    for (const setId of setIds) {
        const result = await ingestSet(setId)
        setResults[setId] = result
        totalSuccess += result.success
        totalFailed += result.failed
        totalWithPricing += result.withPricing

        // Delay between sets
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return { totalSuccess, totalFailed, totalWithPricing, setResults }
}
