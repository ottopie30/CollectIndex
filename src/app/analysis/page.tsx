'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Search,
    Plus,
    X,
    Loader2,
    Shield,
    Zap,
    Target,
    Brain,
    Globe,
    Trash2
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { getScoreColor } from '@/lib/utils'
import { searchCards, getCardImageUrl, TCGdexCard } from '@/lib/tcgdex'
import { calculateQuickScore, type PricePoint } from '@/lib/scoring/speculationScore'
import { getMacroScore } from '@/lib/data/macro'

// Type for analyzed card
type AnalyzedCard = {
    id: string
    tcgdexId: string
    name: string
    setName: string
    rarity: string | null
    imageUrl: string
    isVintage: boolean
    score: number
    estimatedValue: number
    addedAt: Date
}

// Generate price history for scoring
function generatePriceHistory(baseValue: number, isVintage: boolean): PricePoint[] {
    const history: PricePoint[] = []
    let price = baseValue

    for (let i = 90; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const volatility = isVintage ? 0.02 : 0.05
        price = price * (1 + (Math.random() - 0.48) * volatility)
        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price * 100) / 100
        })
    }

    return history
}

// Estimate value based on rarity
function estimateValue(rarity: string | undefined, isVintage: boolean): number {
    const baseValues: Record<string, number> = {
        'Common': 1,
        'Uncommon': 3,
        'Rare': 15,
        'Rare Holo': 50,
        'Ultra Rare': 100,
        'Secret Rare': 150,
        'Illustration Rare': 80,
        'Special Art Rare': 120,
        'Shiny Rare': 60,
    }

    const base = baseValues[rarity || 'Rare'] || 20
    return isVintage ? base * 5 : base
}

// Check if card is vintage
function checkVintage(setId: string): boolean {
    const vintagePatterns = ['base', 'jungle', 'fossil', 'neo', 'gym', 'legendary', 'expedition', 'aquapolis', 'skyridge', 'ex']
    return vintagePatterns.some(p => setId.toLowerCase().includes(p))
}

export default function AnalysisPage() {
    const { t } = useI18n()
    const [analyzedCards, setAnalyzedCards] = useState<AnalyzedCard[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<TCGdexCard[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [macroData, setMacroData] = useState<{
        fearGreed: number
        btcChange: number
        macroRisk: number
    } | null>(null)

    // Load macro data on mount
    useEffect(() => {
        const loadMacro = async () => {
            try {
                const macro = await getMacroScore()
                setMacroData({
                    fearGreed: macro.fearGreed.value,
                    btcChange: macro.btcData.change30d,
                    macroRisk: macro.macroRiskScore
                })
            } catch (error) {
                console.error('Error loading macro:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadMacro()

        // Load saved cards from localStorage
        const saved = localStorage.getItem('analyzedCards')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setAnalyzedCards(parsed.map((c: AnalyzedCard) => ({
                    ...c,
                    addedAt: new Date(c.addedAt)
                })))
            } catch (e) {
                console.error('Error parsing saved cards:', e)
            }
        }
    }, [])

    // Save cards to localStorage
    useEffect(() => {
        if (analyzedCards.length > 0) {
            localStorage.setItem('analyzedCards', JSON.stringify(analyzedCards))
        }
    }, [analyzedCards])

    // Search cards
    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setIsSearching(true)
        try {
            const results = await searchCards(searchQuery)
            setSearchResults(results.slice(0, 20))
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    // Handle search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    // Add card to analysis
    const addCardToAnalysis = (card: TCGdexCard) => {
        // Check if already added
        if (analyzedCards.some(c => c.tcgdexId === card.id)) {
            alert('Cette carte est déjà dans votre analyse')
            return
        }

        const isVintage = checkVintage(card.set?.id || '')
        const estimatedValue = estimateValue(card.rarity, isVintage)
        const priceHistory = generatePriceHistory(estimatedValue, isVintage)
        const score = calculateQuickScore(priceHistory, 5000, isVintage)

        const analyzedCard: AnalyzedCard = {
            id: Date.now().toString(),
            tcgdexId: card.id,
            name: card.name,
            setName: card.set?.name || 'Unknown',
            rarity: card.rarity || null,
            imageUrl: getCardImageUrl(card, 'high'),
            isVintage,
            score,
            estimatedValue,
            addedAt: new Date()
        }

        setAnalyzedCards(prev => [...prev, analyzedCard].sort((a, b) => a.score - b.score))
        setShowSearchModal(false)
        setSearchQuery('')
        setSearchResults([])
    }

    // Remove card from analysis
    const removeCard = (id: string) => {
        setAnalyzedCards(prev => prev.filter(c => c.id !== id))
        // Update localStorage
        const updated = analyzedCards.filter(c => c.id !== id)
        if (updated.length === 0) {
            localStorage.removeItem('analyzedCards')
        } else {
            localStorage.setItem('analyzedCards', JSON.stringify(updated))
        }
    }

    // Stats
    const avgScore = analyzedCards.length > 0
        ? Math.round(analyzedCards.reduce((sum, c) => sum + c.score, 0) / analyzedCards.length)
        : 0
    const bestInvestments = analyzedCards.filter(c => c.score < 30).length
    const speculative = analyzedCards.filter(c => c.score > 60).length

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
                    <p className="text-white/50 mt-1">Score de spéculation 5D - Ajoutez des cartes à analyser</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter une carte
                    </button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/20">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Cartes Analysées</p>
                            <p className="text-xl font-bold text-white">{analyzedCards.length}</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20">
                            <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">Investissements</p>
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
                            <p className="text-xl font-bold text-white">{avgScore || '-'}/100</p>
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

            {/* Cards Grid */}
            {analyzedCards.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Aucune carte analysée</h3>
                    <p className="text-white/50 mb-6">Ajoutez des cartes pour voir leur score de spéculation</p>
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter une carte
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {analyzedCards.map((card, index) => {
                        const statusLabel = card.score < 30 ? 'ACHETER' :
                            card.score < 50 ? 'SURVEILLER' :
                                card.score < 70 ? 'PRUDENCE' : 'ÉVITER'
                        const statusColor = card.score < 30 ? 'text-emerald-400 bg-emerald-500/20' :
                            card.score < 50 ? 'text-amber-400 bg-amber-500/20' :
                                card.score < 70 ? 'text-orange-400 bg-orange-500/20' :
                                    'text-red-400 bg-red-500/20'

                        return (
                            <div key={card.id} className="glass rounded-2xl overflow-hidden group">
                                {/* Card Image */}
                                <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                    <Image
                                        src={card.imageUrl}
                                        alt={card.name}
                                        fill
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                    {/* Rank Badge */}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-xs font-bold text-white">
                                        #{index + 1}
                                    </div>
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeCard(card.id)}
                                        className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    >
                                        <Trash2 className="w-4 h-4 text-white" />
                                    </button>
                                    {/* Score Overlay */}
                                    <div className="absolute bottom-2 right-2">
                                        <ScoreGauge score={card.score} size="md" />
                                    </div>
                                </div>

                                {/* Card Info */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold text-white truncate">{card.name}</h3>
                                        <p className="text-sm text-white/50 truncate">{card.setName}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-xs ${card.isVintage ? 'text-amber-400 bg-amber-500/20' : 'text-cyan-400 bg-cyan-500/20'
                                            }`}>
                                            {card.isVintage ? 'Vintage' : 'Moderne'}
                                        </span>
                                        <span className="text-sm text-white/60">{card.rarity || 'N/A'}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                        <span className="font-bold text-white">~${card.estimatedValue}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Search Modal */}
            {showSearchModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Rechercher une carte</h2>
                            <button
                                onClick={() => {
                                    setShowSearchModal(false)
                                    setSearchQuery('')
                                    setSearchResults([])
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Nom de la carte (ex: Charizard, Pikachu VMAX...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechercher'}
                                </button>
                            </div>
                        </div>

                        {/* Search Results */}
                        <div className="overflow-y-auto max-h-[50vh] p-4 pt-0">
                            {isSearching ? (
                                <div className="py-8 text-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {searchResults.map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => addCardToAnalysis(card)}
                                            className="glass rounded-xl p-2 text-left hover:bg-white/10 transition-colors group"
                                        >
                                            <div className="aspect-[3/4] relative mb-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg overflow-hidden">
                                                <Image
                                                    src={getCardImageUrl(card, 'high')}
                                                    alt={card.name}
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 transition-colors flex items-center justify-center">
                                                    <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                            <p className="font-medium text-white text-sm truncate">{card.name}</p>
                                            <p className="text-xs text-white/50 truncate">{card.set?.name}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery && !isSearching ? (
                                <div className="py-8 text-center text-white/50">
                                    Aucun résultat pour "{searchQuery}"
                                </div>
                            ) : (
                                <div className="py-8 text-center text-white/50">
                                    Tapez le nom d'une carte pour commencer
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
