// Price service for fetching and managing card prices
// Using CardMarket and TCGPlayer API data (via scraping/proxy services)

export type PriceData = {
    cardId: string
    prices: {
        cardmarket?: {
            trendPrice: number
            lowPrice: number
            avg30: number
            avg7: number
            avg1: number
        }
        tcgplayer?: {
            market: number
            low: number
            mid: number
            high: number
        }
    }
    lastUpdated: string
}

export type PriceHistory = {
    date: string
    price: number
    source: 'cardmarket' | 'tcgplayer'
}

// In-memory cache for prices (would use Redis in production)
const priceCache = new Map<string, { data: PriceData; expiry: number }>()
const CACHE_TTL = 1000 * 60 * 15 // 15 minutes

// Mock price data generator (simulates real API)
function generateMockPrice(cardId: string): PriceData {
    const basePrice = Math.random() * 200 + 5 // 5-205€
    const variance = 0.15 // 15% variance

    return {
        cardId,
        prices: {
            cardmarket: {
                trendPrice: basePrice,
                lowPrice: basePrice * (1 - variance),
                avg30: basePrice * (1 + Math.random() * 0.1 - 0.05),
                avg7: basePrice * (1 + Math.random() * 0.08 - 0.04),
                avg1: basePrice * (1 + Math.random() * 0.05 - 0.025),
            },
            tcgplayer: {
                market: basePrice * 1.1, // USD slightly higher
                low: basePrice * 0.9,
                mid: basePrice * 1.05,
                high: basePrice * 1.3,
            }
        },
        lastUpdated: new Date().toISOString()
    }
}

// Generate mock price history
export function generatePriceHistory(cardId: string, days: number = 90): PriceHistory[] {
    const history: PriceHistory[] = []
    const today = new Date()
    let basePrice = Math.random() * 100 + 20

    for (let i = days; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Add some realistic variance
        const change = (Math.random() - 0.48) * 5 // Slight upward bias
        basePrice = Math.max(5, basePrice + change)

        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(basePrice * 100) / 100,
            source: 'cardmarket'
        })
    }

    return history
}

// Get price for a single card
export async function getCardPrice(cardId: string): Promise<PriceData | null> {
    // Check cache first
    const cached = priceCache.get(cardId)
    if (cached && cached.expiry > Date.now()) {
        return cached.data
    }

    try {
        // In production, this would call a real API
        // For now, generate mock data
        const priceData = generateMockPrice(cardId)

        // Cache the result
        priceCache.set(cardId, {
            data: priceData,
            expiry: Date.now() + CACHE_TTL
        })

        return priceData
    } catch (error) {
        console.error('Error fetching price:', error)
        return null
    }
}

// Get prices for multiple cards
export async function getCardPrices(cardIds: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>()

    // Batch fetch (in production, would use Promise.all with real API)
    for (const cardId of cardIds) {
        const price = await getCardPrice(cardId)
        if (price) {
            results.set(cardId, price)
        }
    }

    return results
}

// Format price for display
export function formatPriceDisplay(price: number, currency: 'EUR' | 'USD' = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price)
}

// Calculate price change percentage
export function calculatePriceChange(current: number, previous: number): {
    change: number
    percentage: number
    direction: 'up' | 'down' | 'stable'
} {
    const change = current - previous
    const percentage = previous > 0 ? (change / previous) * 100 : 0

    return {
        change,
        percentage,
        direction: change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'stable'
    }
}

// Clear expired cache entries
export function clearExpiredCache(): number {
    const now = Date.now()
    let cleared = 0

    for (const [key, value] of priceCache.entries()) {
        if (value.expiry < now) {
            priceCache.delete(key)
            cleared++
        }
    }

    return cleared
}

// Get cache stats
export function getCacheStats(): { size: number; oldestEntry: string | null } {
    let oldestExpiry = Infinity
    let oldestKey: string | null = null

    for (const [key, value] of priceCache.entries()) {
        if (value.expiry < oldestExpiry) {
            oldestExpiry = value.expiry
            oldestKey = key
        }
    }

    return {
        size: priceCache.size,
        oldestEntry: oldestKey
    }
}
