'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Loader2,
    Shield,
    Zap,
    Target,
    Brain,
    Globe
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { getScoreColor } from '@/lib/utils'
import {
    INVESTABLE_CARDS,
    getCardsByTier,
    getVintageCards,
    getModernCards,
    searchInvestableCards,
    getCardStats,
    type InvestableCard
} from '@/lib/data/investableCards'
import { calculateQuickScore, type PricePoint } from '@/lib/scoring/speculationScore'
import { getMacroScore } from '@/lib/data/macro'

// Generate mock price history for scoring (would be from DB in production)
function generatePriceHistory(card: InvestableCard): PricePoint[] {
    const history: PricePoint[] = []
    let price = card.estimatedValue

    for (let i = 90; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        // Vintage cards: more stable
        // Modern cards: more volatile
        const volatility = card.isVintage ? 0.02 : 0.05
        price = price * (1 + (Math.random() - 0.48) * volatility)

        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price * 100) / 100
        })
    }

    return history
}

// Pre-calculate scores for all cards
function calculateCardScores(cards: InvestableCard[]): (InvestableCard & { score: number })[] {
    return cards.map(card => {
        const priceHistory = generatePriceHistory(card)
        const score = calculateQuickScore(
            priceHistory,
            card.populationPsa10 || 5000,
            card.isVintage
        )
        return { ...card, score }
    }).sort((a, b) => a.score - b.score) // Sort by score (lowest = best investment)
}

export default function AnalysisPage() {
    const { t } = useI18n()
    const [isLoading, setIsLoading] = useState(true)
    const [cards, setCards] = useState<(InvestableCard & { score: number })[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'vintage' | 'modern' | 'S' | 'A' | 'B' | 'C'>('all')
    const [sortBy, setSortBy] = useState<'score' | 'value' | 'name'>('score')
    const [macroData, setMacroData] = useState<{
        fearGreed: number
        btcChange: number
        macroRisk: number
    } | null>(null)

    // Load cards and macro data
    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            // Calculate scores for all investable cards
            const scoredCards = calculateCardScores(INVESTABLE_CARDS)
            setCards(scoredCards)

            // Get macro data
            const macro = await getMacroScore()
            setMacroData({
                fearGreed: macro.fearGreed.value,
                btcChange: macro.btcData.change30d,
                macroRisk: macro.macroRiskScore
            })
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Filter and sort cards
    const filteredCards = cards.filter(card => {
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            if (!card.name.toLowerCase().includes(q) && !card.set.toLowerCase().includes(q)) {
                return false
            }
        }

        // Category filter
        switch (filter) {
            case 'vintage': return card.isVintage
            case 'modern': return !card.isVintage
            case 'S': case 'A': case 'B': case 'C': return card.tier === filter
            default: return true
        }
    }).sort((a, b) => {
        switch (sortBy) {
            case 'value': return b.estimatedValue - a.estimatedValue
            case 'name': return a.name.localeCompare(b.name)
            default: return a.score - b.score
        }
    })

    // Stats
    const stats = getCardStats()
    const avgScore = cards.length > 0
        ? Math.round(cards.reduce((sum, c) => sum + c.score, 0) / cards.length)
        : 0
    const bestInvestments = cards.filter(c => c.score < 30).length
    const speculative = cards.filter(c => c.score > 60).length

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analyse de Marché</h1>
                    <p className="text-white/50 mt-1">Score de spéculation 5D pour {stats.total} cartes</p>
                </div>
                <div className="flex items-center gap-4">
                    {macroData && (
                        <div className="flex gap-3">
                            <div className="px-3 py-2 glass rounded-xl text-center">
                                <p className="text-xs text-white/50">Fear & Greed</p>
                                <p className={`font-bold ${macroData.fearGreed > 60 ? 'text-red-400' : macroData.fearGreed < 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {macroData.fearGreed}
                                </p>
                            </div>
                            <div className="px-3 py-2 glass rounded-xl text-center">
                                <p className="text-xs text-white/50">BTC 30j</p>
                                <p className={`font-bold ${macroData.btcChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {macroData.btcChange > 0 ? '+' : ''}{macroData.btcChange.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/20">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Cartes Analysées</p>
                            <p className="text-xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20">
                            <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Investissements Solides</p>
                            <p className="text-xl font-bold text-emerald-400">{bestInvestments}</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/20">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Spéculatives</p>
                            <p className="text-xl font-bold text-red-400">{speculative}</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20">
                            <Target className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Score Moyen</p>
                            <p className="text-xl font-bold text-white">{avgScore}/100</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/20">
                            <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Risque Macro</p>
                            <p className={`text-xl font-bold ${(macroData?.macroRisk || 50) > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {macroData?.macroRisk || 50}/100
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dimension Legend */}
            <div className="glass rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white/70 mb-3">Score 5D - Dimensions Analysées</h3>
                <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-xs text-white/60">D1: Volatilité</span>
                        <span className="text-xs text-white/40">25%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-xs text-white/60">D2: Croissance</span>
                        <span className="text-xs text-white/40">25%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Shield className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-xs text-white/60">D3: Scarcité</span>
                        <span className="text-xs text-white/40">20%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-lg bg-pink-500/20">
                            <Brain className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="text-xs text-white/60">D4: Sentiment</span>
                        <span className="text-xs text-white/40">15%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                            <Globe className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-xs text-white/60">D5: Macro</span>
                        <span className="text-xs text-white/40">15%</span>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Rechercher une carte..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>

                <div className="flex gap-2">
                    {/* Filter buttons */}
                    {(['all', 'vintage', 'modern', 'S', 'A', 'B'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === f
                                    ? 'bg-white text-black'
                                    : 'glass text-white/70 hover:text-white'
                                }`}
                        >
                            {f === 'all' ? 'Toutes' :
                                f === 'vintage' ? 'Vintage' :
                                    f === 'modern' ? 'Moderne' :
                                        `Tier ${f}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Score Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-white/60">0-30: Investissement</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-white/60">30-60: Modéré</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-white/60">60+: Spéculatif</span>
                </div>
            </div>

            {/* Cards Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-4 text-white/50 font-medium">Rang</th>
                            <th className="text-left py-4 px-4 text-white/50 font-medium">Carte</th>
                            <th className="text-left py-4 px-4 text-white/50 font-medium">Set</th>
                            <th className="text-center py-4 px-4 text-white/50 font-medium">Tier</th>
                            <th className="text-center py-4 px-4 text-white/50 font-medium">Type</th>
                            <th className="text-right py-4 px-4 text-white/50 font-medium">Valeur</th>
                            <th className="text-center py-4 px-4 text-white/50 font-medium">PSA 10</th>
                            <th className="text-center py-4 px-4 text-white/50 font-medium">Score</th>
                            <th className="text-center py-4 px-4 text-white/50 font-medium">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCards.map((card, index) => {
                            const scoreColors = getScoreColor(card.score)
                            const statusLabel = card.score < 30 ? 'ACHETER' :
                                card.score < 50 ? 'SURVEILLER' :
                                    card.score < 70 ? 'PRUDENCE' : 'ÉVITER'
                            const statusColor = card.score < 30 ? 'text-emerald-400 bg-emerald-500/20' :
                                card.score < 50 ? 'text-amber-400 bg-amber-500/20' :
                                    card.score < 70 ? 'text-orange-400 bg-orange-500/20' :
                                        'text-red-400 bg-red-500/20'

                            return (
                                <tr key={card.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4">
                                        <span className="text-white/40 font-mono">#{index + 1}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="font-medium text-white">{card.name}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-white/60">{card.set}</span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${card.tier === 'S' ? 'text-yellow-400 bg-yellow-500/20' :
                                                card.tier === 'A' ? 'text-purple-400 bg-purple-500/20' :
                                                    card.tier === 'B' ? 'text-blue-400 bg-blue-500/20' :
                                                        'text-gray-400 bg-gray-500/20'
                                            }`}>
                                            {card.tier}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs ${card.isVintage ? 'text-amber-400 bg-amber-500/20' : 'text-cyan-400 bg-cyan-500/20'
                                            }`}>
                                            {card.isVintage ? 'Vintage' : 'Moderne'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="font-bold text-white">${card.estimatedValue.toLocaleString()}</span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="text-white/60">{card.populationPsa10?.toLocaleString() || 'N/A'}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex justify-center">
                                            <ScoreGauge score={card.score} size="sm" />
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {filteredCards.length === 0 && (
                    <div className="py-12 text-center text-white/50">
                        Aucune carte trouvée
                    </div>
                )}
            </div>
        </div>
    )
}
