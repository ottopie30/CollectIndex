/**
 * DIMENSION 3: SCARCITY SCORING (Poids: 20%)
 * 
 * Based on the cahier des charges specifications:
 * - Métrique 3.1: Rarity Ratio (rareté vs print run)
 * - Métrique 3.2: PSA Population (graded scarcity)
 * - Métrique 3.3: Supply/Demand Dynamics
 */

// Rarity multipliers based on Pokemon TCG rarity types
const RARITY_SCORES: Record<string, number> = {
    'Common': 5,
    'Uncommon': 10,
    'Rare': 25,
    'Rare Holo': 40,
    'Rare Holo V': 50,
    'Rare Holo VMAX': 55,
    'Rare Holo VSTAR': 55,
    'Rare Ultra': 60,
    'Rare Rainbow': 70,
    'Rare Secret': 75,
    'Rare Shiny': 65,
    'Amazing Rare': 55,
    'Radiant Rare': 60,
    'Illustration Rare': 65,
    'Special Art Rare': 70,
    'Ultra Rare': 68,
    'Hyper Rare': 75,
    'Shiny Rare': 65,
    'Double Rare': 55,
    'Art Rare': 70,
    'Trainer Gallery Rare': 50,
    // Default for unknown
    'Unknown': 30
}

/**
 * Get rarity score based on card rarity string
 * 
 * Score: 0-100 based on rarity
 * Higher rarity = higher scarcity score
 */
export function getRarityScore(rarity: string | null | undefined): number {
    if (!rarity) return RARITY_SCORES['Unknown']

    // Try exact match first
    if (rarity in RARITY_SCORES) {
        return RARITY_SCORES[rarity]
    }

    // Try partial match
    const lowerRarity = rarity.toLowerCase()

    if (lowerRarity.includes('star') && !lowerRarity.includes('vstar')) return 90 // Gold Star
    if (lowerRarity.includes('shining')) return 85
    if (lowerRarity.includes(' ex') || lowerRarity.endsWith(' ex')) return 80 // Old school EX
    if (lowerRarity.includes('secret') || lowerRarity.includes('hyper')) return 75
    if (lowerRarity.includes('rainbow')) return 70
    if (lowerRarity.includes('ultra') || lowerRarity.includes('special art')) return 68
    if (lowerRarity.includes('illustration')) return 65
    if (lowerRarity.includes('shiny') || lowerRarity.includes('radiant')) return 60
    if (lowerRarity.includes('vmax') || lowerRarity.includes('vstar')) return 55
    if (lowerRarity.includes('holo v')) return 50
    if (lowerRarity.includes('holo')) return 40
    if (lowerRarity.includes('rare')) return 25
    if (lowerRarity.includes('uncommon')) return 10
    if (lowerRarity.includes('common')) return 5

    return RARITY_SCORES['Unknown']
}

/**
 * Calculate PSA population scarcity
 * 
 * Based on graded population:
 * - Pop < 100 = 100 points (extremely rare)
 * - Pop 100-500 = 80 points
 * - Pop 500-1000 = 60 points
 * - Pop 1000-5000 = 40 points
 * - Pop 5000-10000 = 20 points
 * - Pop > 10000 = 10 points
 */
export function getPSAPopulationScore(population: number | null | undefined): number {
    if (population === null || population === undefined) return 50 // Default moderate if unknown

    if (population < 100) return 100
    if (population < 500) return 80
    if (population < 1000) return 60
    if (population < 5000) return 40
    if (population < 10000) return 20
    return 10
}

/**
 * Calculate supply/demand score based on listing activity
 * 
 * Metrics:
 * - High demand (many sold, few active) = high score
 * - Low demand (few sold, many active) = low score
 */
export function getSupplyDemandScore(
    soldListings30d: number,
    activeListings: number
): number {
    if (activeListings === 0) {
        // No supply = extremely rare
        return soldListings30d > 0 ? 100 : 50
    }

    const ratio = soldListings30d / activeListings

    // High demand ratio means high scarcity pressure
    if (ratio > 5) return 90  // 5x more sold than available
    if (ratio > 3) return 75
    if (ratio > 1.5) return 60
    if (ratio > 0.5) return 40
    if (ratio > 0.2) return 25
    return 30 // Low demand/liquidity (floored at 30 for vintage items)
}

/**
 * Calculate vintage bonus based on set year
 * Older sets get scarcity bonus due to natural attrition
 */
export function getVintageBonus(setYear: number | null): number {
    if (!setYear) return 0

    const currentYear = new Date().getFullYear()
    const age = currentYear - setYear

    if (age >= 25) return 30  // WOTC era (1999-1999)
    if (age >= 20) return 25  // Early 2000s
    if (age >= 15) return 20  // 2005-2009
    if (age >= 10) return 15  // 2010-2014
    if (age >= 5) return 10   // 2015-2019
    return 0                   // Modern (2020+)
}

/**
 * Estimate set year from set ID or name
 */
export function estimateSetYear(setId: string): number | null {
    // Modern sets
    if (setId.startsWith('sv')) return 2023  // Scarlet & Violet
    if (setId.startsWith('swsh')) return 2020 // Sword & Shield
    if (setId.startsWith('sm')) return 2017  // Sun & Moon
    if (setId.startsWith('xy')) return 2014  // XY
    if (setId.startsWith('bw')) return 2011  // Black & White
    if (setId.startsWith('hgss')) return 2010 // HeartGold SoulSilver
    if (setId.startsWith('pl')) return 2009  // Platinum
    if (setId.startsWith('dp')) return 2007  // Diamond & Pearl
    if (setId.startsWith('ex')) return 2003  // EX Series

    // WOTC sets
    if (setId === 'base1') return 1999
    if (setId === 'base2') return 1999
    if (setId === 'base3') return 1999
    if (setId === 'base4') return 2000
    if (setId === 'base5') return 2000
    if (setId === 'base6') return 2001
    if (setId.startsWith('neo')) return 2000
    if (setId.startsWith('gym')) return 2000

    // Celebrations, special sets
    if (setId === 'cel25') return 2021

    return null
}

/**
 * Calculate complete D3 Scarcity Score
 * D3_Score = 0.4 × Rarity + 0.2 × PSA_Pop + 0.2 × Supply_Demand + 0.2 × Vintage
 */
export function calculateD3Score(
    rarity: string | null | undefined,
    psaPopulation: number | null | undefined = null,
    soldListings30d: number = 0,
    activeListings: number = 1,
    setId: string = '',
    cardName: string = ''
): {
    rarityScore: number
    psaPopScore: number
    supplyDemandScore: number
    vintageBonus: number
    d3Total: number
} {
    let rarityScore = getRarityScore(rarity)

    // Override rarity based on name (metadata fallback)
    const lowerName = cardName.toLowerCase()
    if (lowerName.endsWith(' ex') || lowerName.includes(' ex ')) rarityScore = Math.max(rarityScore, 85)
    if (lowerName.includes('gold star') || lowerName.includes('☆')) rarityScore = Math.max(rarityScore, 95)
    if (lowerName.startsWith('shining ')) rarityScore = Math.max(rarityScore, 90)
    if (lowerName.includes('lv.x')) rarityScore = Math.max(rarityScore, 80)

    const psaPopScore = getPSAPopulationScore(psaPopulation)
    const supplyDemandScore = getSupplyDemandScore(soldListings30d, activeListings)

    const setYear = estimateSetYear(setId)
    const vintageBonus = getVintageBonus(setYear)

    // Weighted average
    const d3Total = Math.min(100, Math.round(
        0.4 * rarityScore +
        0.2 * psaPopScore +
        0.2 * supplyDemandScore +
        0.2 * (50 + vintageBonus) // Base 50 + vintage bonus
    ))

    return {
        rarityScore,
        psaPopScore,
        supplyDemandScore,
        vintageBonus,
        d3Total
    }
}
