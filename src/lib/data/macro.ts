/**
 * Macro Data Service - External market data
 * Sources: CoinGecko (BTC), alternative.me (Fear & Greed), Yahoo Finance (VIX)
 * All FREE APIs with generous limits
 */

// Cache to avoid excessive API calls
const cache = new Map<string, { data: unknown; expiry: number }>()
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = cache.get(key)
    if (cached && cached.expiry > Date.now()) {
        return cached.data as T
    }
    const data = await fetcher()
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL })
    return data
}

// ============================================
// BITCOIN DATA - CoinGecko API (Free, 30 calls/min)
// ============================================

export type BTCData = {
    price: number
    change24h: number
    change7d: number
    change30d: number
    marketCap: number
}

export async function getBTCData(): Promise<BTCData> {
    return fetchWithCache('btc', async () => {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
            )
            if (!response.ok) throw new Error('CoinGecko API error')

            const data = await response.json()

            return {
                price: data.market_data.current_price.usd,
                change24h: data.market_data.price_change_percentage_24h,
                change7d: data.market_data.price_change_percentage_7d,
                change30d: data.market_data.price_change_percentage_30d,
                marketCap: data.market_data.market_cap.usd
            }
        } catch (error) {
            console.error('Error fetching BTC data:', error)
            // Fallback values
            return {
                price: 100000,
                change24h: 0,
                change7d: 0,
                change30d: 0,
                marketCap: 2000000000000
            }
        }
    })
}

/**
 * Get BTC price history for correlation calculation
 */
export async function getBTCHistory(days: number = 30): Promise<{ date: string; price: number }[]> {
    return fetchWithCache(`btc-history-${days}`, async () => {
        try {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
            )
            if (!response.ok) throw new Error('CoinGecko API error')

            const data = await response.json()

            return data.prices.map(([timestamp, price]: [number, number]) => ({
                date: new Date(timestamp).toISOString().split('T')[0],
                price
            }))
        } catch (error) {
            console.error('Error fetching BTC history:', error)
            return []
        }
    })
}

// ============================================
// FEAR & GREED INDEX - alternative.me (Free, unlimited)
// ============================================

export type FearGreedData = {
    value: number // 0-100
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
    timestamp: string
    previousValue: number
    previousClassification: string
}

export async function getFearGreedIndex(): Promise<FearGreedData> {
    return fetchWithCache('fear-greed', async () => {
        try {
            const response = await fetch(
                'https://api.alternative.me/fng/?limit=2'
            )
            if (!response.ok) throw new Error('Fear & Greed API error')

            const data = await response.json()
            const current = data.data[0]
            const previous = data.data[1]

            return {
                value: parseInt(current.value),
                classification: current.value_classification,
                timestamp: new Date(parseInt(current.timestamp) * 1000).toISOString(),
                previousValue: parseInt(previous.value),
                previousClassification: previous.value_classification
            }
        } catch (error) {
            console.error('Error fetching Fear & Greed:', error)
            return {
                value: 50,
                classification: 'Neutral',
                timestamp: new Date().toISOString(),
                previousValue: 50,
                previousClassification: 'Neutral'
            }
        }
    })
}

// ============================================
// STOCK INDICES - Yahoo Finance (Free via query)
// ============================================

export type MarketIndices = {
    sp500: { price: number; change: number }
    nasdaq: { price: number; change: number }
    vix: { price: number; change: number }
}

export async function getMarketIndices(): Promise<MarketIndices> {
    return fetchWithCache('indices', async () => {
        try {
            // Using a free Yahoo Finance endpoint
            const symbols = '^GSPC,^IXIC,^VIX'
            const response = await fetch(
                `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`
            )

            if (!response.ok) {
                throw new Error('Yahoo Finance API error')
            }

            const data = await response.json()
            const quotes = data.quoteResponse.result

            const getQuote = (symbol: string) => {
                const quote = quotes.find((q: { symbol: string }) => q.symbol === symbol)
                return quote ? {
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChangePercent
                } : { price: 0, change: 0 }
            }

            return {
                sp500: getQuote('^GSPC'),
                nasdaq: getQuote('^IXIC'),
                vix: getQuote('^VIX')
            }
        } catch (error) {
            console.error('Error fetching market indices:', error)
            // Fallback values (typical market values)
            return {
                sp500: { price: 5900, change: 0 },
                nasdaq: { price: 19500, change: 0 },
                vix: { price: 15, change: 0 }
            }
        }
    })
}

// ============================================
// CORRELATION CALCULATION
// ============================================

/**
 * Calculate Pearson correlation between two price series
 */
export function calculateCorrelation(series1: number[], series2: number[]): number {
    if (series1.length !== series2.length || series1.length < 2) {
        return 0
    }

    const n = series1.length
    const mean1 = series1.reduce((a, b) => a + b, 0) / n
    const mean2 = series2.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denom1 = 0
    let denom2 = 0

    for (let i = 0; i < n; i++) {
        const diff1 = series1[i] - mean1
        const diff2 = series2[i] - mean2
        numerator += diff1 * diff2
        denom1 += diff1 * diff1
        denom2 += diff2 * diff2
    }

    const denominator = Math.sqrt(denom1 * denom2)
    if (denominator === 0) return 0

    return numerator / denominator
}

/**
 * Calculate BTC correlation for a card's price history
 */
export async function getBTCCorrelation(cardPrices: number[]): Promise<number> {
    const btcHistory = await getBTCHistory(cardPrices.length)
    if (btcHistory.length === 0) return 0

    const btcPrices = btcHistory.slice(-cardPrices.length).map(h => h.price)
    return calculateCorrelation(cardPrices, btcPrices)
}

// ============================================
// AGGREGATED MACRO SCORE (for D5 dimension)
// ============================================

export type MacroScore = {
    btcData: BTCData
    fearGreed: FearGreedData
    indices: MarketIndices
    macroRiskScore: number // 0-100 (higher = more speculative environment)
}

export async function getMacroScore(): Promise<MacroScore> {
    const [btcData, fearGreed, indices] = await Promise.all([
        getBTCData(),
        getFearGreedIndex(),
        getMarketIndices()
    ])

    // Calculate macro risk score
    // Higher BTC gains + Greed = more speculative environment
    let riskScore = 0

    // BTC momentum contribution (0-30 points)
    if (btcData.change30d > 50) riskScore += 30
    else if (btcData.change30d > 20) riskScore += 20
    else if (btcData.change30d > 0) riskScore += 10
    else if (btcData.change30d < -20) riskScore -= 15

    // Fear & Greed contribution (0-40 points)
    if (fearGreed.value > 80) riskScore += 40 // Extreme Greed
    else if (fearGreed.value > 60) riskScore += 25 // Greed
    else if (fearGreed.value > 40) riskScore += 10 // Neutral
    else if (fearGreed.value < 20) riskScore -= 20 // Extreme Fear

    // VIX contribution (0-30 points) - low VIX = more risk taking
    if (indices.vix.price < 15) riskScore += 30 // Very low volatility
    else if (indices.vix.price < 20) riskScore += 15 // Normal
    else if (indices.vix.price > 30) riskScore -= 20 // High fear

    // Clamp to 0-100
    riskScore = Math.max(0, Math.min(100, riskScore))

    return {
        btcData,
        fearGreed,
        indices,
        macroRiskScore: riskScore
    }
}
