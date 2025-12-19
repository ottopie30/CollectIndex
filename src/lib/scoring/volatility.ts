/**
 * DIMENSION 1: VOLATILITY SCORING (Poids: 25%)
 * 
 * Based on the cahier des charges specifications:
 * - Métrique 1.1: Coefficient de Variation (CV)
 * - Métrique 1.2: Peak-to-Trough Ratio (PTR)
 * - Métrique 1.3: Acceleration Rate
 */

export type PricePoint = {
    price: number
    date: Date
}

/**
 * Calculate Coefficient of Variation (CV)
 * CV = (Standard Deviation / Mean) × 100
 * 
 * Thresholds:
 * - CV < 10% = 0 points (very stable)
 * - CV 10-20% = 25 points (stable)
 * - CV 20-40% = 50 points (volatile)
 * - CV 40-80% = 75 points (very volatile)
 * - CV > 80% = 100 points (extremely volatile)
 */
export function calculateCV(prices: number[]): number {
    if (prices.length < 2) return 0

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
    if (mean === 0) return 0

    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    return (stdDev / mean) * 100
}

export function cvToScore(cv: number): number {
    if (cv < 2) return 10   // Extremely stable
    if (cv < 5) return 40   // Slight fluctuation
    if (cv < 10) return 70  // Moderate volatility
    return 100              // Higly volatile
}

/**
 * Calculate Peak-to-Trough Ratio (PTR)
 * PTR = ((Max - Min) / Min) × 100
 * 
 * Thresholds:
 * - PTR > 100% in 30 days = +40 points
 * - PTR > 200% = +60 points
 * - PTR > 300% = +80 points (extreme zone)
 */
export function calculatePTR(prices: number[]): number {
    if (prices.length < 2) return 0

    const min = Math.min(...prices)
    const max = Math.max(...prices)

    if (min === 0) return 0

    return ((max - min) / min) * 100
}

export function ptrToScore(ptr: number): number {
    if (ptr < 10) return 10
    if (ptr < 30) return 40
    if (ptr < 50) return 70
    return 100
}

/**
 * Calculate Acceleration Rate
 * Detects if gains are accelerating exponentially (speculative sign)
 * 
 * ACC = average(returns last 7d) / average(returns 60d before)
 * 
 * Thresholds:
 * - ACC > 2.0 = +30 points
 * - ACC > 5.0 = +50 points
 * - ACC > 10.0 = +70 points
 */
export function calculateAcceleration(prices: PricePoint[]): number {
    if (prices.length < 14) return 0

    // Sort by date
    const sorted = [...prices].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate daily returns
    const returns: number[] = []
    for (let i = 1; i < sorted.length; i++) {
        const dailyReturn = (sorted[i].price / sorted[i - 1].price) - 1
        returns.push(dailyReturn)
    }

    // Recent 7 days vs previous 60 days
    const recent7d = returns.slice(-7)
    const previous60d = returns.slice(-67, -7)

    if (previous60d.length === 0) return 0

    const avgRecent = recent7d.reduce((sum, r) => sum + r, 0) / recent7d.length
    const avgPrevious = previous60d.reduce((sum, r) => sum + r, 0) / previous60d.length

    if (avgPrevious === 0) return 0

    return avgRecent / avgPrevious
}

export function accelerationToScore(acc: number): number {
    if (acc < 2) return 0
    if (acc < 5) return 30
    if (acc < 10) return 50
    return 70
}

/**
 * Calculate complete D1 Volatility Score
 * D1_Score = 0.4 × CV_Score + 0.3 × PTR_Score + 0.3 × ACC_Score
 */
export function calculateD1Score(priceHistory: PricePoint[]): {
    cvScore: number
    ptrScore: number
    accScore: number
    d1Total: number
} {
    const prices = priceHistory.map(p => p.price)

    const cv = calculateCV(prices)
    const cvScore = cvToScore(cv)

    const ptr = calculatePTR(prices)
    const ptrScore = ptrToScore(ptr)

    const acc = calculateAcceleration(priceHistory)
    const accScore = accelerationToScore(acc)

    const d1Total = Math.round(0.4 * cvScore + 0.3 * ptrScore + 0.3 * accScore)

    return {
        cvScore,
        ptrScore,
        accScore,
        d1Total
    }
}
