/**
 * Reddit Sentiment Service
 * Uses Reddit's public JSON endpoints (no API key required)
 * Monitors: r/PokeInvesting, r/PokemonTCG, r/pkmntcgcollections
 */

// Cache to avoid excessive requests
const cache = new Map<string, { data: unknown; expiry: number }>()
const CACHE_TTL = 1000 * 60 * 10 // 10 minutes

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = cache.get(key)
    if (cached && cached.expiry > Date.now()) {
        return cached.data as T
    }
    const data = await fetcher()
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL })
    return data
}

// Subreddits to monitor for Pokemon card sentiment
const SUBREDDITS = ['PokeInvesting', 'PokemonTCG', 'pkmntcgcollections']

export type RedditPost = {
    title: string
    selftext: string
    score: number
    numComments: number
    created: Date
    subreddit: string
    url: string
}

export type SentimentData = {
    cardName: string
    mentions: number
    sentimentScore: number // -1 to 1
    positiveCount: number
    negativeCount: number
    neutralCount: number
    trending: boolean
    recentPosts: RedditPost[]
}

// Simple sentiment analysis keywords
const POSITIVE_WORDS = [
    'buy', 'buying', 'bought', 'invest', 'investment', 'undervalued', 'gem', 'amazing',
    'beautiful', 'grail', 'love', 'great', 'awesome', 'fire', 'hold', 'holding',
    'moon', 'pump', 'gain', 'profit', 'rare', 'chase', 'hit', 'pull', 'excited',
    'slab', 'psa10', 'cgc10', 'bgs10', 'mint', 'perfect', 'centering'
]

const NEGATIVE_WORDS = [
    'sell', 'selling', 'sold', 'dump', 'crash', 'overpriced', 'bubble', 'scam',
    'fake', 'reprint', 'avoid', 'loss', 'losing', 'regret', 'drop', 'falling',
    'manipulation', 'manipulated', 'worthless', 'worried', 'concern', 'risky',
    'hype', 'fomo', 'overpay', 'overpaid', 'damaged', 'fake', 'counterfeit'
]

/**
 * Analyze sentiment of text (simple keyword-based)
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase()

    let positiveScore = 0
    let negativeScore = 0

    for (const word of POSITIVE_WORDS) {
        if (lowerText.includes(word)) positiveScore++
    }

    for (const word of NEGATIVE_WORDS) {
        if (lowerText.includes(word)) negativeScore++
    }

    if (positiveScore > negativeScore + 1) return 'positive'
    if (negativeScore > positiveScore + 1) return 'negative'
    return 'neutral'
}

/**
 * Fetch posts from a subreddit (uses public JSON endpoint - no API key needed)
 */
async function fetchSubredditPosts(subreddit: string, limit: number = 100): Promise<RedditPost[]> {
    try {
        const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`,
            {
                headers: {
                    'User-Agent': 'PokéValoris/1.0 (Card Investment Tracker)'
                }
            }
        )

        if (!response.ok) {
            console.error(`Reddit fetch error for ${subreddit}:`, response.status)
            return []
        }

        const data = await response.json()

        return data.data.children.map((child: {
            data: {
                title: string
                selftext: string
                score: number
                num_comments: number
                created_utc: number
                subreddit: string
                permalink: string
            }
        }) => ({
            title: child.data.title,
            selftext: child.data.selftext || '',
            score: child.data.score,
            numComments: child.data.num_comments,
            created: new Date(child.data.created_utc * 1000),
            subreddit: child.data.subreddit,
            url: `https://reddit.com${child.data.permalink}`
        }))
    } catch (error) {
        console.error(`Error fetching ${subreddit}:`, error)
        return []
    }
}

/**
 * Search for card mentions across Pokemon subreddits
 */
export async function getCardSentiment(cardName: string): Promise<SentimentData> {
    const cacheKey = `sentiment-${cardName.toLowerCase()}`

    return fetchWithCache(cacheKey, async () => {
        const allPosts: RedditPost[] = []

        // Fetch from all monitored subreddits
        for (const subreddit of SUBREDDITS) {
            const posts = await fetchSubredditPosts(subreddit, 50)
            allPosts.push(...posts)
            // Small delay to be nice to Reddit
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        // Filter posts mentioning the card
        const cardNameLower = cardName.toLowerCase()
        const matchingPosts = allPosts.filter(post =>
            post.title.toLowerCase().includes(cardNameLower) ||
            post.selftext.toLowerCase().includes(cardNameLower)
        )

        // Analyze sentiment of each post
        let positiveCount = 0
        let negativeCount = 0
        let neutralCount = 0

        for (const post of matchingPosts) {
            const sentiment = analyzeSentiment(post.title + ' ' + post.selftext)
            if (sentiment === 'positive') positiveCount++
            else if (sentiment === 'negative') negativeCount++
            else neutralCount++
        }

        const totalMentions = matchingPosts.length
        const sentimentScore = totalMentions > 0
            ? (positiveCount - negativeCount) / totalMentions
            : 0

        // Trending if 5+ mentions in recent posts
        const trending = matchingPosts.filter(p =>
            Date.now() - p.created.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
        ).length >= 5

        return {
            cardName,
            mentions: totalMentions,
            sentimentScore,
            positiveCount,
            negativeCount,
            neutralCount,
            trending,
            recentPosts: matchingPosts.slice(0, 5) // Top 5 recent
        }
    })
}

/**
 * Get overall Pokemon TCG market sentiment
 */
export async function getMarketSentiment(): Promise<{
    overall: number // -1 to 1
    bullishPosts: number
    bearishPosts: number
    hotTopics: string[]
}> {
    return fetchWithCache('market-sentiment', async () => {
        const allPosts: RedditPost[] = []

        for (const subreddit of SUBREDDITS) {
            const posts = await fetchSubredditPosts(subreddit, 100)
            allPosts.push(...posts)
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        let bullish = 0
        let bearish = 0

        // Analyze all posts for market sentiment
        for (const post of allPosts) {
            const sentiment = analyzeSentiment(post.title + ' ' + post.selftext)
            if (sentiment === 'positive') bullish++
            else if (sentiment === 'negative') bearish++
        }

        const total = allPosts.length
        const overall = total > 0 ? (bullish - bearish) / total : 0

        // Extract hot topics (most upvoted posts)
        const hotPosts = allPosts
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)

        const hotTopics = hotPosts.map(p => p.title.substring(0, 50))

        return {
            overall,
            bullishPosts: bullish,
            bearishPosts: bearish,
            hotTopics
        }
    })
}

/**
 * Calculate sentiment score contribution for D4 dimension
 */
export async function getSentimentScore(cardName: string): Promise<{
    d4Score: number // 0-100
    details: SentimentData
}> {
    const sentiment = await getCardSentiment(cardName)

    let d4Score = 50 // Base neutral

    // Mentions volume (0-25 points)
    if (sentiment.mentions > 20) d4Score += 25
    else if (sentiment.mentions > 10) d4Score += 15
    else if (sentiment.mentions > 5) d4Score += 10

    // Sentiment polarity (0-35 points for extreme bullish = speculative)
    if (sentiment.sentimentScore > 0.7) d4Score += 35 // Extreme bullish = FOMO
    else if (sentiment.sentimentScore > 0.4) d4Score += 20
    else if (sentiment.sentimentScore < -0.4) d4Score -= 15 // Bearish = less speculation
    else if (sentiment.sentimentScore < -0.7) d4Score -= 25

    // Trending bonus (0-15 points)
    if (sentiment.trending) d4Score += 15

    // Clamp to 0-100
    d4Score = Math.max(0, Math.min(100, d4Score))

    return {
        d4Score,
        details: sentiment
    }
}
