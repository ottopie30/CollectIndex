/**
 * Cardmarket Auto-Mapper Service
 * 
 * Fetches and caches the Cardmarket Product Catalog (~180,000 cards)
 * Maps products to TCGdex IDs using name + set matching
 */

// Cache for product catalog
let productCatalogCache: Map<number, CardmarketProduct> | null = null
let catalogFetchTime = 0
const CATALOG_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Cardmarket URLs  
const CARDMARKET_SINGLES_URL = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json'
const CARDMARKET_PRICE_GUIDE_URL = 'https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json'

export interface CardmarketProduct {
    idProduct: number
    name: string
    idCategory: number
    categoryName: string
    idExpansion: number
    idMetacard: number
    dateAdded: string
}

export interface CardmarketFullData {
    idProduct: number
    name: string
    idExpansion: number
    // Price data
    avg: number | null
    low: number | null
    trend: number | null
    avg1: number | null
    avg7: number | null
    avg30: number | null
}

/**
 * Fetch the complete Cardmarket product catalog (~180,000 cards)
 */
export async function fetchProductCatalog(): Promise<Map<number, CardmarketProduct>> {
    const now = Date.now()

    if (productCatalogCache && (now - catalogFetchTime) < CATALOG_CACHE_DURATION) {
        console.log('📦 Using cached Cardmarket product catalog')
        return productCatalogCache
    }

    console.log('⬇️ Fetching Cardmarket product catalog (this may take a moment)...')

    try {
        const response = await fetch(CARDMARKET_SINGLES_URL, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch product catalog: ${response.status}`)
        }

        const data = await response.json()
        console.log(`✅ Fetched ${data.products.length} products`)

        // Build lookup map by idProduct
        const productMap = new Map<number, CardmarketProduct>()
        for (const product of data.products) {
            productMap.set(product.idProduct, product)
        }

        productCatalogCache = productMap
        catalogFetchTime = now

        return productMap
    } catch (error) {
        console.error('❌ Failed to fetch product catalog:', error)
        if (productCatalogCache) {
            console.log('⚠️ Using stale cached catalog')
            return productCatalogCache
        }
        throw error
    }
}

/**
 * Known Cardmarket Expansion ID mappings to TCGdex set IDs
 * Build this incrementally as we discover mappings
 */
export const EXPANSION_MAP: Record<number, string> = {
    // Scarlet & Violet Era
    2408: 'sv8a',    // Prismatic Evolutions
    2338: 'sv7',     // Stellar Crown  
    2296: 'sv6pt5',  // Shrouded Fable
    2249: 'sv6',     // Twilight Masquerade
    2200: 'sv5',     // Temporal Forces
    2155: 'sv4pt5',  // Paldean Fates
    2107: 'sv4',     // Paradox Rift
    2058: 'sv3pt5',  // Pokemon 151
    2008: 'sv3',     // Obsidian Flames
    1962: 'sv2',     // Paldea Evolved
    1906: 'sv1',     // Scarlet & Violet Base

    // Sword & Shield Era
    1880: 'swsh12pt5', // Crown Zenith
    1841: 'swsh12',    // Silver Tempest
    1803: 'swsh11',    // Lost Origin
    1766: 'swsh10pt5', // Pokemon GO
    1730: 'swsh10',    // Astral Radiance
    1694: 'swsh9',     // Brilliant Stars
    1661: 'swsh8',     // Fusion Strike
    1628: 'swsh7',     // Evolving Skies
    1596: 'swsh6',     // Chilling Reign
    1564: 'swsh5',     // Battle Styles
    1532: 'swsh4',     // Vivid Voltage
    1500: 'swsh3',     // Darkness Ablaze
    1465: 'swsh2',     // Rebel Clash
    1430: 'swsh1',     // Sword & Shield Base

    // Classic sets
    1523: 'base1',     // Base Set
    1524: 'base2',     // Jungle
    1525: 'base3',     // Fossil
    1526: 'base4',     // Base Set 2
    1527: 'base5',     // Team Rocket
}

/**
 * Search for a product by name and expansion
 */
export async function findCardmarketProduct(
    cardName: string,
    setCode?: string
): Promise<CardmarketProduct | null> {
    const catalog = await fetchProductCatalog()

    const normalizedName = cardName.toLowerCase().trim()

    for (const [, product] of catalog) {
        // Extract base name (before attacks in brackets)
        const productBaseName = product.name.split('[')[0].trim().toLowerCase()

        if (productBaseName === normalizedName) {
            // If set code provided, verify expansion matches
            if (setCode) {
                const expectedExpansion = Object.entries(EXPANSION_MAP)
                    .find(([, code]) => code === setCode)?.[0]

                if (expectedExpansion && product.idExpansion === parseInt(expectedExpansion)) {
                    return product
                }
            } else {
                return product
            }
        }
    }

    return null
}

/**
 * Get product catalog stats
 */
export function getProductCatalogStats(): {
    total: number
    cached: boolean
    expansions: number
} {
    return {
        total: productCatalogCache?.size || 0,
        cached: productCatalogCache !== null,
        expansions: new Set(
            Array.from(productCatalogCache?.values() || [])
                .map(p => p.idExpansion)
        ).size
    }
}

/**
 * Search products by partial name match
 */
export async function searchProducts(
    query: string,
    limit = 50
): Promise<CardmarketProduct[]> {
    const catalog = await fetchProductCatalog()
    const normalizedQuery = query.toLowerCase()
    const results: CardmarketProduct[] = []

    for (const [, product] of catalog) {
        if (product.name.toLowerCase().includes(normalizedQuery)) {
            results.push(product)
            if (results.length >= limit) break
        }
    }

    return results
}

/**
 * Get all products in a specific expansion
 */
export async function getProductsByExpansion(
    idExpansion: number
): Promise<CardmarketProduct[]> {
    const catalog = await fetchProductCatalog()
    return Array.from(catalog.values())
        .filter(p => p.idExpansion === idExpansion)
}
