// Price Cache Service - Read/Write prices from Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use service role for writes, anon for reads
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface CachedPrice {
    id: string
    name: string
    set_id: string | null
    set_name: string | null
    number: string | null
    rarity: string | null
    trend_price: number | null
    avg_sell_price: number | null
    low_price: number | null
    tcgplayer_price: number | null
    image_small: string | null
    image_large: string | null
    updated_at: string
}

/**
 * Get cached price for a card by ID
 * Returns null if not found or if older than maxAgeHours
 */
export async function getCachedPrice(cardId: string, maxAgeHours = 24): Promise<CachedPrice | null> {
    try {
        const { data, error } = await supabase
            .from('card_prices')
            .select('*')
            .eq('id', cardId)
            .single()

        if (error || !data) return null

        // Check if cache is stale
        const updatedAt = new Date(data.updated_at)
        const ageHours = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)

        if (ageHours > maxAgeHours) {
            console.log(`Cache stale for ${cardId} (${ageHours.toFixed(1)}h old)`)
            return null
        }

        return data as CachedPrice
    } catch (e) {
        console.error('Error reading price cache:', e)
        return null
    }
}

/**
 * Get cached price by set name and card number (fallback lookup)
 */
export async function getCachedPriceBySetAndNumber(
    setName: string,
    number: string,
    maxAgeHours = 24
): Promise<CachedPrice | null> {
    try {
        const { data, error } = await supabase
            .from('card_prices')
            .select('*')
            .ilike('set_name', `%${setName}%`)
            .eq('number', number)
            .order('trend_price', { ascending: false })
            .limit(1)
            .single()

        if (error || !data) return null

        const updatedAt = new Date(data.updated_at)
        const ageHours = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)

        if (ageHours > maxAgeHours) return null

        return data as CachedPrice
    } catch (e) {
        console.error('Error reading price cache by set:', e)
        return null
    }
}

/**
 * Upsert a single card price to cache
 */
export async function setCachedPrice(card: Partial<CachedPrice>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('card_prices')
            .upsert(card, { onConflict: 'id' })

        if (error) {
            console.error('Error writing price cache:', error)
            return false
        }
        return true
    } catch (e) {
        console.error('Error writing price cache:', e)
        return false
    }
}

/**
 * Bulk upsert prices (for cron sync)
 */
export async function bulkUpsertPrices(cards: Partial<CachedPrice>[]): Promise<number> {
    if (cards.length === 0) return 0

    try {
        const { error, count } = await supabase
            .from('card_prices')
            .upsert(cards, { onConflict: 'id', count: 'exact' })

        if (error) {
            console.error('Bulk upsert error:', error)
            return 0
        }

        return count || cards.length
    } catch (e) {
        console.error('Bulk upsert error:', e)
        return 0
    }
}

/**
 * Get top N most expensive cards from cache
 */
export async function getTopPricedCards(limit = 100): Promise<CachedPrice[]> {
    try {
        const { data, error } = await supabase
            .from('card_prices')
            .select('*')
            .order('trend_price', { ascending: false })
            .limit(limit)

        if (error) return []
        return data as CachedPrice[]
    } catch (e) {
        console.error('Error getting top priced cards:', e)
        return []
    }
}
