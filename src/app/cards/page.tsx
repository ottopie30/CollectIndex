'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, SlidersHorizontal, Grid3X3, List, Loader2, Globe } from 'lucide-react'
import { searchCards, getCardImageUrl, TCGdexCard } from '@/lib/tcgdex'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { getScoreColor } from '@/lib/utils'
import { getMultilingualSearchTerms, translateSearchQuery } from '@/lib/translations'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/provider'

// Mock function to generate random scores (will be replaced by real scoring)
function generateMockScore(cardId: string): number {
    const hash = cardId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    return Math.abs(hash % 100)
}

export default function CardsPage() {
    const { t } = useI18n()
    const [query, setQuery] = useState('')
    const [cards, setCards] = useState<TCGdexCard[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [filters, setFilters] = useState({
        rarity: 'all',
        set: 'all',
        scoreRange: [0, 100] as [number, number]
    })

    // Debounced search with multilingual support
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setCards([])
            return
        }

        setIsLoading(true)
        try {
            // Get search terms in both languages
            const searchTerms = getMultilingualSearchTerms(searchQuery)

            // Search with all terms in parallel
            const allResults = await Promise.all(
                searchTerms.map(term => searchCards(term))
            )

            // Merge and deduplicate results
            const seen = new Set<string>()
            const uniqueCards: TCGdexCard[] = []

            for (const results of allResults) {
                for (const card of results) {
                    if (!seen.has(card.id)) {
                        seen.add(card.id)
                        uniqueCards.push(card)
                    }
                }
            }

            setCards(uniqueCards.slice(0, 50)) // Limit to 50 results
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, performSearch])

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('cards.title')}</h1>
                    <p className="text-white/50 mt-1">{t('cards.startSearchDesc')}</p>
                </div>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Main search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder={t('cards.searchPlaceholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all"
                    />
                    <Globe className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    {isLoading && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 animate-spin" />
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-3 glass rounded-xl hover:bg-white/10 transition-all text-white/70 hover:text-white">
                        <SlidersHorizontal className="w-5 h-5" />
                        <span>{t('cards.filters')}</span>
                    </button>

                    {/* View mode toggle */}
                    <div className="flex glass rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            {cards.length > 0 && (
                <p className="text-sm text-white/50">
                    {t('cards.resultsCount', {
                        count: cards.length.toString(),
                        s: cards.length > 1 ? 's' : ''
                    })}
                </p>
            )}

            {/* Results */}
            {cards.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {cards.map((card) => {
                            const score = generateMockScore(card.id)
                            const scoreColors = getScoreColor(score)

                            return (
                                <Link key={card.id} href={`/cards/${card.id}`}>
                                    <div className="group relative glass rounded-2xl p-4 card-hover">
                                        {/* Score badge */}
                                        <div className="absolute -top-2 -right-2 z-10">
                                            <div className={`w-10 h-10 rounded-full ${scoreColors.bg} border border-white/20 flex items-center justify-center`}>
                                                <span className={`text-sm font-bold ${scoreColors.text}`}>{score}</span>
                                            </div>
                                        </div>

                                        {/* Card image */}
                                        <div className="relative aspect-[63/88] mb-4 rounded-xl overflow-hidden bg-white/5">
                                            {card.image ? (
                                                <Image
                                                    src={getCardImageUrl(card, 'high')}
                                                    alt={card.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                                                    <span className="text-4xl">?</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card info */}
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-white text-sm truncate group-hover:text-white/80 transition-colors">
                                                {card.name}
                                            </h3>
                                            <p className="text-xs text-white/50 truncate">{card.set?.name || 'Unknown Set'}</p>
                                            {card.rarity && (
                                                <span className="inline-block px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full">
                                                    {card.rarity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {cards.map((card) => {
                            const score = generateMockScore(card.id)
                            const scoreColors = getScoreColor(score)

                            return (
                                <Link key={card.id} href={`/cards/${card.id}`}>
                                    <div className="flex items-center gap-4 p-4 glass rounded-xl card-hover">
                                        {/* Card image */}
                                        <div className="relative w-16 h-22 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                            {card.image ? (
                                                <Image
                                                    src={getCardImageUrl(card, 'low')}
                                                    alt={card.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                                                    <span className="text-xl">?</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white truncate">{card.name}</h3>
                                            <p className="text-sm text-white/50">{card.set?.name || 'Unknown Set'}</p>
                                            {card.rarity && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full">
                                                    {card.rarity}
                                                </span>
                                            )}
                                        </div>

                                        {/* Score */}
                                        <ScoreGauge score={score} size="sm" showLabel={false} />

                                        {/* Action arrow */}
                                        <div className="text-white/30 group-hover:text-white/80 transition-colors">
                                            →
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )
            ) : query.length >= 2 && !isLoading ? (
                <div className="text-center py-12">
                    <p className="text-white/50">{t('cards.noResults', { query })}</p>
                </div>
            ) : query.length < 2 ? (
                <div className="text-center py-12 glass rounded-2xl">
                    <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">{t('cards.startSearch')}</h3>
                    <p className="text-white/50">
                        {t('cards.startSearchDesc')}
                    </p>
                </div>
            ) : null}
        </div>
    )
}
