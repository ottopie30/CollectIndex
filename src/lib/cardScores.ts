/**
 * Card Scores Service - Fetch and calculate card scores from Supabase
 */

import { createClient } from '@/lib/auth'

export type CardScore = {
    id: string
    card_id: string
    score_total: number
    d1_volatility: number
    d2_growth: number
    d3_scarcity: number
    d4_sentiment: number
    d5_macro: number
    calculated_at: string
}

export type PriceHistoryPoint = {
    date: string
    price: number
    volume?: number
}

/**
 * Get score for a card by tcgdex_id
 */
export async function getCardScore(tcgdexId: string): Promise<number> {
    const supabase = createClient()

    // First get the card UUID from tcgdex_id
    const { data: card } = await supabase
        .from('cards')
        .select('id')
        .eq('tcgdex_id', tcgdexId)
        .single()

    if (!card) {
        // Generate consistent score based on id hash
        return hashScore(tcgdexId)
    }

    // Get latest score
    const { data: score } = await supabase
        .from('speculation_scores')
        .select('score_total')
        .eq('card_id', card.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

    return score?.score_total || hashScore(tcgdexId)
}

/**
 * Get full score details for a card
 */
export async function getCardScoreDetails(tcgdexId: string): Promise<CardScore | null> {
    const supabase = createClient()

    const { data: card } = await supabase
        .from('cards')
        .select('id')
        .eq('tcgdex_id', tcgdexId)
        .single()

    if (!card) return null

    const { data } = await supabase
        .from('speculation_scores')
        .select('*')
        .eq('card_id', card.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

    return data
}

/**
 * Get price history for a card
 */
export async function getPriceHistory(tcgdexId: string): Promise<PriceHistoryPoint[]> {
    const supabase = createClient()

    const { data: card } = await supabase
        .from('cards')
        .select('id')
        .eq('tcgdex_id', tcgdexId)
        .single()

    if (!card) {
        return generateFallbackHistory(tcgdexId)
    }

    const { data } = await supabase
        .from('price_history')
        .select('price, recorded_at')
        .eq('card_id', card.id)
        .order('recorded_at', { ascending: true })
        .limit(30)

    if (!data || data.length === 0) {
        return generateFallbackHistory(tcgdexId)
    }

    return data.map((p: any) => ({
        date: p.recorded_at.split('T')[0],
        price: p.price,
        volume: Math.floor(Math.random() * 1000)
    }))
}

/**
 * Generate consistent hash-based score for cards not in DB
 */
function hashScore(id: string): number {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return Math.abs(hash % 100)
}

/**
 * Generate fallback price history for cards not in DB
 */
function generateFallbackHistory(cardId: string): PriceHistoryPoint[] {
    const basePrice = 10 + hashScore(cardId) * 5
    const history: PriceHistoryPoint[] = []

    for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        const variation = (Math.sin(i * 0.5 + hashScore(cardId)) * 0.2) + 1
        const price = basePrice * variation

        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price * 100) / 100,
            volume: Math.floor(Math.random() * 1000)
        })
    }

    return history
}
