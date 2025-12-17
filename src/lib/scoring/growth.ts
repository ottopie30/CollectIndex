/**
 * DIMENSION 2: INORGANIC GROWTH SCORING (Poids: 25%)
 * 
 * Based on the cahier des charges specifications:
 * - Métrique 2.1: Excess Return vs Benchmark
 * - Métrique 2.2: Pump & Dump Detection (Asymmetry)
 * - Métrique 2.3: Correlation with Crypto
 */

export type PricePoint = {
    price: number
    date: Date
}

// Benchmark returns
const VINTAGE_ANNUAL_RETURN = 18 // 18% annual for vintage
const MODERN_ANNUAL_RETURN = 8 // 8% annual for modern
const SP500_ANNUAL_RETURN = 10 // 10% annual baseline

/**
 * Calculate Excess Return compared to benchmark
 * 
 * RDT_Annualized = ((Price_Today / Price_1_Year_Ago) - 1) × 100
 * Excess_Return = RDT_Annualized - Benchmark (18% for vintage)
 * 
 * Thresholds:
 * - Excess > 0% = speculation potential
 * - Excess > 100% = +50 points (2.5x outperformance)
 * - Excess > 200% = +75 points
 * - Excess > 500% = +100 points (extreme zone)
 */
export function calculateExcessReturn(
    currentPrice: number,
    priceOneYearAgo: number,
    benchmark: number = VINTAGE_ANNUAL_RETURN
): number {
    if (priceOneYearAgo === 0) return 0

    const annualizedReturn = ((currentPrice / priceOneYearAgo) - 1) * 100
    return annualizedReturn - benchmark
}

export function excessReturnToScore(excessReturn: number): number {
    if (excessReturn <= 0) return 0
    if (excessReturn < 100) return 25
    if (excessReturn < 200) return 50
    if (excessReturn < 500) return 75
    return 100
}

/**
 * Calculate Pump & Dump Asymmetry
 * 
 * Concept: Prices rise quickly but descend slowly = manipulation
 * Ratio_Rise_Fall = Duration_Rise / Duration_Fall
 * 
 * Thresholds:
 * - Ratio < 0.5 = rapid rise, slow descent (pump & dump) → +40 points
 * - Ratio > 5.0 = sustained rise → +30 points
 */
export function calculatePumpDumpRatio(priceHistory: PricePoint[]): number {
    if (priceHistory.length < 10) return 1

    const sorted = [...priceHistory].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Find peak
    let peakIdx = 0
    let peakPrice = sorted[0].price
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].price > peakPrice) {
            peakPrice = sorted[i].price
            peakIdx = i
        }
    }

    // Count consecutive rising days before peak
    let riseDays = 0
    for (let i = peakIdx; i > 0; i--) {
        if (sorted[i].price >= sorted[i - 1].price) {
            riseDays++
        } else {
            break
        }
    }

    // Count consecutive falling days after peak
    let fallDays = 0
    for (let i = peakIdx; i < sorted.length - 1; i++) {
        if (sorted[i].price > sorted[i + 1].price) {
            fallDays++
        } else {
            break
        }
    }

    if (fallDays === 0) return riseDays > 0 ? riseDays : 1

    return riseDays / fallDays
}

export function pumpDumpToScore(ratio: number): number {
    if (ratio < 0.5) return 40 // Pump & dump pattern
    if (ratio > 5) return 30 // Sustained rise
    return 10 // Normal pattern
}

/**
 * Calculate Pearson correlation with Bitcoin
 * 
 * Thresholds:
 * - Corr > 0.7 = strong correlation (speculative) → +45 points
 * - Corr > 0.85 = very strong correlation → +70 points
 * - Corr < 0.3 = weak correlation (mature market) → 0 points
 */
export function calculateCorrelation(
    cardPrices: number[],
    btcPrices: number[]
): number {
    if (cardPrices.length !== btcPrices.length || cardPrices.length < 3) {
        return 0
    }

    const n = cardPrices.length

    // Calculate means
    const meanCard = cardPrices.reduce((sum, p) => sum + p, 0) / n
    const meanBtc = btcPrices.reduce((sum, p) => sum + p, 0) / n

    // Calculate Pearson correlation
    let numerator = 0
    let denomCard = 0
    let denomBtc = 0

    for (let i = 0; i < n; i++) {
        const diffCard = cardPrices[i] - meanCard
        const diffBtc = btcPrices[i] - meanBtc
        numerator += diffCard * diffBtc
        denomCard += diffCard * diffCard
        denomBtc += diffBtc * diffBtc
    }

    const denom = Math.sqrt(denomCard * denomBtc)
    if (denom === 0) return 0

    return numerator / denom
}

export function correlationToScore(corr: number): number {
    const absCorr = Math.abs(corr)
    if (absCorr > 0.85) return 70
    if (absCorr > 0.7) return 45
    if (absCorr > 0.5) return 25
    return 0
}

/**
 * Calculate complete D2 Inorganic Growth Score
 * D2_Score = 0.4 × Excess_Return_Score + 0.3 × PumpDump_Score + 0.3 × Crypto_Corr_Score
 */
export function calculateD2Score(
    currentPrice: number,
    priceOneYearAgo: number,
    priceHistory: PricePoint[],
    btcPrices?: number[],
    isVintage: boolean = false
): {
    excessReturnScore: number
    pumpDumpScore: number
    cryptoCorrelationScore: number
    d2Total: number
} {
    const benchmark = isVintage ? VINTAGE_ANNUAL_RETURN : MODERN_ANNUAL_RETURN

    const excessReturn = calculateExcessReturn(currentPrice, priceOneYearAgo, benchmark)
    const excessReturnScore = excessReturnToScore(excessReturn)

    const pumpDumpRatio = calculatePumpDumpRatio(priceHistory)
    const pumpDumpScore = pumpDumpToScore(pumpDumpRatio)

    // Use default correlation if BTC prices not provided
    let cryptoCorrelationScore = 25 // Default moderate assumption
    if (btcPrices && priceHistory.length > 0) {
        const cardPrices = priceHistory.map(p => p.price)
        const corr = calculateCorrelation(cardPrices.slice(-btcPrices.length), btcPrices)
        cryptoCorrelationScore = correlationToScore(corr)
    }

    const d2Total = Math.round(
        0.4 * excessReturnScore + 0.3 * pumpDumpScore + 0.3 * cryptoCorrelationScore
    )

    return {
        excessReturnScore,
        pumpDumpScore,
        cryptoCorrelationScore,
        d2Total
    }
}
