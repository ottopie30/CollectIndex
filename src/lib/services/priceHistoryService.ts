import { supabase } from '../supabase'

export type PriceStats = {
    min30d: number | null
    max30d: number | null
    avg30d: number | null
    change30d: number | null
    min90d: number | null
    max90d: number | null
    avg90d: number | null
    change90d: number | null
    volatility: number | null
    currentPrice: number | null
}

/**
 * Get price history for a card
 */
export async function getCardPriceHistory(
    cardId: string,
    source: 'cardmarket' | 'tcgplayer' | 'all' = 'cardmarket',
    days: number = 90
): Promise<{ date: string; price: number }[]> {
    try {
        const since = new Date()
        since.setDate(since.getDate() - days)

        let query = supabase
            .from('price_history')
            .select('recorded_at, price')
            .eq('card_id', cardId)
            .gte('recorded_at', since.toISOString())
            .order('recorded_at', { ascending: true })

        if (source !== 'all') {
            query = query.eq('source', source)
        }

        const { data, error } = await query

        if (error) {
            console.error(`Error fetching price history for ${cardId}:`, error)
            return []
        }

        return (data || []).map(row => ({
            date: row.recorded_at.split('T')[0],
            price: parseFloat(row.price)
        }))
    } catch (error) {
        console.error(`Error in getCardPriceHistory:`, error)
        return []
    }
}

/**
 * Get latest price for a card
 */
export async function getLatestPrice(
    cardId: string,
    source: 'cardmarket' | 'tcgplayer' = 'cardmarket'
): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('price_history')
            .select('price')
            .eq('card_id', cardId)
            .eq('source', source)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single()

        if (error) return null
        return parseFloat(data.price)
    } catch {
        return null
    }
}

/**
 * Calculate price statistics
 */
export async function calculatePriceStats(cardId: string): Promise<PriceStats> {
    const history90d = await getCardPriceHistory(cardId, 'cardmarket', 90)

    if (history90d.length === 0) {
        return {
            min30d: null, max30d: null, avg30d: null, change30d: null,
            min90d: null, max90d: null, avg90d: null, change90d: null,
            volatility: null, currentPrice: null
        }
    }

    const prices90d = history90d.map(h => h.price)
    const currentPrice = prices90d[prices90d.length - 1]

    // 30 day stats
    const history30d = history90d.slice(-30)
    const prices30d = history30d.map(h => h.price)

    const min30d = prices30d.length > 0 ? Math.min(...prices30d) : null
    const max30d = prices30d.length > 0 ? Math.max(...prices30d) : null
    const avg30d = prices30d.length > 0 ? prices30d.reduce((a, b) => a + b, 0) / prices30d.length : null
    const change30d = prices30d.length > 1
        ? ((prices30d[prices30d.length - 1] - prices30d[0]) / prices30d[0]) * 100
        : null

    // 90 day stats
    const min90d = Math.min(...prices90d)
    const max90d = Math.max(...prices90d)
    const avg90d = prices90d.reduce((a, b) => a + b, 0) / prices90d.length
    const change90d = ((prices90d[prices90d.length - 1] - prices90d[0]) / prices90d[0]) * 100

    // Calculate volatility (CV)
    const mean = avg90d
    const variance = prices90d.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices90d.length
    const stdDev = Math.sqrt(variance)
    const volatility = (stdDev / mean) * 100

    return {
        min30d: min30d ? Math.round(min30d * 100) / 100 : null,
        max30d: max30d ? Math.round(max30d * 100) / 100 : null,
        avg30d: avg30d ? Math.round(avg30d * 100) / 100 : null,
        change30d: change30d ? Math.round(change30d * 100) / 100 : null,
        min90d: Math.round(min90d * 100) / 100,
        max90d: Math.round(max90d * 100) / 100,
        avg90d: Math.round(avg90d * 100) / 100,
        change90d: Math.round(change90d * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        currentPrice: Math.round(currentPrice * 100) / 100
    }
}

/**
 * Detect price anomalies (pump patterns)
 */
export async function detectPriceAnomalies(cardId: string): Promise<{
    hasPump: boolean
    pumpMagnitude: number | null
    daysAgoPeak: number | null
}> {
    const history = await getCardPriceHistory(cardId, 'cardmarket', 30)

    if (history.length < 7) {
        return { hasPump: false, pumpMagnitude: null, daysAgoPeak: null }
    }

    const prices = history.map(h => h.price)

    // Find max price and its position
    const maxPrice = Math.max(...prices)
    const maxIndex = prices.indexOf(maxPrice)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

    // Pump if max is > 2x average and not at the end
    const pumpMagnitude = (maxPrice / avgPrice) - 1
    const hasPump = pumpMagnitude > 1 && maxIndex < prices.length - 3
    const daysAgoPeak = prices.length - maxIndex - 1

    return {
        hasPump,
        pumpMagnitude: hasPump ? Math.round(pumpMagnitude * 100) : null,
        daysAgoPeak: hasPump ? daysAgoPeak : null
    }
}
