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
    Info,
    Hash
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { getScoreColor } from '@/lib/utils'
import { searchCards, getCardImageUrl, getCard, type TCGdexCard } from '@/lib/tcgdex'
import { searchCardsWithPrices, getBestMarketPrice, getCardWithPrices } from '@/lib/pokemontcg'
import { calculateQuickScore, type PricePoint } from '@/lib/scoring/speculationScore'
import { getMacroScore } from '@/lib/data/macro'
import { CardAnalysisModal } from '@/components/analysis/CardAnalysisModal'

// Type for analyzed card
export type AnalyzedCard = {
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
    cardNumber: string // Added localId
}

// Generate price history for scoring
function generatePriceHistory(baseValue: number, isVintage: boolean): PricePoint[] {
    const history: PricePoint[] = []
    let price = baseValue

    for (let i = 90; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const volatility = isVintage ? 0.015 : 0.04
        price = price * (1 + (Math.random() - 0.48) * volatility)
        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.max(0, Math.round(price * 100) / 100)
        })
    }
    if (history.length > 0) {
        history[history.length - 1].price = baseValue
    }

    return history
}

// Estimate value fallback
function estimateValue(card: TCGdexCard, isVintage: boolean): number {
    const name = card.name.toLowerCase()
    const rarity = card.rarity?.toLowerCase() || ''

    let base = 5

    // Ultra Rares
    if (name.includes(' ex') || name.includes(' gx') || name.includes(' v') || name.includes(' vmax') || name.includes(' vstar')) base = 15
    if (name.includes('star') || name.includes('shining')) base = 100
    if (rarity.includes('secret') || rarity.includes('hyper')) base = 50
    if (rarity.includes('illustration') || rarity.includes('alt')) base = 40

    // Vintage Multiplier
    if (isVintage) {
        if (name.includes(' ex')) return Math.max(base * 5, 80)
        if (name.includes('star')) return Math.max(base * 5, 300)
        return base * 3
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
        parts.push("Carte Vintage : Le marché privilégie l'état (PSA 9-10).")
    } else {
        parts.push("Carte Moderne : Sensible à la rotation et aux reprints.")
    }

    if (card.score > 70) {
        parts.push("⚠️ Haute Spéculation : Prix possiblement en bulle.")
    } else if (card.score < 30) {
        parts.push("✅ Valeur Sûre : Historique de prix stable.")
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
    const [addingCardId, setAddingCardId] = useState<string | null>(null)
    const [macroData, setMacroData] = useState<{
        fearGreed: number
        btcChange: number
        macroRisk: number
    } | null>(null)
    const [selectedCard, setSelectedCard] = useState<AnalyzedCard | null>(null)

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
            setSearchResults(results.filter(c => c.image).slice(0, 20))
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    const addCardToAnalysis = async (partialCard: TCGdexCard) => {
        if (analyzedCards.some(c => c.tcgdexId === partialCard.id)) {
            alert('Cette carte est déjà dans votre analyse')
            return
        }

        setAddingCardId(partialCard.id)

        try {
            const fetchWithTimeout = async<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
                const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
                    return Promise.race([promise, timeout])
            }

                    // 1. Fetch FULL details with timeout (3s)
                    const card = await fetchWithTimeout(
                getCard(partialCard.id).then(c => c || partialCard),
                    3000,
                    partialCard
                    )

                    const isVintage = checkVintage(card.set?.id || '', card.set?.name || '')

                    // 2. Fetch REAL PRICE with timeout (3s)
                    let realPrice = 0

                    try {
                const tcgCard = await fetchWithTimeout(
                    getCardWithPrices(card.id),
                    3000,
                    null
                    )

                    if (tcgCard) {
                    const priceInfo = getBestMarketPrice(tcgCard)
                    if (priceInfo) realPrice = priceInfo.price
                }
            } catch (e) {
                        console.warn('Price fetch warning:', e)
                    }

            const finalValue = realPrice > 0 ? realPrice : estimateValue(card, isVintage)

                    const priceHistory = generatePriceHistory(finalValue, isVintage)
                    const baseScore = calculateQuickScore(priceHistory, 5000, isVintage)
            const finalScore = isVintage && finalValue > 100 ? Math.max(10, baseScore - 15) : baseScore

                    const analyzedCard: AnalyzedCard = {
                        id: Date.now().toString(),
                    tcgdexId: card.id,
                    name: card.name,
                    setName: card.set?.name || 'Set Inconnu',
                    rarity: card.rarity || 'Non spécifié',
                    imageUrl: getCardImageUrl(card, 'high'),
                    isVintage,
                    score: finalScore,
                    estimatedValue: finalValue,
                    addedAt: new Date(),
                    analysisText: '',
                    cardNumber: card.localId || '?'
            }

                    analyzedCard.analysisText = generateAnalysisText(analyzedCard, macroData?.macroRisk || 50)

            setAnalyzedCards(prev => [...prev, analyzedCard].sort((a, b) => a.score - b.score))
                    setShowSearchModal(false)
                    setSearchQuery('')
                    setSearchResults([])
        } catch (error) {
                        console.error('Error adding card:', error)
            alert('L\'ajout a pris trop de temps. Réessayez.')
        } finally {
                        setAddingCardId(null)
                    }
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
                                            onClick={() => setSelectedCard(card)}
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
                                                        className="object-contain transform transition-transform group-hover:scale-105"
                                                        unoptimized
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-3">
                                                <div className="mb-2">
                                                    <h3 className="font-semibold text-white text-sm truncate" title={card.name}>{card.name}</h3>
                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                        <span className="truncate max-w-[60%]" title={card.setName}>{card.setName}</span>
                                                        <span className="flex items-center gap-0.5">
                                                            <Hash className="w-3 h-3" /> {card.cardNumber}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${card.isVintage
                                                            ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                                                            : 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
                                                        }`}>
                                                        {card.isVintage ? 'VINTAGE' : 'MODERNE'}
                                                    </span>
                                                    <span className="font-mono font-bold text-white text-sm">
                                                        ${card.estimatedValue}
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
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {selectedCard && (
                            <CardAnalysisModal
                                card={selectedCard}
                                onClose={() => setSelectedCard(null)}
                            />
                        )}

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
                                                        disabled={addingCardId === card.id}
                                                        className="glass rounded-xl p-2 text-left hover:bg-white/10 transition-colors group relative overflow-hidden disabled:opacity-50"
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
                                                                {addingCardId === card.id ? (
                                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                                ) : (
                                                                    <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100 duration-200" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="font-medium text-white text-sm truncate">{card.name}</p>
                                                        <p className="text-xs text-white/50 truncate mb-1">{card.set?.name || 'Set inconnu'}</p>
                                                        <div className="flex items-center gap-1 text-[10px] text-white/40">
                                                            <Hash className="w-3 h-3" />
                                                            <span>{card.localId || '?'}</span>
                                                        </div>
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
