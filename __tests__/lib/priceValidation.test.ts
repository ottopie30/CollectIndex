import { describe, it, expect } from 'vitest'
import { validatePrice, safeValidatePrice, detectPriceOutliers, isSuspiciousPriceChange } from '@/lib/validation/priceSchema'

describe('Price Validation', () => {
    it('should validate correct price data', () => {
        const validPrice = {
            value: 49.99,
            currency: 'EUR',
            date: '2024-01-15T10:00:00Z'
        }

        expect(() => validatePrice(validPrice)).not.toThrow()
    })

    it('should reject negative prices', () => {
        const invalidPrice = {
            value: -10,
            currency: 'EUR',
            date: '2024-01-15T10:00:00Z'
        }

        expect(() => validatePrice(invalidPrice)).toThrow()
    })

    it('should reject invalid currency', () => {
        const invalidPrice = {
            value: 49.99,
            currency: 'GBP', // Not in enum
            date: '2024-01-15T10:00:00Z'
        }

        expect(() => validatePrice(invalidPrice)).toThrow()
    })

    it('should safely validate and return errors', () => {
        const invalidPrice = {
            value: -10,
            currency: 'EUR',
            date: 'invalid-date'
        }

        const result = safeValidatePrice(invalidPrice)
        expect(result.success).toBe(false)
    })
})

describe('Outlier Detection', () => {
    it('should detect price outliers', () => {
        const prices = [100, 102, 101, 103, 500, 102, 101] // 500 is outlier
        const outliers = detectPriceOutliers(prices)

        expect(outliers).toContain(500)
        expect(outliers.length).toBeGreaterThan(0)
    })

    it('should not flag normal variance', () => {
        const prices = [100, 105, 98, 103, 99, 102, 101]
        const outliers = detectPriceOutliers(prices)

        expect(outliers.length).toBe(0)
    })

    it('should handle small datasets', () => {
        const prices = [100, 102]
        const outliers = detectPriceOutliers(prices)

        expect(outliers).toEqual([])
    })
})

describe('Suspicious Price Change Detection', () => {
    it('should flag >50% price changes', () => {
        const oldPrice = 100
        const newPrice = 200 // 100% increase

        expect(isSuspiciousPriceChange(oldPrice, newPrice)).toBe(true)
    })

    it('should flag large decreases', () => {
        const oldPrice = 100
        const newPrice = 30 // 70% decrease

        expect(isSuspiciousPriceChange(oldPrice, newPrice)).toBe(true)
    })

    it('should allow normal price changes', () => {
        const oldPrice = 100
        const newPrice = 120 // 20% increase

        expect(isSuspiciousPriceChange(oldPrice, newPrice)).toBe(false)
    })
})
