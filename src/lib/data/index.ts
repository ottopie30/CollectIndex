/**
 * Data Services Index
 * Central export for all data sources
 */

// Macro Economic Data
export {
    getBTCData,
    getBTCHistory,
    getFearGreedIndex,
    getMarketIndices,
    getMacroScore,
    calculateCorrelation,
    getBTCCorrelation,
    type BTCData,
    type FearGreedData,
    type MarketIndices,
    type MacroScore
} from './macro'

// Reddit Sentiment
export {
    getCardSentiment,
    getMarketSentiment,
    getSentimentScore,
    type RedditPost,
    type SentimentData
} from './sentiment'

// PSA Population
export {
    getPSAPopulation,
    getScarcityScore,
    analyzeSupplyDemand,
    type PSAPopulation,
    type ScarcityScore
} from './psa'
