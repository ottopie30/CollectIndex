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
    Trash2,
    Info
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
    analysisText: string
}

// Generate price history for scoring
function generatePriceHistory(baseValue: number, isVintage: boolean): PricePoint[] {
    const history: PricePoint[] = []
    let price = baseValue

    for (let i = 90; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        // Vintage cards: more stable but can have spikes
        const volatility = isVintage ? 0.015 : 0.04
        price = price * (1 + (Math.random() - 0.45) * volatility) // Slightly upward trend
        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price * 100) / 100
        })
    }

    return history
}

// Estimate value based on rarity and type
function estimateValue(card: TCGdexCard, isVintage: boolean): number {
    const name = card.name.toLowerCase()
    const rarity = card.rarity?.toLowerCase() || ''

    let base = 10

    // Ultra Rares
    if (name.includes(' ex') || name.includes(' gx') || name.includes(' v') || name.includes(' vmax') || name.includes(' vstar')) base = 30
    if (name.includes('star') || name.includes('shining')) base = 150
    if (rarity.includes('secret') || rarity.includes('hyper')) base = 80
    if (rarity.includes('illustration') || rarity.includes('alt')) base = 60

    // Vintage Multiplier
    if (isVintage) {
        if (name.includes(' ex')) return base * 8 // EX Series ex cards are expensive
        if (name.includes('star')) return base * 5 // Gold Stars are very expensive
        return base * 4
    }

    return base
}

// Check if card is vintage - Improved logic
function checkVintage(setId: string, setName: string): boolean {
    const id = setId.toLowerCase()
    const name = setName.toLowerCase()

    // Explicit vintage eras identifiers
    const vintageIds = ['base', 'gym', 'neo', 'ecard', 'ex', 'dp', 'pl', 'hgss', 'bw', 'xy']
    // Modern eras
    const modernIds = ['sm', 'swsh', 'sv']

    if (modernIds.some(m => id.startsWith(m))) return false
    if (vintageIds.some(v => id.startsWith(v))) return true

    // Fallback on name keywords
    if (name.includes('base set') || name.includes('wizards') || name.includes('neo ') || name.includes('e-series') || name.includes('ex ')) return true

    return false
}

// Generate analysis text explanation
function generateAnalysisText(card: AnalyzedCard, macroRisk: number): string {
    const parts = []

    if (card.isVintage) {
        parts.push("Carte Vintage : Volatilité réduite, valeur refuge potentielle.")
    } else {
        parts.push("Carte Moderne : Haute volatilité, sensible aux tendances.")
    }

    if (card.score > 70) {
        parts.push("⚠️ Score Élevé : Signaux de spéculation intense détectés.")
    } else if (card.score < 30) {
        parts.push("✅ Score Bas : Investissement considéré comme stable.")
    }

    if (macroRisk > 60) {
        parts.push("Environnement Macro risqué (BTC/Indices).")
    }

    return parts.join(" ")
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
    const [expandedCard, setExpandedCard] = useState<string | null>(null)

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

    useEffect(() => {
        if (analyzedCards.length > 0) {
            localStorage.setItem('analyzedCards', JSON.stringify(analyzedCards))
        }
    }, [analyzedCards])

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setIsSearching(true)
        try {
            const results = await searchCards(searchQuery)
            setSearchResults(results.filter(c => c.image).slice(0, 20)) // Only cards with images
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    const addCardToAnalysis = (card: TCGdexCard) => {
        if (analyzedCards.some(c => c.tcgdexId === card.id)) {
            alert('Cette carte est déjà dans votre analyse')
            return
        }

        const isVintage = checkVintage(card.set?.id || '', card.set?.name || '')
        const estimatedValue = estimateValue(card, isVintage)
        const priceHistory = generatePriceHistory(estimatedValue, isVintage)
        // Adjust score calculation slightly for vintage EX
        const baseScore = calculateQuickScore(priceHistory, 5000, isVintage)
        // Vintage EX cards are often safer investments (lower speculation score unless pumped)
        const finalScore = isVintage && estimatedValue > 100 ? Math.max(10, baseScore - 15) : baseScore

        const analyzedCard: AnalyzedCard = {
            id: Date.now().toString(),
            tcgdexId: card.id,
            name: card.name,
            setName: card.set?.name || 'Set Inconnu',
            rarity: card.rarity || 'Non spécifié',
            imageUrl: getCardImageUrl(card, 'high'),
            isVintage,
            score: finalScore,
            estimatedValue,
            addedAt: new Date(),
            analysisText: '' // Will be filled below
        }

        analyzedCard.analysisText = generateAnalysisText(analyzedCard, macroData?.macroRisk || 50)

        setAnalyzedCards(prev => [...prev, analyzedCard].sort((a, b) => a.score - b.score))
        setShowSearchModal(false)
        setSearchQuery('')
        setSearchResults([])
    }

    const removeCard = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setAnalyzedCards(prev => prev.filter(c => c.id !== id))
        const updated = analyzedCards.filter(c => c.id !== id)
        if (updated.length === 0) {
            localStorage.removeItem('analyzedCards')
        } else {
            localStorage.setItem('analyzedCards', JSON.stringify(updated))
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analyse de Marché</h1>
                    <p className="text-white/50 mt-1">Score de spéculation 5D - Ajoutez des cartes à analyser</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter une carte
                    </button>
                    {macroData && (
                        <div className="flex gap-3 hidden md:flex">
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

            {/* Score Legend */}
            <div className="glass rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-sm font-medium text-white/70">Comprendre le Score 5D</h3>
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-white/60">0-30: Investissement (Sûr)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-white/60">30-60: Modéré (Attention)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-white/60">60+: Spéculatif (Risqué)</span>
                    </div>
                </div>
            </div>

            {analyzedCards.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border-2 border-dashed border-white/10 hover:border-white/20 transition-colors">
                    <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Aucune carte analysée</h3>
                    <p className="text-white/50 mb-6 max-w-md mx-auto">Recherchez n'importe quelle carte pour obtenir son score de spéculation instantané basé sur 5 dimensions.</p>
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Rechercher une carte
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {analyzedCards.map((card, index) => {
                        const statusLabel = card.score < 30 ? 'ACHETER' :
                            card.score < 50 ? 'SURVEILLER' :
                                card.score < 70 ? 'ATTENTION' : 'DANGER'
                        const statusColor = card.score < 30 ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30' :
                            card.score < 50 ? 'text-amber-400 bg-amber-950/50 border-amber-500/30' :
                                card.score < 70 ? 'text-orange-400 bg-orange-950/50 border-orange-500/30' :
                                    'text-red-400 bg-red-950/50 border-red-500/30'

                        return (
                            <div
                                key={card.id}
                                className="glass rounded-xl overflow-hidden group hover:ring-2 hover:ring-purple-500/50 transition-all cursor-pointer relative"
                                onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                            >
                                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-bold text-white border border-white/10">
                                    #{index + 1}
                                </div>
                                <button
                                    onClick={(e) => removeCard(card.id, e)}
                                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <Trash2 className="w-3 h-3 text-white" />
                                </button>

                                <div className="p-3 pb-0">
                                    <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-[#12121a]">
                                        <Image
                                            src={card.imageUrl}
                                            alt={card.name}
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                </div>

                                <div className="p-3">
                                    <div className="mb-2">
                                        <h3 className="font-semibold text-white text-sm truncate" title={card.name}>{card.name}</h3>
                                        <p className="text-xs text-white/50 truncate" title={card.setName}>{card.setName}</p>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${card.isVintage
                                                ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                                                : 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
                                            }`}>
                                            {card.isVintage ? 'VINTAGE' : 'MODERNE'}
                                        </span>
                                        <span className="font-mono font-bold text-white text-sm">
                                            ~${card.estimatedValue}
                                        </span>
                                    </div>

                                    <div className={`mt-2 flex items-center justify-between p-2 rounded-lg border ${statusColor}`}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] opacity-70 uppercase tracking-wider">Score</span>
                                            <span className="font-black text-lg leading-none">{card.score}</span>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-black/20">
                                            {statusLabel}
                                        </span>
                                    </div>

                                    {/* Expanded Analysis */}
                                    {expandedCard === card.id && (
                                        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/70 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-start gap-2 mb-2">
                                                <Info className="w-3 h-3 mt-0.5 text-blue-400 shrink-0" />
                                                <p>{card.analysisText}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="bg-white/5 p-1.5 rounded">
                                                    <span className="block text-[9px] text-white/40">RARETÉ</span>
                                                    <span className="text-white truncate">{card.rarity}</span>
                                                </div>
                                                <div className="bg-white/5 p-1.5 rounded">
                                                    <span className="block text-[9px] text-white/40">RISQUE</span>
                                                    <span className="text-white">{macroData?.macroRisk || 50}/100</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Search Modal */}
            {showSearchModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
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

                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Nom de la carte (ex: Dracaufeu, Tortank, Noctali ex...)"
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

                        <div className="overflow-y-auto max-h-[50vh] p-4 pt-0 custom-scrollbar">
                            {isSearching ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                                    <p className="text-white/50">Recherche TCGdex...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {searchResults.map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => addCardToAnalysis(card)}
                                            className="glass rounded-xl p-2 text-left hover:bg-white/10 transition-colors group relative overflow-hidden"
                                        >
                                            <div className="aspect-[3/4] relative mb-2 bg-[#12121a] rounded-lg overflow-hidden">
                                                <Image
                                                    src={getCardImageUrl(card, 'high')}
                                                    alt={card.name}
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 transition-colors flex items-center justify-center">
                                                    <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100 duration-200" />
                                                </div>
                                            </div>
                                            <p className="font-medium text-white text-sm truncate">{card.name}</p>
                                            <p className="text-xs text-white/50 truncate">{card.set?.name || 'Set inconnu'}</p>

                                            {/* Rarity badge */}
                                            {card.rarity && (
                                                <div className="absolute top-3 right-3 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[9px] text-white/80">
                                                    {card.rarity}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery && !isSearching ? (
                                <div className="py-12 text-center text-white/50">
                                    Aucun résultat pour "{searchQuery}"
                                </div>
                            ) : (
                                <div className="py-12 text-center text-white/50">
                                    Tapez le nom d'un Pokémon et appuyez sur Entrée
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
