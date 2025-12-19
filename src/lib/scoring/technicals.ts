// Technical Analysis Service for Rebond Predictions
// RSI, MACD, Volume Spike detection

import { PriceHistory } from '../prices'

export type TechnicalIndicators = {
    rsi14: number
    macd: {
        macdLine: number
        signalLine: number
        histogram: number
    }
    volumeRatio: number
    isOversold: boolean
    isVolumeSpiking: boolean
    isMACDBullish: boolean
    mlScore?: number // 0-100 from LSTM
}

export type RebondScore = {
    score: number // 0-100
    confidence: number // 0-1
    signals: {
        rsi: 'oversold' | 'neutral' | 'overbought'
        macd: 'bullish' | 'neutral' | 'bearish'
        volume: 'spiking' | 'normal' | 'low'
        ml?: 'bullish' | 'neutral' | 'bearish'
    }
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
    mlContribution?: number
}

// Calculate RSI (Relative Strength Index)
// RSI < 30 = Oversold (potential bounce)
// RSI > 70 = Overbought (potential drop)
export function calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
        return 50 // Not enough data, return neutral
    }

    let gains = 0
    let losses = 0

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) {
            gains += change
        } else {
            losses += Math.abs(change)
        }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // Calculate smoothed RSI for remaining prices
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        const gain = change > 0 ? change : 0
        const loss = change < 0 ? Math.abs(change) : 0

        avgGain = (avgGain * (period - 1) + gain) / period
        avgLoss = (avgLoss * (period - 1) + loss) / period
    }

    if (avgLoss === 0) {
        return 100 // No losses = max RSI
    }

    const rs = avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))

    return Math.round(rsi * 100) / 100
}

// Calculate MACD (Moving Average Convergence Divergence)
// MACD Line = 12-period EMA - 26-period EMA
// Signal Line = 9-period EMA of MACD Line
export function calculateMACD(prices: number[]): {
    macdLine: number
    signalLine: number
    histogram: number
} {
    if (prices.length < 26) {
        return { macdLine: 0, signalLine: 0, histogram: 0 }
    }

    const ema12 = calculateEMA(prices, 12)
    const ema26 = calculateEMA(prices, 26)

    // Calculate MACD history for signal line
    const macdHistory: number[] = []
    for (let i = 25; i < prices.length; i++) {
        const ema12Value = calculateEMAAtIndex(prices.slice(0, i + 1), 12)
        const ema26Value = calculateEMAAtIndex(prices.slice(0, i + 1), 26)
        macdHistory.push(ema12Value - ema26Value)
    }

    const macdLine = ema12 - ema26
    const signalLine = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macdLine
    const histogram = macdLine - signalLine

    return {
        macdLine: Math.round(macdLine * 1000) / 1000,
        signalLine: Math.round(signalLine * 1000) / 1000,
        histogram: Math.round(histogram * 1000) / 1000
    }
}

// Calculate Exponential Moving Average
function calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0
    if (prices.length < period) return prices[prices.length - 1]

    const multiplier = 2 / (period + 1)
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period

    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema
    }

    return ema
}

// Calculate EMA at a specific index
function calculateEMAAtIndex(prices: number[], period: number): number {
    return calculateEMA(prices, period)
}

// Detect Volume Spike
// Returns ratio of current volume to average volume
export function calculateVolumeRatio(
    currentVolume: number,
    historicalVolumes: number[]
): number {
    if (historicalVolumes.length === 0 || currentVolume === 0) {
        return 1 // No data, return neutral
    }

    const avgVolume = historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length
    if (avgVolume === 0) return 1

    return Math.round((currentVolume / avgVolume) * 100) / 100
}

// Main function to calculate all technical indicators
export function calculateTechnicalIndicators(
    priceHistory: PriceHistory[],
    currentVolume: number = 0,
    historicalVolumes: number[] = []
): TechnicalIndicators {
    const prices = priceHistory.map(p => p.price)

    const rsi14 = calculateRSI(prices, 14)
    const macd = calculateMACD(prices)
    const volumeRatio = calculateVolumeRatio(currentVolume, historicalVolumes)

    return {
        rsi14,
        macd,
        volumeRatio,
        isOversold: rsi14 < 30,
        isVolumeSpiking: volumeRatio > 2.0, // 2x normal volume
        isMACDBullish: macd.histogram > 0 && macd.macdLine > macd.signalLine
    }
}

// Calculate Rebond Score
// Combines RSI, MACD, Volume AND optional ML Score
export function calculateRebondScore(indicators: TechnicalIndicators): RebondScore {
    let technicalScore = 0
    let confidence = 0

    // RSI signal (0-35 points)
    let rsiSignal: 'oversold' | 'neutral' | 'overbought' = 'neutral'
    if (indicators.rsi14 < 30) {
        technicalScore += 35
        confidence += 0.3
        rsiSignal = 'oversold'
    } else if (indicators.rsi14 < 40) {
        technicalScore += 20
        confidence += 0.15
    } else if (indicators.rsi14 > 70) {
        technicalScore -= 15
        rsiSignal = 'overbought'
    }

    // MACD signal (0-35 points)
    let macdSignal: 'bullish' | 'neutral' | 'bearish' = 'neutral'
    if (indicators.isMACDBullish) {
        technicalScore += 35
        confidence += 0.35
        macdSignal = 'bullish'
    } else if (indicators.macd.histogram < 0 && indicators.macd.macdLine < indicators.macd.signalLine) {
        technicalScore -= 10
        macdSignal = 'bearish'
    }

    // Volume signal (0-30 points)
    let volumeSignal: 'spiking' | 'normal' | 'low' = 'normal'
    if (indicators.isVolumeSpiking) {
        technicalScore += 30
        confidence += 0.25
        volumeSignal = 'spiking'
    } else if (indicators.volumeRatio < 0.5) {
        volumeSignal = 'low'
    }

    // Normalize technical score to 0-100
    technicalScore = Math.max(0, Math.min(100, technicalScore))

    // Final Score Calculation (Ensemble)
    let finalScore = technicalScore
    let mlSignal: 'bullish' | 'neutral' | 'bearish' | undefined

    if (indicators.mlScore !== undefined) {
        // Ensemble Method: 70% Technical + 30% ML
        finalScore = (technicalScore * 0.7) + (indicators.mlScore * 0.3)
        // Boost confidence if both agree
        if ((technicalScore > 60 && indicators.mlScore > 60) || (technicalScore < 40 && indicators.mlScore < 40)) {
            confidence += 0.15
        }

        if (indicators.mlScore > 60) mlSignal = 'bullish'
        else if (indicators.mlScore < 40) mlSignal = 'bearish'
        else mlSignal = 'neutral'
    }

    // Cap Score and Confidence
    finalScore = Math.max(0, Math.min(100, finalScore))
    confidence = Math.max(0, Math.min(1, confidence))

    // Determine recommendation
    let recommendation: RebondScore['recommendation']
    if (finalScore >= 80) {
        recommendation = 'strong_buy'
    } else if (finalScore >= 60) {
        recommendation = 'buy'
    } else if (finalScore >= 40) {
        recommendation = 'hold'
    } else if (finalScore >= 20) {
        recommendation = 'sell'
    } else {
        recommendation = 'strong_sell'
    }

    return {
        score: Math.round(finalScore),
        confidence,
        signals: {
            rsi: rsiSignal,
            macd: macdSignal,
            volume: volumeSignal,
            ml: mlSignal
        },
        recommendation,
        mlContribution: indicators.mlScore
    }
}
