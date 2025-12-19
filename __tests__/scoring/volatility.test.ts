import { describe, it, expect } from 'vitest'
import { calculateVolatilityScore, calculateGrowthScore } from '@/lib/scoring/scoring'

describe('Volatility Scoring (D1)', () => {
    it('should return high score for low volatility', () => {
        const prices = [100, 102, 101, 103, 102, 101, 100]
        const score = calculateVolatilityScore(prices)
        expect(score).toBeGreaterThan(70)
    })

    it('should return low score for high volatility', () => {
        const prices = [100, 150, 80, 200, 60, 180, 90]
        const score = calculateVolatilityScore(prices)
        expect(score).toBeLessThan(40)
    })

    it('should handle single price point', () => {
        const prices = [100]
        const score = calculateVolatilityScore(prices)
        expect(score).toBe(50) // Default neutral score
    })

    it('should handle empty array', () => {
        const prices: number[] = []
        const score = calculateVolatilityScore(prices)
        expect(score).toBe(0)
    })
})

describe('Growth Scoring (D2)', () => {
    it('should return high score for strong growth', () => {
        const prices = [100, 110, 120, 130, 140, 150]
        const score = calculateGrowthScore(prices)
        expect(score).toBeGreaterThan(70)
    })

    it('should return low score for declining prices', () => {
        const prices = [100, 95, 90, 85, 80, 75]
        const score = calculateGrowthScore(prices)
        expect(score).toBeLessThan(30)
    })

    it('should return neutral score for flat prices', () => {
        const prices = [100, 100, 100, 100, 100]
        const score = calculateGrowthScore(prices)
        expect(score).toBeGreaterThanOrEqual(45)
        expect(score).toBeLessThanOrEqual(55)
    })
})
