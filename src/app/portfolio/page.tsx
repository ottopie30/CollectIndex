'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Wallet,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    BarChart3,
    AlertTriangle,
    Search,
    X,
    Loader2
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { getScoreColor, formatPrice } from '@/lib/utils'
import { searchCards, TCGdexCard, getCardImageUrl } from '@/lib/tcgdex'
import {
    getOrCreateDefaultPortfolio,
    getPortfolioItems,
    addCardToPortfolio as addCardToDb,
    removeCardFromPortfolio as removeCardFromDb,
    updatePortfolioItemQuantity,
    PortfolioItem
} from '@/lib/portfolio'

// Portfolio card type for UI
type PortfolioCard = {
    id: string
    cardId: string
    name: string
    setName: string
    image: string | null
    quantity: number
    purchasePrice: number
    currentPrice: number
    score: number
    addedAt: string
}

export default function PortfolioPage() {
    const { t } = useI18n()
    const [portfolio, setPortfolio] = useState<PortfolioCard[]>([])
    const [portfolioId, setPortfolioId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<TCGdexCard[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Load portfolio from Supabase
    const loadPortfolio = useCallback(async () => {
        setIsLoading(true)
        try {
            const defaultPortfolio = await getOrCreateDefaultPortfolio()
            if (defaultPortfolio) {
                setPortfolioId(defaultPortfolio.id)
                const items = await getPortfolioItems(defaultPortfolio.id)

                // Map DB items to UI format
                const cards: PortfolioCard[] = items.map((item: PortfolioItem) => ({
                    id: item.id,
                    cardId: item.tcgdex_id,
                    name: item.name,
                    setName: item.set_name,
                    image: item.image_url,
                    quantity: item.quantity,
                    purchasePrice: item.purchase_price,
                    currentPrice: item.current_price,
                    score: item.score,
                    addedAt: item.created_at.split('T')[0]
                }))
                setPortfolio(cards)
            }
        } catch (error) {
            console.error('Error loading portfolio:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadPortfolio()
    }, [loadPortfolio])

    // Calculate portfolio stats
    const totalValue = portfolio.reduce((sum, card) => sum + (card.currentPrice * card.quantity), 0)
    const totalCost = portfolio.reduce((sum, card) => sum + (card.purchasePrice * card.quantity), 0)
    const totalPnL = totalValue - totalCost
    const pnlPercent = totalCost > 0 ? ((totalPnL / totalCost) * 100) : 0
    const avgScore = portfolio.length > 0
        ? Math.round(portfolio.reduce((sum, card) => sum + card.score, 0) / portfolio.length)
        : 0

    // Search cards
    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setIsSearching(true)
        try {
            const results = await searchCards(searchQuery)
            setSearchResults(results)
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    // Add card to portfolio (with DB persistence)
    const addToPortfolio = async (card: TCGdexCard) => {
        if (!portfolioId) return

        const result = await addCardToDb(portfolioId, {
            tcgdex_id: card.id,
            name: card.name,
            set_name: card.set?.name || 'Unknown Set',
            image_url: getCardImageUrl(card, 'high'),
            quantity: 1,
            purchase_price: 10,
            current_price: 12,
            score: Math.floor(Math.random() * 100)
        })

        if (result) {
            await loadPortfolio() // Refresh from DB
        }

        setShowAddModal(false)
        setSearchQuery('')
        setSearchResults([])
    }

    // Remove card from portfolio (with DB persistence)
    const removeFromPortfolio = async (id: string) => {
        const success = await removeCardFromDb(id)
        if (success) {
            setPortfolio(portfolio.filter(card => card.id !== id))
        }
    }

    // Update quantity (with DB persistence)
    const updateQuantity = async (id: string, delta: number) => {
        const card = portfolio.find(c => c.id === id)
        if (!card) return

        const newQty = Math.max(1, card.quantity + delta)
        const success = await updatePortfolioItemQuantity(id, newQty)

        if (success) {
            setPortfolio(portfolio.map(c =>
                c.id === id ? { ...c, quantity: newQty } : c
            ))
        }
    }

    const avgScoreColors = getScoreColor(avgScore)

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
                    <h1 className="text-3xl font-bold text-white">{t('portfolio.title')}</h1>
                    <p className="text-white/50 mt-1">{t('portfolio.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    {t('portfolio.addCard')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Value */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">{t('portfolio.totalValue')}</p>
                            <p className="text-2xl font-bold text-white mt-1">{formatPrice(totalValue)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                {/* P&L */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">{t('portfolio.pnl')}</p>
                            <p className={`text-2xl font-bold mt-1 ${totalPnL >= 0 ? 'text-white' : 'text-white/60'}`}>
                                {totalPnL >= 0 ? '+' : ''}{formatPrice(totalPnL)}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl ${totalPnL >= 0 ? 'bg-white/20' : 'bg-white/10'}`}>
                            {totalPnL >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-white" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-white/60" />
                            )}
                        </div>
                    </div>
                    <p className={`text-sm mt-2 ${pnlPercent >= 0 ? 'text-white' : 'text-white/60'}`}>
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}% {t('portfolio.sincePurchase')}
                    </p>
                </div>

                {/* Cards Count */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">{t('portfolio.cards')}</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {portfolio.reduce((sum, c) => sum + c.quantity, 0)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-white/40 mt-2">{t('portfolio.uniqueCards', { count: portfolio.length.toString() })}</p>
                </div>

                {/* Average Score */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">{t('portfolio.averageScore')}</p>
                            <p className={`text-2xl font-bold mt-1 ${avgScoreColors.text}`}>{avgScore}</p>
                        </div>
                        <ScoreGauge score={avgScore} size="sm" showLabel={false} />
                    </div>
                    <p className={`text-sm mt-2 ${avgScoreColors.text}`}>
                        {avgScore < 30 ? t('portfolio.scoreLabel.solid') : avgScore < 60 ? t('portfolio.scoreLabel.mixed') : t('portfolio.scoreLabel.risky')}
                    </p>
                </div>
            </div>

            {/* Portfolio Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">{t('portfolio.myCards')}</h2>
                </div>

                {portfolio.length === 0 ? (
                    <div className="p-12 text-center">
                        <Wallet className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">{t('portfolio.empty')}</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                        >
                            {t('portfolio.addFirst')}
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {portfolio.map((card) => {
                            const cardPnL = (card.currentPrice - card.purchasePrice) * card.quantity
                            const cardPnLPercent = ((card.currentPrice - card.purchasePrice) / card.purchasePrice) * 100
                            const scoreColors = getScoreColor(card.score)

                            return (
                                <div key={card.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {/* Image */}
                                        <div className="w-16 h-22 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                            {card.image ? (
                                                <Image
                                                    src={card.image}
                                                    alt={card.name}
                                                    width={64}
                                                    height={88}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BarChart3 className="w-6 h-6 text-white/20" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/cards/${card.cardId}`} className="font-medium text-white hover:text-white/80 transition-colors">
                                                {card.name}
                                            </Link>
                                            <p className="text-sm text-white/50">{card.setName}</p>
                                        </div>

                                        {/* Quantity */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(card.id, -1)}
                                                className="w-8 h-8 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-white font-medium">{card.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(card.id, 1)}
                                                className="w-8 h-8 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Score */}
                                        <div className="w-20 text-right">
                                            <ScoreGauge score={card.score} size="sm" showLabel={false} />
                                        </div>

                                        {/* Value */}
                                        <div className="w-28 text-right">
                                            <p className="font-bold text-white">{formatPrice(card.currentPrice * card.quantity)}</p>
                                            <p className={`text-sm ${cardPnL >= 0 ? 'text-white' : 'text-white/60'}`}>
                                                {cardPnL >= 0 ? '+' : ''}{cardPnLPercent.toFixed(1)}%
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => removeFromPortfolio(card.id)}
                                            className="p-2 text-white/30 hover:text-white transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setShowAddModal(false)} />
                    <div className="relative glass rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Ajouter une carte</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Rechercher une carte..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                            >
                                {isSearching ? '...' : 'Chercher'}
                            </button>
                        </div>

                        {/* Results */}
                        <div className="space-y-2">
                            {searchResults.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => addToPortfolio(card)}
                                    className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors text-left"
                                >
                                    <div className="w-10 h-14 rounded overflow-hidden bg-white/5">
                                        <Image
                                            src={getCardImageUrl(card, 'low')}
                                            alt={card.name}
                                            width={40}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{card.name}</p>
                                        <p className="text-sm text-white/50">{card.set?.name}</p>
                                    </div>
                                    <Plus className="w-5 h-5 text-white" />
                                </button>
                            ))}
                            {searchResults.length === 0 && searchQuery && !isSearching && (
                                <p className="text-center text-white/50 py-4">Aucun résultat</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
