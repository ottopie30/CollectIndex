'use client'

import { useState, useEffect } from 'react'
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
    X
} from 'lucide-react'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { getScoreColor, formatPrice } from '@/lib/utils'
import { searchCards, TCGdexCard, getCardImageUrl } from '@/lib/tcgdex'

// Portfolio card type
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

// Mock portfolio data (will be replaced with Supabase)
const mockPortfolio: PortfolioCard[] = [
    {
        id: '1',
        cardId: 'base1-4',
        name: 'Charizard',
        setName: 'Base Set',
        image: 'https://assets.tcgdex.net/en/base/base1/4/high.webp',
        quantity: 1,
        purchasePrice: 350,
        currentPrice: 420,
        score: 25,
        addedAt: '2024-01-15'
    },
    {
        id: '2',
        cardId: 'sv1-1',
        name: 'Sprigatito',
        setName: 'Scarlet & Violet',
        image: 'https://assets.tcgdex.net/en/sv/sv1/1/high.webp',
        quantity: 4,
        purchasePrice: 2,
        currentPrice: 3.5,
        score: 45,
        addedAt: '2024-02-20'
    },
    {
        id: '3',
        cardId: 'swsh12pt5-160',
        name: 'Pikachu VMAX',
        setName: 'Crown Zenith',
        image: 'https://assets.tcgdex.net/en/swsh/swsh12pt5/160/high.webp',
        quantity: 2,
        purchasePrice: 45,
        currentPrice: 52,
        score: 68,
        addedAt: '2024-03-01'
    }
]

export default function PortfolioPage() {
    const [portfolio, setPortfolio] = useState<PortfolioCard[]>(mockPortfolio)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<TCGdexCard[]>([])
    const [isSearching, setIsSearching] = useState(false)

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

    // Add card to portfolio
    const addToPortfolio = (card: TCGdexCard) => {
        const newCard: PortfolioCard = {
            id: Date.now().toString(),
            cardId: card.id,
            name: card.name,
            setName: card.set?.name || 'Unknown Set',
            image: getCardImageUrl(card, 'high'),
            quantity: 1,
            purchasePrice: 10,
            currentPrice: 12,
            score: Math.floor(Math.random() * 100),
            addedAt: new Date().toISOString().split('T')[0]
        }
        setPortfolio([...portfolio, newCard])
        setShowAddModal(false)
        setSearchQuery('')
        setSearchResults([])
    }

    // Remove card from portfolio
    const removeFromPortfolio = (id: string) => {
        setPortfolio(portfolio.filter(card => card.id !== id))
    }

    // Update quantity
    const updateQuantity = (id: string, delta: number) => {
        setPortfolio(portfolio.map(card => {
            if (card.id === id) {
                const newQty = Math.max(1, card.quantity + delta)
                return { ...card, quantity: newQty }
            }
            return card
        }))
    }

    const avgScoreColors = getScoreColor(avgScore)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mon Portfolio</h1>
                    <p className="text-white/50 mt-1">Gérez votre collection de cartes Pokémon</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter une carte
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Value */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">Valeur Totale</p>
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
                            <p className="text-sm text-white/50">Plus/Moins Value</p>
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
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}% depuis l&apos;achat
                    </p>
                </div>

                {/* Cards Count */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">Cartes</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {portfolio.reduce((sum, c) => sum + c.quantity, 0)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-white/40 mt-2">{portfolio.length} cartes uniques</p>
                </div>

                {/* Average Score */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">Score Moyen</p>
                            <p className={`text-2xl font-bold mt-1 ${avgScoreColors.text}`}>{avgScore}</p>
                        </div>
                        <ScoreGauge score={avgScore} size="sm" showLabel={false} />
                    </div>
                    <p className={`text-sm mt-2 ${avgScoreColors.text}`}>
                        {avgScore < 30 ? 'Investissement Solide' : avgScore < 60 ? 'Zone Mixte' : 'Risque Élevé'}
                    </p>
                </div>
            </div>

            {/* Portfolio Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">Mes Cartes</h2>
                </div>

                {portfolio.length === 0 ? (
                    <div className="p-12 text-center">
                        <Wallet className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">Votre portfolio est vide</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                        >
                            Ajouter votre première carte
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
