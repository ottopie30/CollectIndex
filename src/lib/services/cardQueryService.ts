import { supabase, Card, SpeculationScore } from '../supabase'

export type CardWithScore = Card & {
    score?: SpeculationScore | null
    latestPrice?: number | null
    priceChange?: number | null
}

/**
 * Search cards in database
 */
export async function searchCardsInDB(query: string, limit: number = 50): Promise<CardWithScore[]> {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select(`
        *,
        speculation_scores (
          score_total,
          d1_volatility,
          d2_growth,
          d3_scarcity,
          d4_sentiment,
          d5_macro,
          calculated_at
        )
      `)
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(limit)

        if (error) {
            console.error('Search error:', error)
            return []
        }

        return (data || []).map(card => ({
            ...card,
            score: card.speculation_scores?.[0] || null
        }))
    } catch (error) {
        console.error('searchCardsInDB error:', error)
        return []
    }
}

/**
 * Get card by ID with full details
 */
export async function getCardById(id: string): Promise<CardWithScore | null> {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select(`
        *,
        speculation_scores (
          score_total,
          d1_volatility,
          d2_growth,
          d3_scarcity,
          d4_sentiment,
          d5_macro,
          calculated_at
        )
      `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('getCardById error:', error)
            return null
        }

        return {
            ...data,
            score: data.speculation_scores?.[0] || null
        }
    } catch (error) {
        console.error('getCardById error:', error)
        return null
    }
}

/**
 * Get card by TCGdex ID
 */
export async function getCardByTcgdexId(tcgdexId: string): Promise<CardWithScore | null> {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select(`
        *,
        speculation_scores (
          score_total,
          d1_volatility,
          d2_growth,
          d3_scarcity,
          d4_sentiment,
          d5_macro,
          calculated_at
        )
      `)
            .eq('tcgdex_id', tcgdexId)
            .single()

        if (error) return null

        return {
            ...data,
            score: data.speculation_scores?.[0] || null
        }
    } catch {
        return null
    }
}

/**
 * Get trending cards (highest scores or most volatile)
 */
export async function getTrendingCards(limit: number = 10): Promise<CardWithScore[]> {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select(`
        *,
        speculation_scores (
          score_total,
          d1_volatility,
          d2_growth,
          d3_scarcity,
          d4_sentiment,
          d5_macro,
          calculated_at
        )
      `)
            .not('speculation_scores', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('getTrendingCards error:', error)
            return []
        }

        return (data || [])
            .map(card => ({
                ...card,
                score: card.speculation_scores?.[0] || null
            }))
            .sort((a, b) => (b.score?.score_total || 0) - (a.score?.score_total || 0))
    } catch (error) {
        console.error('getTrendingCards error:', error)
        return []
    }
}

/**
 * Get recently added cards
 */
export async function getRecentCards(limit: number = 20): Promise<CardWithScore[]> {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('getRecentCards error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('getRecentCards error:', error)
        return []
    }
}

/**
 * Get cards by set
 */
export async function getCardsBySet(setId: string, limit: number = 200): Promise<CardWithScore[]> {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('set_id', setId)
            .order('name')
            .limit(limit)

        if (error) {
            console.error('getCardsBySet error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('getCardsBySet error:', error)
        return []
    }
}

/**
 * Get high speculation cards (score > 60)
 */
export async function getHighSpeculationCards(limit: number = 10): Promise<CardWithScore[]> {
    try {
        const { data, error } = await supabase
            .from('speculation_scores')
            .select(`
        *,
        cards (*)
      `)
            .gte('score_total', 60)
            .order('score_total', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('getHighSpeculationCards error:', error)
            return []
        }

        return (data || []).map(item => ({
            ...item.cards,
            score: {
                score_total: item.score_total,
                d1_volatility: item.d1_volatility,
                d2_growth: item.d2_growth,
                d3_scarcity: item.d3_scarcity,
                d4_sentiment: item.d4_sentiment,
                d5_macro: item.d5_macro,
                calculated_at: item.calculated_at
            }
        }))
    } catch (error) {
        console.error('getHighSpeculationCards error:', error)
        return []
    }
}

/**
 * Get cards count
 */
export async function getCardsCount(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })

        if (error) return 0
        return count || 0
    } catch {
        return 0
    }
}
