// Advanced Analytics Service
// Calculates correlations, performance attribution, and portfolio metrics

import { getSupabase } from '../supabase'

export type CorrelationData = {
    cardId1: string
    cardId2: string
    cardName1: string
    cardName2: string
    correlation: number // -1 to 1
}

export type PerformanceAttribution = {
    cardId: string
    cardName: string
    contribution: number // Percentage contribution to portfolio return
    weight: number // Portfolio weight
    returns: number // Individual card returns
}

export type BenchmarkComparison = {
    portfolioReturn: number
    benchmarkReturn: number
    alpha: number // Excess return
    beta: number // Market sensitivity
    sharpeRatio: number
    maxDrawdown: number
}

// Calculate correlation between two cards based on price history
export async function calculateCorrelation(
    cardId1: string,
    cardId2: string,
    days = 90
): Promise<number> {
    try {
        const supabase = getSupabase()
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        // Get price history for both cards
        const { data: prices1 } = await supabase
            .from('price_history')
            .select('recorded_at, cardmarket_trend')
            .eq('card_id', cardId1)
            .gte('recorded_at', cutoffDate.toISOString())
            .order('recorded_at', { ascending: true })

        const { data: prices2 } = await supabase
            .from('price_history')
            .select('recorded_at, cardmarket_trend')
            .eq('card_id', cardId2)
            .gte('recorded_at', cutoffDate.toISOString())
            .order('recorded_at', { ascending: true })

        if (!prices1 || !prices2 || prices1.length < 2 || prices2.length < 2) {
            return 0
        }

        // Calculate daily returns
        const returns1 = calculateReturns(prices1.map(p => p.cardmarket_trend || 0))
        const returns2 = calculateReturns(prices2.map(p => p.cardmarket_trend || 0))

        // Calculate Pearson correlation
        return pearsonCorrelation(returns1, returns2)

    } catch (error) {
        console.error('Error calculating correlation:', error)
        return 0
    }
}

// Calculate correlation matrix for a set of cards
export async function calculateCorrelationMatrix(
    cardIds: string[],
    days = 90
): Promise<Map<string, Map<string, number>>> {
    const matrix = new Map<string, Map<string, number>>()

    for (const id1 of cardIds) {
        const row = new Map<string, number>()
        for (const id2 of cardIds) {
            if (id1 === id2) {
                row.set(id2, 1) // Perfect correlation with self
            } else {
                const corr = await calculateCorrelation(id1, id2, days)
                row.set(id2, corr)
            }
        }
        matrix.set(id1, row)
    }

    return matrix
}

// Calculate performance attribution for portfolio
export async function calculatePerformanceAttribution(
    portfolioId: string,
    startDate: Date,
    endDate: Date
): Promise<PerformanceAttribution[]> {
    try {
        const supabase = getSupabase()

        // Get portfolio composition
        const { data: holdings } = await supabase
            .from('portfolio_cards')
            .select('card_id, quantity')
            .eq('portfolio_id', portfolioId)

        if (!holdings || holdings.length === 0) {
            return []
        }

        const attributions: PerformanceAttribution[] = []
        let totalValue = 0

        // Calculate for each card
        for (const holding of holdings) {
            // Get card name
            const { data: cardData } = await supabase
                .from('cards')
                .select('name')
                .eq('id', holding.card_id)
                .single()

            const { data: startPrice } = await supabase
                .from('price_history')
                .select('cardmarket_trend')
                .eq('card_id', holding.card_id)
                .lte('recorded_at', startDate.toISOString())
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single()

            const { data: endPrice } = await supabase
                .from('price_history')
                .select('cardmarket_trend')
                .eq('card_id', holding.card_id)
                .lte('recorded_at', endDate.toISOString())
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single()

            if (!startPrice || !endPrice) continue

            const startVal = (startPrice.cardmarket_trend || 0) * holding.quantity
            const endVal = (endPrice.cardmarket_trend || 0) * holding.quantity
            const returns = ((endVal - startVal) / startVal) * 100

            totalValue += endVal

            attributions.push({
                cardId: holding.card_id,
                cardName: cardData?.name || 'Unknown',
                contribution: 0, // Will calculate after
                weight: 0, // Will calculate after
                returns
            })
        }

        // Calculate weights and contributions
        let totalContribution = 0
        for (const attr of attributions) {
            const { data: endPrice } = await supabase
                .from('price_history')
                .select('cardmarket_trend')
                .eq('card_id', attr.cardId)
                .lte('recorded_at', endDate.toISOString())
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single()

            const { data: holding } = await supabase
                .from('portfolio_cards')
                .select('quantity')
                .eq('portfolio_id', portfolioId)
                .eq('card_id', attr.cardId)
                .single()

            if (!endPrice || !holding) continue

            const value = (endPrice.cardmarket_trend || 0) * holding.quantity
            attr.weight = (value / totalValue) * 100
            attr.contribution = (attr.weight / 100) * attr.returns
            totalContribution += attr.contribution
        }

        // Normalize contributions
        if (totalContribution !== 0) {
            for (const attr of attributions) {
                attr.contribution = (attr.contribution / totalContribution) * 100
            }
        }

        return attributions.sort((a, b) => b.contribution - a.contribution)

    } catch (error) {
        console.error('Error calculating performance attribution:', error)
        return []
    }
}

// Calculate portfolio vs benchmark comparison
export async function calculateBenchmark(
    portfolioId: string,
    benchmarkType: 'pokemon_index' | 'graded_cards' | 'vintage',
    days = 365
): Promise<BenchmarkComparison | null> {
    try {
        // TODO: Implement benchmark index calculation
        // For now, return mock data
        return {
            portfolioReturn: 15.3,
            benchmarkReturn: 12.1,
            alpha: 3.2,
            beta: 1.15,
            sharpeRatio: 1.8,
            maxDrawdown: -8.5
        }

    } catch (error) {
        console.error('Error calculating benchmark:', error)
        return null
    }
}

// Helper: Calculate returns from price series
function calculateReturns(prices: number[]): number[] {
    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] === 0) continue
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    return returns
}

// Helper: Pearson correlation coefficient
function pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n === 0) return 0

    const meanX = x.reduce((sum, val) => sum + val, 0) / n
    const meanY = y.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let denomX = 0
    let denomY = 0

    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX
        const dy = y[i] - meanY
        numerator += dx * dy
        denomX += dx * dx
        denomY += dy * dy
    }

    if (denomX === 0 || denomY === 0) return 0

    return numerator / Math.sqrt(denomX * denomY)
}

// Calculate Sharpe Ratio
export function calculateSharpeRatio(
    returns: number[],
    riskFreeRate = 0.02
): number {
    if (returns.length === 0) return 0

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) return 0

    return (avgReturn - riskFreeRate) / stdDev
}

// Calculate Maximum Drawdown
export function calculateMaxDrawdown(prices: number[]): number {
    if (prices.length === 0) return 0

    let maxDrawdown = 0
    let peak = prices[0]

    for (const price of prices) {
        if (price > peak) {
            peak = price
        }
        const drawdown = ((peak - price) / peak) * 100
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown
        }
    }

    return -maxDrawdown
}
