import { z } from 'zod'

/**
 * Price Validation Schemas
 * Ensures data integrity for price data entering the system
 */

// Single price point schema
export const PricePointSchema = z.object({
    value: z.number()
        .positive('Price must be positive')
        .finite('Price must be a finite number')
        .max(1000000, 'Price exceeds maximum allowed value'),
    currency: z.enum(['EUR', 'USD']),
    date: z.string().datetime('Invalid date format')
        .or(z.date())
        .transform(val => typeof val === 'string' ? new Date(val) : val)
})

// Price history entry schema
export const PriceHistorySchema = z.object({
    cardId: z.string().uuid('Invalid card ID format'),
    source: z.enum(['cardmarket', 'tcgplayer', 'ebay', 'manual']),
    price: PricePointSchema,
    condition: z.enum(['mint', 'near_mint', 'excellent', 'good', 'played', 'poor'])
        .optional(),
    variant: z.enum(['regular', 'reverse_holo', 'first_edition', '1st_edition'])
        .optional(),
    timestamp: z.string().datetime()
        .or(z.date())
        .transform(val => typeof val === 'string' ? new Date(val) : val),
})

// Batch price update schema
export const BatchPriceSchema = z.object({
    prices: z.array(PriceHistorySchema)
        .min(1, 'At least one price entry required')
        .max(1000, 'Maximum 1000 price entries per batch')
})

// API request schema for price updates
export const PriceUpdateRequestSchema = z.object({
    cardId: z.string().uuid(),
    eurPrice: z.number().positive().optional(),
    usdPrice: z.number().positive().optional(),
    source: z.string().optional(),
    timestamp: z.string().datetime().optional()
}).refine(
    data => data.eurPrice !== undefined || data.usdPrice !== undefined,
    { message: 'At least one price (EUR or USD) must be provided' }
)

// Type exports
export type PricePoint = z.infer<typeof PricePointSchema>
export type PriceHistory = z.infer<typeof PriceHistorySchema>
export type BatchPrice = z.infer<typeof BatchPriceSchema>
export type PriceUpdateRequest = z.infer<typeof PriceUpdateRequestSchema>

/**
 * Validation helper functions
 */

// Validate and sanitize a single price
export function validatePrice(price: unknown): PricePoint {
    return PricePointSchema.parse(price)
}

// Safe validation (returns error instead of throwing)
export function safeValidatePrice(price: unknown) {
    return PricePointSchema.safeParse(price)
}

// Validate price history entry
export function validatePriceHistory(entry: unknown): PriceHistory {
    return PriceHistorySchema.parse(entry)
}

// Batch validate multiple prices
export function validateBatchPrices(prices: unknown[]): BatchPrice {
    return BatchPriceSchema.parse({ prices })
}

// Detect outliers (prices > 3 standard deviations)
export function detectPriceOutliers(prices: number[]): number[] {
    if (prices.length < 3) return []

    const mean = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    const threshold = 3 * stdDev

    return prices.filter(price => Math.abs(price - mean) > threshold)
}

// Check if price change is suspicious (>50% change)
export function isSuspiciousPriceChange(oldPrice: number, newPrice: number): boolean {
    const percentChange = Math.abs((newPrice - oldPrice) / oldPrice) * 100
    return percentChange > 50
}
