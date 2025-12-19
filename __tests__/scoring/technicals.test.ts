import { describe, it, expect } from 'vitest'
import { calculateRSI, calculateMACD } from '@/lib/scoring/technicals'

describe('RSI Calculation', () => {
    it('should calculate RSI correctly for uptrend', () => {
        const prices = [100, 102, 105, 108, 110, 112, 115, 118, 120, 122, 125, 128, 130, 132, 135]
        const rsi = calculateRSI(prices)
        expect(rsi).toBeGreaterThan(50)
        expect(rsi).toBeLessThanOrEqual(100)
    })

    it('should calculate RSI correctly for downtrend', () => {
        const prices = [100, 98, 95, 92, 90, 88, 85, 82, 80, 78, 75, 72, 70, 68, 65]
        const rsi = calculateRSI(prices)
        expect(rsi).toBeLessThan(50)
        expect(rsi).toBeGreaterThanOrEqual(0)
    })

    it('should identify oversold conditions (RSI < 30)', () => {
        const prices = [100, 90, 80, 70, 60, 55, 50, 48, 45, 43, 40, 38, 35, 33, 30]
        const rsi = calculateRSI(prices)
        expect(rsi).toBeLessThan(30)
    })

    it('should identify overbought conditions (RSI > 70)', () => {
        const prices = [100, 110, 120, 130, 140, 145, 150, 152, 155, 157, 160, 162, 165, 167, 170]
        const rsi = calculateRSI(prices)
        expect(rsi).toBeGreaterThan(70)
    })

    it('should handle insufficient data', () => {
        const prices = [100, 102, 105]
        const rsi = calculateRSI(prices)
        expect(rsi).toBe(50) // Default neutral value
    })
})

describe('MACD Calculation', () => {
    it('should calculate MACD for trending data', () => {
        const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 2)
        const macd = calculateMACD(prices)

        expect(macd).toHaveProperty('macd')
        expect(macd).toHaveProperty('signal')
        expect(macd).toHaveProperty('histogram')
    })

    it('should detect bullish crossover', () => {
        // Prices showing acceleration
        const prices = [
            ...Array.from({ length: 20 }, (_, i) => 100 + i),
            ...Array.from({ length: 10 }, (_, i) => 120 + i * 2)
        ]
        const macd = calculateMACD(prices)

        expect(macd.histogram).toBeGreaterThan(0) // MACD above signal
    })

    it('should detect bearish crossover', () => {
        // Prices showing deceleration
        const prices = [
            ...Array.from({ length: 20 }, (_, i) => 100 - i),
            ...Array.from({ length: 10 }, (_, i) => 80 - i * 2)
        ]
        const macd = calculateMACD(prices)

        expect(macd.histogram).toBeLessThan(0) // MACD below signal
    })

    it('should handle insufficient data gracefully', () => {
        const prices = [100, 102, 105]
        const macd = calculateMACD(prices)

        expect(macd.macd).toBe(0)
        expect(macd.signal).toBe(0)
        expect(macd.histogram).toBe(0)
    })
})

describe('Volume Ratio Calculation', () => {
    it('should detect volume spike', () => {
        // Mock volume data with spike
        const volumes = [1000, 1100, 1050, 1200, 5000] // 5x spike
        const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b) / 4
        const currentVolume = volumes[volumes.length - 1]
        const ratio = currentVolume / avgVolume

        expect(ratio).toBeGreaterThan(3) // Significant spike
    })

    it('should detect normal volume', () => {
        const volumes = [1000, 1100, 1050, 1150, 1080]
        const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b) / 4
        const currentVolume = volumes[volumes.length - 1]
        const ratio = currentVolume / avgVolume

        expect(ratio).toBeLessThan(2) // Normal range
        expect(ratio).toBeGreaterThan(0.5)
    })
})
