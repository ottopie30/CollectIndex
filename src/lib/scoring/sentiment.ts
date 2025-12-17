/**
 * DIMENSION 4: SENTIMENT SCORING (Poids: 15%)
 * 
 * Based on the cahier des charges specifications:
 * - Métrique 4.1: Social Media Buzz Score
 * - Métrique 4.2: Buyer/Seller Ratio
 * - Métrique 4.3: Hype Index (search trends, mentions)
 */

/**
 * Calculate social media buzz score
 * 
 * Based on weighted mentions across platforms:
 * - Reddit: 1x weight
 * - Twitter/X: 1.2x weight  
 * - YouTube: 1.5x weight (creators influence)
 * - Discord: 0.8x weight
 * 
 * Score thresholds:
 * - < 10 mentions/week = 10 points
 * - 10-50 = 25 points
 * - 50-200 = 50 points
 * - 200-1000 = 75 points
 * - > 1000 = 100 points (viral)
 */
export function getSocialBuzzScore(
    redditMentions: number = 0,
    twitterMentions: number = 0,
    youtubeMentions: number = 0,
    discordMentions: number = 0
): number {
    const weightedMentions =
        redditMentions * 1.0 +
        twitterMentions * 1.2 +
        youtubeMentions * 1.5 +
        discordMentions * 0.8

    if (weightedMentions < 10) return 10
    if (weightedMentions < 50) return 25
    if (weightedMentions < 200) return 50
    if (weightedMentions < 1000) return 75
    return 100
}

/**
 * Calculate buyer/seller ratio score
 * 
 * High ratio (more buyers than sellers) = speculative pressure
 * 
 * Thresholds:
 * - Ratio < 0.5 = 10 points (sellers market)
 * - Ratio 0.5-1.0 = 30 points (balanced)
 * - Ratio 1.0-2.0 = 50 points (slight buyer pressure)
 * - Ratio 2.0-5.0 = 75 points (strong buyer pressure)
 * - Ratio > 5.0 = 100 points (FOMO territory)
 */
export function getBuyerSellerRatioScore(
    buyOrders: number,
    sellOrders: number
): number {
    if (sellOrders === 0) {
        return buyOrders > 0 ? 100 : 50
    }

    const ratio = buyOrders / sellOrders

    if (ratio < 0.5) return 10
    if (ratio < 1.0) return 30
    if (ratio < 2.0) return 50
    if (ratio < 5.0) return 75
    return 100
}

/**
 * Calculate hype index based on search trends
 * 
 * Simulates Google Trends / YouTube search volume
 * 
 * Score based on weekly change:
 * - Declining (< -20%) = 10 points
 * - Stable (-20% to +20%) = 30 points
 * - Growing (+20% to +100%) = 60 points
 * - Explosive (+100% to +300%) = 85 points
 * - Viral (> +300%) = 100 points
 */
export function getHypeIndexScore(searchVolumeChange: number): number {
    if (searchVolumeChange < -20) return 10
    if (searchVolumeChange < 20) return 30
    if (searchVolumeChange < 100) return 60
    if (searchVolumeChange < 300) return 85
    return 100
}

/**
 * Estimate Pokemon popularity based on name
 * Some Pokemon are inherently more hyped
 */
export function getInherentPopularityBonus(pokemonName: string): number {
    const name = pokemonName.toLowerCase()

    // Tier 1: Most popular (~30 bonus)
    const tier1 = ['charizard', 'pikachu', 'mewtwo', 'mew', 'gengar', 'umbreon', 'rayquaza']
    if (tier1.some(p => name.includes(p))) return 30

    // Tier 2: Very popular (~20 bonus)
    const tier2 = ['eevee', 'dragonite', 'blastoise', 'venusaur', 'lugia', 'ho-oh', 'garchomp', 'lucario']
    if (tier2.some(p => name.includes(p))) return 20

    // Tier 3: Popular (~10 bonus)
    const tier3 = ['gyarados', 'arcanine', 'lapras', 'snorlax', 'espeon', 'tyranitar', 'salamence']
    if (tier3.some(p => name.includes(p))) return 10

    return 0
}

/**
 * Detect if card benefits from influencer hype
 * Certain card types get influencer attention
 */
export function getInfluencerHypeScore(
    rarity: string | null,
    isGraded: boolean = false,
    gradedScore: number = 0
): number {
    let score = 0

    // High-end rarities attract YouTubers
    const hypeRarities = ['secret', 'rainbow', 'ultra', 'special art', 'illustration rare']
    if (rarity && hypeRarities.some(r => rarity.toLowerCase().includes(r))) {
        score += 30
    }

    // Graded cards (especially high grades) get content
    if (isGraded) {
        score += 20
        if (gradedScore >= 10) score += 20 // PSA 10 / BGS 10
        else if (gradedScore >= 9) score += 10 // PSA 9 / BGS 9.5
    }

    return Math.min(50, score)
}

/**
 * Calculate complete D4 Sentiment Score
 * D4_Score = 0.3 × Social + 0.25 × BuyerSeller + 0.25 × Hype + 0.2 × (Popularity + Influencer)
 */
export function calculateD4Score(
    socialMentions: { reddit?: number; twitter?: number; youtube?: number; discord?: number } = {},
    buyOrders: number = 1,
    sellOrders: number = 1,
    searchVolumeChange: number = 0,
    pokemonName: string = '',
    rarity: string | null = null,
    isGraded: boolean = false,
    gradedScore: number = 0
): {
    socialBuzzScore: number
    buyerSellerScore: number
    hypeIndexScore: number
    popularityBonus: number
    influencerScore: number
    d4Total: number
} {
    const socialBuzzScore = getSocialBuzzScore(
        socialMentions.reddit || 0,
        socialMentions.twitter || 0,
        socialMentions.youtube || 0,
        socialMentions.discord || 0
    )

    const buyerSellerScore = getBuyerSellerRatioScore(buyOrders, sellOrders)
    const hypeIndexScore = getHypeIndexScore(searchVolumeChange)
    const popularityBonus = getInherentPopularityBonus(pokemonName)
    const influencerScore = getInfluencerHypeScore(rarity, isGraded, gradedScore)

    // Combined popularity/influencer (capped at 100)
    const combinedPopularity = Math.min(100, 30 + popularityBonus + influencerScore)

    // Weighted average
    const d4Total = Math.round(
        0.3 * socialBuzzScore +
        0.25 * buyerSellerScore +
        0.25 * hypeIndexScore +
        0.2 * combinedPopularity
    )

    return {
        socialBuzzScore,
        buyerSellerScore,
        hypeIndexScore,
        popularityBonus,
        influencerScore,
        d4Total
    }
}
