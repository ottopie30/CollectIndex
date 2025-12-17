'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getCard, getCardImageUrl, TCGdexCard } from '@/lib/tcgdex'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { PriceChart } from '@/components/charts/PriceChart'
import { getScoreColor, formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Star,
    Plus,
    Bell,
    Share2,
    BarChart3,
    Wallet
} from 'lucide-react'

// Mock scoring data
function generateMockScore(cardId: string) {
    const hash = cardId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    const total = Math.abs(hash % 100)
    return {
        total,
        d1_volatility: Math.abs((hash * 13) % 100),
        d2_growth: Math.abs((hash * 17) % 100),
        d3_scarcity: Math.abs((hash * 23) % 100),
        d4_sentiment: Math.abs((hash * 29) % 100),
        d5_macro: Math.abs((hash * 31) % 100),
    }
}

// Mock price data
function generateMockPriceHistory() {
    const now = Date.now()
    const data = []
    let basePrice = 50 + Math.random() * 200

    for (let i = 90; i >= 0; i--) {
        basePrice *= 0.98 + Math.random() * 0.04
        data.push({
            date: new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            price: Math.round(basePrice * 100) / 100
        })
    }
    return data
}

export default function CardDetailPage() {
    const params = useParams()
    const cardId = params.id as string

    const [card, setCard] = useState<TCGdexCard | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [priceHistory] = useState(generateMockPriceHistory())

    const score = generateMockScore(cardId)
    const scoreColors = getScoreColor(score.total)

    const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0
    const oldPrice = priceHistory[0]?.price || currentPrice
    const priceChange = ((currentPrice - oldPrice) / oldPrice) * 100

    useEffect(() => {
        async function fetchCard() {
            setIsLoading(true)
            try {
                const result = await getCard(cardId)
                setCard(result)
            } catch (error) {
                console.error('Error fetching card:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCard()
    }, [cardId])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!card) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-white">Carte non trouvée</h1>
                <Link href="/cards" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
                    ← Retour à la recherche
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Link
                href="/cards"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour à la recherche</span>
            </Link>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Card image */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-2xl p-6 sticky top-6">
                        {/* Card image */}
                        <div className="relative aspect-[63/88] rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50 mb-6">
                            {card.image ? (
                                <Image
                                    src={getCardImageUrl(card, 'high')}
                                    alt={card.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                                    <span className="text-6xl">?</span>
                                </div>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-3 gap-2">
                            <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                <Plus className="w-5 h-5 text-purple-400" />
                                <span className="text-xs text-white/60">Portfolio</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                <Bell className="w-5 h-5 text-amber-400" />
                                <span className="text-xs text-white/60">Alerte</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                <Share2 className="w-5 h-5 text-blue-400" />
                                <span className="text-xs text-white/60">Partager</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{card.name}</h1>
                                <p className="text-white/50 mt-1">{card.set?.name || 'Unknown Set'}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    {card.rarity && (
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                                            {card.rarity}
                                        </span>
                                    )}
                                    {card.types?.map((type) => (
                                        <span key={type} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
                                            {type}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Score gauge */}
                            <ScoreGauge score={score.total} size="lg" showLabel={true} />
                        </div>

                        {/* Price info */}
                        <div className="flex items-end gap-6 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-sm text-white/50">Prix actuel estimé</p>
                                <p className="text-3xl font-bold text-white">{formatPrice(currentPrice)}</p>
                            </div>
                            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                <span className="text-lg font-semibold">
                                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                                </span>
                                <span className="text-white/40 text-sm">90j</span>
                            </div>
                        </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            Analyse de Spéculation
                        </h2>

                        <div className="space-y-4">
                            {[
                                { name: 'D1: Volatilité', score: score.d1_volatility, description: 'Variation des prix' },
                                { name: 'D2: Croissance', score: score.d2_growth, description: 'Rendement vs benchmark' },
                                { name: 'D3: Rareté', score: score.d3_scarcity, description: 'Offre vs demande' },
                                { name: 'D4: Sentiment', score: score.d4_sentiment, description: 'Hype réseaux sociaux' },
                                { name: 'D5: Macro', score: score.d5_macro, description: 'Corrélation crypto/marché' },
                            ].map((dim) => {
                                const dimColors = getScoreColor(dim.score)
                                return (
                                    <div key={dim.name} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-white">{dim.name}</span>
                                                <span className={`text-sm font-bold ${dimColors.text}`}>{dim.score}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${dimColors.gradient} transition-all duration-500`}
                                                    style={{ width: `${dim.score}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-white/40 mt-1">{dim.description}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Interpretation */}
                        <div className={`mt-6 p-4 rounded-xl ${scoreColors.bg} border border-white/10`}>
                            <div className="flex items-start gap-3">
                                {score.total >= 60 ? (
                                    <AlertTriangle className={`w-5 h-5 ${scoreColors.text} shrink-0 mt-0.5`} />
                                ) : (
                                    <Star className={`w-5 h-5 ${scoreColors.text} shrink-0 mt-0.5`} />
                                )}
                                <div>
                                    <p className={`font-semibold ${scoreColors.text}`}>
                                        {score.total < 30 ? 'Investissement Solide' :
                                            score.total < 60 ? 'Zone de Transition' :
                                                'Spéculation Élevée'}
                                    </p>
                                    <p className="text-sm text-white/60 mt-1">
                                        {score.total < 30
                                            ? 'Cette carte présente des caractéristiques d\'investissement stable avec une volatilité faible.'
                                            : score.total < 60
                                                ? 'Cette carte montre des signes mixtes. Surveillez les mouvements de prix.'
                                                : 'Attention : Cette carte montre des signes de spéculation élevée. Risque de correction important.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price chart placeholder */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            Historique des Prix
                        </h2>

                        <PriceChart
                            data={priceHistory.map(p => ({ time: p.date, value: p.price }))}
                            height={250}
                        />

                        {/* Price stats */}
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {[
                                { label: 'Min 90j', value: formatPrice(Math.min(...priceHistory.map(p => p.price))) },
                                { label: 'Max 90j', value: formatPrice(Math.max(...priceHistory.map(p => p.price))) },
                                { label: 'Moyenne', value: formatPrice(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length) },
                                { label: 'Volatilité', value: '32%' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center p-3 bg-white/5 rounded-xl">
                                    <p className="text-xs text-white/50">{stat.label}</p>
                                    <p className="font-semibold text-white mt-1">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-purple-400" />
                            Recommandation
                        </h2>

                        <div className={`p-4 rounded-xl ${score.total < 40 ? 'bg-emerald-500/10 border border-emerald-500/30' :
                            score.total < 70 ? 'bg-amber-500/10 border border-amber-500/30' :
                                'bg-red-500/10 border border-red-500/30'
                            }`}>
                            <p className={`text-lg font-bold ${score.total < 40 ? 'text-emerald-400' :
                                score.total < 70 ? 'text-amber-400' :
                                    'text-red-400'
                                }`}>
                                {score.total < 40 ? 'ACHETER / CONSERVER' :
                                    score.total < 70 ? 'SURVEILLER' :
                                        'ÉVITER / VENDRE'}
                            </p>
                            <p className="text-sm text-white/60 mt-2">
                                {score.total < 40
                                    ? `Cette carte présente un bon rapport risque/récompense. Prix d'entrée optimal autour de ${formatPrice(currentPrice * 0.9)}.`
                                    : score.total < 70
                                        ? 'Attendez une confirmation de tendance avant de prendre position. Potentielle correction à venir.'
                                        : 'Le risque de perte est élevé. Si vous possédez cette carte, considérez de prendre vos profits.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
