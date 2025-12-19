/**
 * COMPLETE SPECULATION SCORE CALCULATOR
 * 
 * Combines all 5 dimensions with proper weighting:
 * - D1: Volatility (25%)
 * - D2: Inorganic Growth (25%)
 * - D3: Scarcity (20%)
 * - D4: Sentiment (15%)
 * - D5: Macro (15%)
 */

import { calculateD1Score, PricePoint } from './volatility'
import { calculateD2Score } from './growth'
import { calculateD3Score } from './scarcity'
import { calculateD4Score } from './sentiment'
import { calculateD5Score, getCurrentMacroEnvironment } from './macro'
import { supabase } from '../supabase'

// Dimension weights
const WEIGHTS = {
    D1_VOLATILITY: 0.25,
    D2_GROWTH: 0.25,
    D3_SCARCITY: 0.20,
    D4_SENTIMENT: 0.15,
    D5_MACRO: 0.15
}

export type FullSpeculationScore = {
    total: number
    interpretation: 'investment' | 'transition' | 'speculation'

    d1: {
        score: number
        cvScore: number
        ptrScore: number
        accScore: number
    }

    d2: {
        score: number
        excessReturnScore: number
        pumpDumpScore: number
        cryptoCorrelationScore: number
    }

    d3: {
        score: number
        rarityScore: number
        psaPopScore: number
        supplyDemandScore: number
        vintageBonus: number
    }

    d4: {
        score: number
        socialBuzzScore: number
        buyerSellerScore: number
        hypeIndexScore: number
        popularityBonus: number
    }

    d5: {
        score: number
        cryptoCorrelationScore: number
        fearGreedScore: number
        interestRateScore: number
        seasonalScore: number
    }

    calculatedAt: string
}

/**
 * Calculate complete speculation score for a card
 */
export function calculateFullScore(params: {
    // D1: Volatility inputs
    priceHistory?: PricePoint[]

    // D2: Growth inputs
    currentPrice?: number
    priceOneYearAgo?: number
    isVintage?: boolean
    btcPrices?: number[]

    // D3: Scarcity inputs
    rarity?: string | null
    psaPopulation?: number | null
    soldListings30d?: number
    activeListings?: number
    setId?: string

    // D4: Sentiment inputs
    socialMentions?: { reddit?: number; twitter?: number; youtube?: number; discord?: number }
    buyOrders?: number
    sellOrders?: number
    searchVolumeChange?: number
    pokemonName?: string
    isGraded?: boolean
    gradedScore?: number

    // D5: Macro inputs (uses defaults if not provided)
    btcCorrelation?: number
    fearGreedIndex?: number
    fedFundsRate?: number
}): FullSpeculationScore {
    // D1: Volatility
    const d1Result = calculateD1Score(params.priceHistory || [])

    // D2: Growth
    const d2Result = calculateD2Score(
        params.currentPrice || 0,
        params.priceOneYearAgo || params.currentPrice || 0,
        params.priceHistory || [],
        params.btcPrices,
        params.isVintage
    )

    // D3: Scarcity
    const d3Result = calculateD3Score(
        params.rarity ?? null,
        params.psaPopulation ?? null,
        params.soldListings30d || 0,
        params.activeListings || 1,
        params.setId || '',
        params.pokemonName || ''
    )

    // D4: Sentiment
    const d4Result = calculateD4Score(
        params.socialMentions || {},
        params.buyOrders || 1,
        params.sellOrders || 1,
        params.searchVolumeChange || 0,
        params.pokemonName || '',
        params.rarity || null,
        params.isGraded || false,
        params.gradedScore || 0
    )

    // D5: Macro (use provided or defaults)
    const macro = getCurrentMacroEnvironment()
    const d5Result = calculateD5Score(
        params.btcCorrelation ?? macro.btcCorrelation,
        params.fearGreedIndex ?? macro.fearGreedIndex,
        params.fedFundsRate ?? macro.fedFundsRate
    )

    // Calculate weighted total
    const total = Math.round(
        WEIGHTS.D1_VOLATILITY * d1Result.d1Total +
        WEIGHTS.D2_GROWTH * d2Result.d2Total +
        WEIGHTS.D3_SCARCITY * d3Result.d3Total +
        WEIGHTS.D4_SENTIMENT * d4Result.d4Total +
        WEIGHTS.D5_MACRO * d5Result.d5Total
    )

    // Determine interpretation
    let interpretation: 'investment' | 'transition' | 'speculation'
    if (total < 30) {
        interpretation = 'investment'
    } else if (total < 60) {
        interpretation = 'transition'
    } else {
        interpretation = 'speculation'
    }

    return {
        total,
        interpretation,
        d1: {
            score: d1Result.d1Total,
            cvScore: d1Result.cvScore,
            ptrScore: d1Result.ptrScore,
            accScore: d1Result.accScore
        },
        d2: {
            score: d2Result.d2Total,
            excessReturnScore: d2Result.excessReturnScore,
            pumpDumpScore: d2Result.pumpDumpScore,
            cryptoCorrelationScore: d2Result.cryptoCorrelationScore
        },
        d3: {
            score: d3Result.d3Total,
            rarityScore: d3Result.rarityScore,
            psaPopScore: d3Result.psaPopScore,
            supplyDemandScore: d3Result.supplyDemandScore,
            vintageBonus: d3Result.vintageBonus
        },
        d4: {
            score: d4Result.d4Total,
            socialBuzzScore: d4Result.socialBuzzScore,
            buyerSellerScore: d4Result.buyerSellerScore,
            hypeIndexScore: d4Result.hypeIndexScore,
            popularityBonus: d4Result.popularityBonus
        },
        d5: {
            score: d5Result.d5Total,
            cryptoCorrelationScore: d5Result.cryptoCorrelationScore,
            fearGreedScore: d5Result.fearGreedScore,
            interestRateScore: d5Result.interestRateScore,
            seasonalScore: d5Result.seasonalScore
        },
        calculatedAt: new Date().toISOString()
    }
}

/**
 * Calculate score for a card from database
 */
export async function calculateScoreForCard(cardId: string): Promise<FullSpeculationScore | null> {
    try {
        // Fetch card data
        const { data: card, error } = await supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single()

        if (error || !card) {
            console.error('Card not found:', cardId)
            return null
        }

        // Fetch price history
        const { data: priceData } = await supabase
            .from('price_history')
            .select('price, recorded_at')
            .eq('card_id', cardId)
            .order('recorded_at', { ascending: true })

        const priceHistory: PricePoint[] = (priceData || []).map(p => ({
            price: parseFloat(p.price),
            date: new Date(p.recorded_at)
        }))

        // Calculate vintage status
        const isVintage = card.set_id?.startsWith('base') ||
            card.set_id?.startsWith('neo') ||
            card.set_id?.startsWith('gym')

        // Get current and old price
        const currentPrice = priceHistory.length > 0
            ? priceHistory[priceHistory.length - 1].price
            : 0
        const priceOneYearAgo = priceHistory.length > 0
            ? priceHistory[0].price
            : currentPrice

        // Calculate full score
        const score = calculateFullScore({
            priceHistory,
            currentPrice,
            priceOneYearAgo,
            isVintage,
            rarity: card.rarity,
            setId: card.set_id,
            pokemonName: card.name
        })

        return score
    } catch (error) {
        console.error('Error calculating score for card:', cardId, error)
        return null
    }
}

/**
 * Save score to database
 */
export async function saveScore(
    cardId: string,
    score: FullSpeculationScore
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('speculation_scores')
            .upsert({
                card_id: cardId,
                score_total: score.total,
                d1_volatility: score.d1.score,
                d2_growth: score.d2.score,
                d3_scarcity: score.d3.score,
                d4_sentiment: score.d4.score,
                d5_macro: score.d5.score,
                calculated_at: score.calculatedAt
            }, {
                onConflict: 'card_id'
            })

        if (error) {
            console.error('Error saving score:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error in saveScore:', error)
        return false
    }
}

/**
 * Calculate and save scores for all cards
 */
export async function calculateAllScores(): Promise<{
    processed: number
    success: number
    failed: number
}> {
    // Fetch all cards
    const { data: cards, error } = await supabase
        .from('cards')
        .select('id')

    if (error || !cards) {
        return { processed: 0, success: 0, failed: 0 }
    }

    let success = 0
    let failed = 0

    for (const card of cards) {
        const score = await calculateScoreForCard(card.id)
        if (score) {
            const saved = await saveScore(card.id, score)
            if (saved) {
                success++
            } else {
                failed++
            }
        } else {
            failed++
        }
    }

    return {
        processed: cards.length,
        success,
        failed
    }
}

/**
 * Get a simplified score based only on available data
 * Useful when we don't have price history
 */
export function calculateSimplifiedScore(params: {
    rarity?: string | null
    setId?: string
    pokemonName?: string
}): number {
    // D3 simplified (main contributor when no price data)
    const d3 = calculateD3Score(
        params.rarity,
        null, // no PSA data
        0, // no listings data
        1,
        params.setId || '',
        params.pokemonName || ''
    )

    // D4 simplified
    const d4 = calculateD4Score(
        {},
        1, 1,
        0,
        params.pokemonName || '',
        params.rarity ?? null
    )

    // D5 with defaults
    const d5 = calculateD5Score()

    // Return weighted combo of available dimensions
    return Math.round(
        0.4 * d3.d3Total +
        0.3 * d4.d4Total +
        0.3 * d5.d5Total
    )
}
