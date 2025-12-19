/**
 * 5-Dimension Speculation Score Engine
 * Based on PokéValoris CDC specification
 * 
 * SCORE SPÉCULATION = 
 *   0.25 × D1_Score (Volatilité)
 * + 0.25 × D2_Score (Croissance Inorganique)
 * + 0.20 × D3_Score (Scarcité)
 * + 0.15 × D4_Score (Sentiment)
 * + 0.15 × D5_Score (Macro)
 * 
 * Result: 0-100
 * 0-20: VERT = Investissement Solide
 * 20-40: VERT-JAUNE = Investissement Acceptable
 * 40-60: ORANGE = Spéculation Modérée
 * 60-80: ROUGE = Spéculation Forte
 * 80-100: ROUGE VIF = Manie (DANGER)
 */

import { getMacroScore } from '@/lib/data/macro'
import { getSentimentScore } from '@/lib/data/sentiment'
import { getScarcityScore } from '@/lib/data/psa'

// ============================================
// TYPES
// ============================================

export type PricePoint = {
    date: string
    price: number
}

export type DimensionScore = {
    score: number       // 0-100
    weight: number      // Dimension weight
    details: Record<string, number | string>
}

export type FullSpeculationScore = {
    totalScore: number  // 0-100 final score
    rating: 'solid_investment' | 'acceptable' | 'moderate_speculation' | 'high_speculation' | 'mania'
    ratingColor: 'green' | 'yellow' | 'orange' | 'red' | 'darkred'
    ratingLabel: string

    // Individual dimension scores
    d1_volatility: DimensionScore
    d2_growth: DimensionScore
    d3_scarcity: DimensionScore
    d4_sentiment: DimensionScore
    d5_macro: DimensionScore

    // Recommendations
    recommendation: 'BUY' | 'HOLD' | 'SELL' | 'AVOID'
    summary: string
}

// ============================================
// DIMENSION 1: VOLATILITY (25%)
// ============================================

/**
 * Calculate coefficient of variation
 */
function calculateCV(prices: number[]): number {
    if (prices.length < 2) return 0
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length
    if (mean === 0) return 0
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    return (stdDev / mean) * 100
}

/**
 * Calculate peak-to-trough ratio
 */
function calculatePTR(prices: number[]): number {
    if (prices.length < 2) return 0
    const max = Math.max(...prices)
    const min = Math.min(...prices)
    if (min === 0) return 0
    return ((max - min) / min) * 100
}

/**
 * Calculate price acceleration
 */
function calculateAcceleration(prices: number[]): number {
    if (prices.length < 14) return 1

    // Recent 7 days average return
    const recent = prices.slice(-7)
    const recentReturns = recent.slice(1).map((p, i) => (p / recent[i]) - 1)
    const recentAvg = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length

    // Previous period average return
    const older = prices.slice(-60, -7)
    if (older.length < 7) return 1
    const olderReturns = older.slice(1).map((p, i) => (p / older[i]) - 1)
    const olderAvg = olderReturns.reduce((a, b) => a + b, 0) / olderReturns.length

    if (olderAvg === 0) return 1
    return Math.abs(recentAvg / olderAvg)
}

/**
 * D1: Volatility Score (0-100)
 */
export function calculateVolatilityScore(priceHistory: PricePoint[]): DimensionScore {
    const prices = priceHistory.map(p => p.price)

    const cv30 = calculateCV(prices.slice(-30))
    const cv90 = calculateCV(prices.slice(-90))
    const ptr30 = calculatePTR(prices.slice(-30))
    const acceleration = calculateAcceleration(prices)

    // CV Score (0-100)
    let cvScore = 0
    const avgCV = 0.4 * cv30 + 0.6 * cv90
    if (avgCV < 10) cvScore = 0
    else if (avgCV < 20) cvScore = 25
    else if (avgCV < 40) cvScore = 50
    else if (avgCV < 80) cvScore = 75
    else cvScore = 100

    // PTR Score (0-100)
    let ptrScore = 0
    if (ptr30 < 30) ptrScore = 0
    else if (ptr30 < 100) ptrScore = 40
    else if (ptr30 < 200) ptrScore = 60
    else if (ptr30 < 300) ptrScore = 80
    else ptrScore = 100

    // Acceleration Score (0-100)
    let accScore = 0
    if (acceleration < 1.5) accScore = 0
    else if (acceleration < 2) accScore = 30
    else if (acceleration < 5) accScore = 50
    else if (acceleration < 10) accScore = 70
    else accScore = 100

    // Combined D1 score
    const d1Score = 0.4 * cvScore + 0.3 * ptrScore + 0.3 * accScore

    return {
        score: Math.min(100, Math.max(0, d1Score)),
        weight: 0.25,
        details: {
            cv30: Math.round(cv30 * 10) / 10,
            cv90: Math.round(cv90 * 10) / 10,
            ptr30: Math.round(ptr30 * 10) / 10,
            acceleration: Math.round(acceleration * 10) / 10,
            cvScore,
            ptrScore,
            accScore
        }
    }
}

// ============================================
// DIMENSION 2: INORGANIC GROWTH (25%)
// ============================================

/**
 * Calculate annualized return
 */
function calculateAnnualizedReturn(prices: number[], days: number): number {
    if (prices.length < 2) return 0
    const startPrice = prices[0]
    const endPrice = prices[prices.length - 1]
    if (startPrice === 0) return 0

    const totalReturn = (endPrice / startPrice) - 1
    const years = days / 365
    return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100
}

/**
 * Detect pump & dump pattern
 */
function detectPumpDump(prices: number[]): { detected: boolean; ratio: number } {
    if (prices.length < 30) return { detected: false, ratio: 1 }

    // Find peak
    const peakIndex = prices.indexOf(Math.max(...prices))
    if (peakIndex === 0 || peakIndex === prices.length - 1) {
        return { detected: false, ratio: 1 }
    }

    const daysToRise = peakIndex
    const daysToPeak = prices.length - peakIndex

    const ratio = daysToRise / daysToPeak
    const detected = ratio < 0.5 // Fast rise, slow fall

    return { detected, ratio }
}

/**
 * D2: Inorganic Growth Score (0-100)
 */
export function calculateGrowthScore(
    priceHistory: PricePoint[],
    btcCorrelation: number = 0.5
): DimensionScore {
    const prices = priceHistory.map(p => p.price)

    // Excess return vs vintage benchmark (18%)
    const annualReturn = calculateAnnualizedReturn(prices, 365)
    const excessReturn = annualReturn - 18

    let excessScore = 0
    if (excessReturn < 0) excessScore = 0
    else if (excessReturn < 100) excessScore = 50
    else if (excessReturn < 200) excessScore = 75
    else if (excessReturn < 500) excessScore = 90
    else excessScore = 100

    // Pump & dump detection
    const { detected: pumpDetected, ratio } = detectPumpDump(prices)
    const pumpScore = pumpDetected ? 40 : (ratio < 1 ? 30 : 10)

    // Crypto correlation
    let cryptoScore = 0
    if (btcCorrelation > 0.85) cryptoScore = 70
    else if (btcCorrelation > 0.7) cryptoScore = 45
    else if (btcCorrelation > 0.5) cryptoScore = 25
    else cryptoScore = 0

    // Combined D2 score
    const d2Score = 0.4 * excessScore + 0.3 * pumpScore + 0.3 * cryptoScore

    return {
        score: Math.min(100, Math.max(0, d2Score)),
        weight: 0.25,
        details: {
            annualReturn: Math.round(annualReturn * 10) / 10,
            excessReturn: Math.round(excessReturn * 10) / 10,
            pumpDetected: pumpDetected ? 'Yes' : 'No',
            pumpRatio: Math.round(ratio * 100) / 100,
            btcCorrelation: Math.round(btcCorrelation * 100) / 100,
            excessScore,
            pumpScore,
            cryptoScore
        }
    }
}

// ============================================
// DIMENSION 3: SCARCITY (20%) - Uses psa.ts
// ============================================

/**
 * D3: Scarcity Score (0-100)
 * Lower score = more scarce = better investment
 */
export async function calculateScarcityScore(
    cardName: string,
    setId: string,
    rarity?: string,
    isVintage: boolean = false
): Promise<DimensionScore> {
    const scarcity = await getScarcityScore(cardName, setId, rarity, isVintage)

    return {
        score: scarcity.d3Score,
        weight: 0.20,
        details: {
            psa10Population: scarcity.population.psa10,
            psa10Percentage: Math.round(scarcity.population.psa10Percentage * 10) / 10,
            scarcityRating: scarcity.scarcityRating,
            isVintage: isVintage ? 'Yes' : 'No'
        }
    }
}

// ============================================
// DIMENSION 4: SENTIMENT (15%) - Uses sentiment.ts
// ============================================

/**
 * D4: Sentiment Score (0-100)
 * Higher score = more FOMO = more speculative
 */
export async function calculateSentimentDimension(cardName: string): Promise<DimensionScore> {
    const { d4Score, details } = await getSentimentScore(cardName)

    return {
        score: d4Score,
        weight: 0.15,
        details: {
            mentions: details.mentions,
            sentimentScore: Math.round(details.sentimentScore * 100) / 100,
            positiveCount: details.positiveCount,
            negativeCount: details.negativeCount,
            trending: details.trending ? 'Yes' : 'No'
        }
    }
}

// ============================================
// DIMENSION 5: MACRO (15%) - Uses macro.ts
// ============================================

/**
 * D5: Macro Score (0-100)
 * Higher score = more risk-on environment = more speculative
 */
export async function calculateMacroDimension(): Promise<DimensionScore> {
    const macro = await getMacroScore()

    return {
        score: macro.macroRiskScore,
        weight: 0.15,
        details: {
            btcChange30d: Math.round(macro.btcData.change30d * 10) / 10,
            fearGreedIndex: macro.fearGreed.value,
            fearGreedClass: macro.fearGreed.classification,
            vix: macro.indices.vix.price
        }
    }
}

// ============================================
// FULL SCORE CALCULATION
// ============================================

/**
 * Get rating from score
 */
function getRating(score: number): FullSpeculationScore['rating'] {
    if (score < 20) return 'solid_investment'
    if (score < 40) return 'acceptable'
    if (score < 60) return 'moderate_speculation'
    if (score < 80) return 'high_speculation'
    return 'mania'
}

function getRatingColor(rating: FullSpeculationScore['rating']): FullSpeculationScore['ratingColor'] {
    switch (rating) {
        case 'solid_investment': return 'green'
        case 'acceptable': return 'yellow'
        case 'moderate_speculation': return 'orange'
        case 'high_speculation': return 'red'
        case 'mania': return 'darkred'
    }
}

function getRatingLabel(rating: FullSpeculationScore['rating']): string {
    switch (rating) {
        case 'solid_investment': return 'Investissement Solide'
        case 'acceptable': return 'Investissement Acceptable'
        case 'moderate_speculation': return 'Spéculation Modérée'
        case 'high_speculation': return 'Spéculation Forte'
        case 'mania': return 'MANIE - DANGER'
    }
}

function getRecommendation(score: number, isVintage: boolean): FullSpeculationScore['recommendation'] {
    if (score < 30) return 'BUY'
    if (score < 50 && isVintage) return 'BUY'
    if (score < 60) return 'HOLD'
    if (score < 80) return 'SELL'
    return 'AVOID'
}

function getSummary(score: number, rating: string, cardName: string): string {
    if (score < 20) {
        return `${cardName} présente les caractéristiques d'un investissement solide avec une faible volatilité et des fondamentaux stables.`
    }
    if (score < 40) {
        return `${cardName} est un investissement acceptable avec quelques signaux de volatilité à surveiller.`
    }
    if (score < 60) {
        return `${cardName} montre des signes de spéculation modérée. Prudence recommandée.`
    }
    if (score < 80) {
        return `⚠️ ${cardName} est en territoire spéculatif. Risque de correction élevé.`
    }
    return `🚨 DANGER: ${cardName} présente tous les signaux d'une bulle spéculative. Éviter ou vendre.`
}

/**
 * Calculate full 5D speculation score for a card
 */
export async function calculateFullScore(
    cardName: string,
    setId: string,
    priceHistory: PricePoint[],
    options: {
        rarity?: string
        isVintage?: boolean
        btcCorrelation?: number
    } = {}
): Promise<FullSpeculationScore> {
    const { rarity, isVintage = false, btcCorrelation = 0.5 } = options

    // Calculate all dimensions
    const [d1, d2, d3, d4, d5] = await Promise.all([
        Promise.resolve(calculateVolatilityScore(priceHistory)),
        Promise.resolve(calculateGrowthScore(priceHistory, btcCorrelation)),
        calculateScarcityScore(cardName, setId, rarity, isVintage),
        calculateSentimentDimension(cardName),
        calculateMacroDimension()
    ])

    // Calculate weighted total
    const totalScore =
        d1.weight * d1.score +
        d2.weight * d2.score +
        d3.weight * d3.score +
        d4.weight * d4.score +
        d5.weight * d5.score

    const rating = getRating(totalScore)

    return {
        totalScore: Math.round(totalScore),
        rating,
        ratingColor: getRatingColor(rating),
        ratingLabel: getRatingLabel(rating),
        d1_volatility: d1,
        d2_growth: d2,
        d3_scarcity: d3,
        d4_sentiment: d4,
        d5_macro: d5,
        recommendation: getRecommendation(totalScore, isVintage),
        summary: getSummary(totalScore, rating, cardName)
    }
}

/**
 * Quick score calculation (without async sentiment/macro)
 * For batch processing
 */
export function calculateQuickScore(
    priceHistory: PricePoint[],
    psaPopulation: number,
    isVintage: boolean
): number {
    // Simplified scoring for batch
    const prices = priceHistory.map(p => p.price)

    // D1: Volatility (simplified)
    const cv = calculateCV(prices.slice(-30))
    const d1 = cv > 50 ? 80 : cv > 30 ? 50 : cv > 15 ? 25 : 10

    // D2: Growth (simplified)
    const returns = prices.length > 1 ? ((prices[prices.length - 1] / prices[0]) - 1) * 100 : 0
    const d2 = returns > 500 ? 90 : returns > 100 ? 60 : returns > 30 ? 30 : 10

    // D3: Scarcity
    const d3 = psaPopulation > 10000 ? 80 : psaPopulation > 2000 ? 50 : psaPopulation > 500 ? 25 : 5
    if (isVintage) { /* d3 already good */ }

    // D4 & D5: Use defaults
    const d4 = 50 // Neutral
    const d5 = 50 // Neutral

    return Math.round(0.25 * d1 + 0.25 * d2 + 0.20 * d3 + 0.15 * d4 + 0.15 * d5)
}
