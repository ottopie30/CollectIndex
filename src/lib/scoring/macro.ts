/**
 * DIMENSION 5: MACRO SCORING (Poids: 15%)
 * 
 * Based on the cahier des charges specifications:
 * - Métrique 5.1: Bitcoin/Crypto Correlation
 * - Métrique 5.2: Fear & Greed Index
 * - Métrique 5.3: Economic Indicators (interest rates, liquidity)
 */

/**
 * Calculate correlation with Bitcoin
 * 
 * High correlation with crypto = speculative asset behavior
 * 
 * Thresholds:
 * - Corr < 0.2 = 10 points (independent, mature)
 * - Corr 0.2-0.4 = 25 points (weak correlation)
 * - Corr 0.4-0.6 = 50 points (moderate)
 * - Corr 0.6-0.8 = 75 points (strong, speculative)
 * - Corr > 0.8 = 100 points (extremely speculative)
 */
export function getCryptoCorrelationScore(correlation: number): number {
    const absCorr = Math.abs(correlation)

    if (absCorr < 0.2) return 10
    if (absCorr < 0.4) return 25
    if (absCorr < 0.6) return 50
    if (absCorr < 0.8) return 75
    return 100
}

/**
 * Calculate Fear & Greed Index impact
 * 
 * Standard market sentiment indicator (0-100)
 * - 0-25: Extreme Fear
 * - 25-45: Fear
 * - 45-55: Neutral
 * - 55-75: Greed
 * - 75-100: Extreme Greed
 * 
 * High greed = speculative environment
 */
export function getFearGreedScore(fearGreedIndex: number): number {
    if (fearGreedIndex >= 75) return 100  // Extreme greed = high speculation
    if (fearGreedIndex >= 55) return 75   // Greed
    if (fearGreedIndex >= 45) return 50   // Neutral
    if (fearGreedIndex >= 25) return 30   // Fear
    return 15  // Extreme fear (contrarian opportunity)
}

/**
 * Calculate interest rate environment score
 * 
 * High rates = less liquidity = less speculation
 * Low rates = more liquidity = more speculation
 * 
 * Current Fed Funds Rate impact:
 * - > 5% = 30 points (tight)
 * - 3-5% = 50 points (moderate)
 * - 1-3% = 70 points (accommodative)
 * - < 1% = 90 points (very loose)
 */
export function getInterestRateScore(fedFundsRate: number): number {
    if (fedFundsRate > 5) return 30
    if (fedFundsRate > 3) return 50
    if (fedFundsRate > 1) return 70
    return 90
}

/**
 * Calculate S&P 500 correlation
 * 
 * Cards correlating with equities = risk-on asset
 */
export function getEquityCorrelationScore(sp500Correlation: number): number {
    const absCorr = Math.abs(sp500Correlation)

    if (absCorr < 0.2) return 20
    if (absCorr < 0.4) return 40
    if (absCorr < 0.6) return 60
    return 80
}

/**
 * Calculate collectibles market heat
 * 
 * Based on broader collectibles market performance
 * (sports cards, art, other TCGs)
 */
export function getCollectiblesHeatScore(
    sportsCardsYoY: number,  // Year-over-year change %
    artMarketYoY: number,
    otherTCGsYoY: number
): number {
    const avgChange = (sportsCardsYoY + artMarketYoY + otherTCGsYoY) / 3

    if (avgChange > 50) return 100  // Very hot market
    if (avgChange > 25) return 80
    if (avgChange > 10) return 60
    if (avgChange > 0) return 40
    if (avgChange > -10) return 25
    return 10  // Cold market
}

/**
 * Get Pokemon TCG specific market cycle
 * 
 * Based on typical patterns:
 * - January-February: Post-holiday correction
 * - March-May: Spring appreciation
 * - June-August: Summer doldrums
 * - September-October: Pre-holiday rally
 * - November-December: Holiday peak
 */
export function getSeasonalScore(month: number): number {
    // Peak speculation months
    if (month === 11 || month === 12) return 80  // Nov-Dec
    if (month === 10) return 70  // October
    if (month === 9) return 60   // September

    // Low months
    if (month === 1 || month === 2) return 30  // Jan-Feb
    if (month >= 6 && month <= 8) return 35     // Summer

    // Neutral
    return 50
}

/**
 * Calculate complete D5 Macro Score
 * D5_Score = 0.3 × Crypto_Corr + 0.3 × Fear_Greed + 0.2 × Interest_Rate + 0.2 × Seasonal
 */
export function calculateD5Score(
    btcCorrelation: number = 0.5,
    fearGreedIndex: number = 50,
    fedFundsRate: number = 5.0,
    currentMonth: number = new Date().getMonth() + 1
): {
    cryptoCorrelationScore: number
    fearGreedScore: number
    interestRateScore: number
    seasonalScore: number
    d5Total: number
} {
    const cryptoCorrelationScore = getCryptoCorrelationScore(btcCorrelation)
    const fearGreedScore = getFearGreedScore(fearGreedIndex)
    const interestRateScore = getInterestRateScore(fedFundsRate)
    const seasonalScore = getSeasonalScore(currentMonth)

    // Weighted average
    const d5Total = Math.round(
        0.3 * cryptoCorrelationScore +
        0.3 * fearGreedScore +
        0.2 * interestRateScore +
        0.2 * seasonalScore
    )

    return {
        cryptoCorrelationScore,
        fearGreedScore,
        interestRateScore,
        seasonalScore,
        d5Total
    }
}

/**
 * Get current macro environment snapshot
 * Uses reasonable defaults for demo purposes
 */
export function getCurrentMacroEnvironment(): {
    btcCorrelation: number
    fearGreedIndex: number
    fedFundsRate: number
    sp500Change: number
} {
    // These would normally come from APIs
    // Using realistic late-2024 defaults
    return {
        btcCorrelation: 0.65,     // Moderate-high crypto correlation
        fearGreedIndex: 68,       // Greed territory (crypto bull market)
        fedFundsRate: 4.5,        // Current Fed rate ~4.5%
        sp500Change: 25           // S&P up ~25% YTD
    }
}
