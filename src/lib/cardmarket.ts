/**
 * Cardmarket Price Guide Service
 * 
 * Uses the public Cardmarket PriceGuide JSON which is updated daily.
 * URL: https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json
 * (6 = Pokémon TCG game ID)
 */

const CARDMARKET_PRICE_GUIDE_URL = 'https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json'

export interface CardmarketPriceGuide {
    idProduct: number
    idCategory: number
    avg: number | null
    low: number | null
    trend: number | null
    avg1: number | null
    avg7: number | null
    avg30: number | null
    'avg-holo': number | null
    'low-holo': number | null
    'trend-holo': number | null
    'avg1-holo': number | null
    'avg7-holo': number | null
    'avg30-holo': number | null
}

export interface CardmarketPriceGuideResponse {
    version: number
    createdAt: string
    priceGuides: CardmarketPriceGuide[]
}

// Cache for the price guide (reloaded every 24h)
let priceGuideCache: Map<number, CardmarketPriceGuide> | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch the entire Cardmarket price guide
 * The file is ~13MB, so we cache it in memory
 */
export async function fetchPriceGuide(): Promise<Map<number, CardmarketPriceGuide>> {
    const now = Date.now()

    // Return cached data if still valid
    if (priceGuideCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('📦 Using cached Cardmarket price guide')
        return priceGuideCache
    }

    console.log('⬇️ Fetching Cardmarket price guide...')

    try {
        const response = await fetch(CARDMARKET_PRICE_GUIDE_URL, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch price guide: ${response.status}`)
        }

        const data: CardmarketPriceGuideResponse = await response.json()

        console.log(`✅ Fetched ${data.priceGuides.length} price entries (created: ${data.createdAt})`)

        // Build lookup map by idProduct
        const priceMap = new Map<number, CardmarketPriceGuide>()
        for (const guide of data.priceGuides) {
            priceMap.set(guide.idProduct, guide)
        }

        priceGuideCache = priceMap
        lastFetchTime = now

        return priceMap
    } catch (error) {
        console.error('❌ Failed to fetch Cardmarket price guide:', error)

        // Return cached data if available (even if expired)
        if (priceGuideCache) {
            console.log('⚠️ Using stale cached price guide')
            return priceGuideCache
        }

        throw error
    }
}

/**
 * Get price data for a specific Cardmarket product ID
 */
export async function getCardmarketPrice(idProduct: number): Promise<CardmarketPriceGuide | null> {
    const priceGuide = await fetchPriceGuide()
    return priceGuide.get(idProduct) || null
}

/**
 * Get prices for multiple products at once (efficient batch lookup)
 */
export async function getCardmarketPrices(productIds: number[]): Promise<Map<number, CardmarketPriceGuide>> {
    const priceGuide = await fetchPriceGuide()
    const results = new Map<number, CardmarketPriceGuide>()

    for (const id of productIds) {
        const price = priceGuide.get(id)
        if (price) {
            results.set(id, price)
        }
    }

    return results
}

/**
 * Get summary stats of the price guide
 */
export async function getPriceGuideStats(): Promise<{
    totalProducts: number
    lastUpdated: string
    avgPriceRange: { min: number; max: number }
}> {
    const priceGuide = await fetchPriceGuide()

    let minPrice = Infinity
    let maxPrice = 0

    for (const [, guide] of priceGuide) {
        if (guide.trend !== null) {
            minPrice = Math.min(minPrice, guide.trend)
            maxPrice = Math.max(maxPrice, guide.trend)
        }
    }

    return {
        totalProducts: priceGuide.size,
        lastUpdated: new Date(lastFetchTime).toISOString(),
        avgPriceRange: { min: minPrice, max: maxPrice }
    }
}

/**
 * Clear the cache (useful for testing or forced refresh)
 */
export function clearPriceGuideCache(): void {
    priceGuideCache = null
    lastFetchTime = 0
    console.log('🗑️ Cardmarket price guide cache cleared')
}
