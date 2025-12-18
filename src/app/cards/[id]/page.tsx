'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { getCard, getCardImageUrl, TCGdexCard } from '@/lib/tcgdex'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { PriceChart } from '@/components/charts/PriceChart'
import { getScoreColor, formatPrice } from '@/lib/utils'
import { calculateSimplifiedScore, calculateFullScore, FullSpeculationScore } from '@/lib/scoring'
import { calculateTechnicalIndicators, calculateRebondScore, TechnicalIndicators, RebondScore } from '@/lib/scoring/technicals'
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
    Wallet,
    Info,
    Activity,
    Zap
} from 'lucide-react'

// Generate mock price history (will be replaced by real data later)
function generateMockPriceHistory(cardName: string) {
    const now = Date.now()
    const data = []
    // Use card name to seed the random for consistency
    const seed = cardName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    let basePrice = 20 + (seed % 200)

    for (let i = 90; i >= 0; i--) {
        const volatility = 0.02 + ((seed % 10) / 100)
        basePrice *= (1 - volatility) + (Math.random() * 2 * volatility)
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
    const [fullScore, setFullScore] = useState<FullSpeculationScore | null>(null)
    const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null)
    const [rebondScore, setRebondScore] = useState<RebondScore | null>(null)

    // Generate price history based on card name for consistency
    const priceHistory = useMemo(() => {
        return card ? generateMockPriceHistory(card.name) : []
    }, [card])

    // Calculate real score when card data is available
    useEffect(() => {
        if (card && priceHistory.length > 0) {
            const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0
            const priceOneYearAgo = priceHistory[0]?.price || currentPrice

            const score = calculateFullScore({
                priceHistory: priceHistory.map(p => ({ price: p.price, date: new Date(p.date) })),
                currentPrice,
                priceOneYearAgo,
                rarity: card.rarity,
                setId: card.set?.id || '',
                pokemonName: card.name,
                isVintage: card.set?.id?.startsWith('base') || card.set?.id?.startsWith('neo')
            })
            setFullScore(score)

            // Calculate technical indicators and rebond score
            const techIndicators = calculateTechnicalIndicators(
                priceHistory.map(p => ({ date: p.date, price: p.price, source: 'cardmarket' as const })),
                0, // No volume data yet
                []
            )
            setTechnicals(techIndicators)
            setRebondScore(calculateRebondScore(techIndicators))
        }
    }, [card, priceHistory])

    const score = fullScore || {
        total: card ? calculateSimplifiedScore({ rarity: card.rarity, setId: card.set?.id, pokemonName: card.name }) : 50,
        d1: { score: 50 }, d2: { score: 50 }, d3: { score: 50 }, d4: { score: 50 }, d5: { score: 50 }
    }
    const scoreColors = getScoreColor(score.total)

    const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0
    const oldPrice = priceHistory[0]?.price || currentPrice
    const priceChange = oldPrice > 0 ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0

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
                        <div className="relative aspect-[63/88] rounded-xl overflow-hidden bg-white/5 mb-6">
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
                                <Plus className="w-5 h-5 text-white" />
                                <span className="text-xs text-white/60">Portfolio</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                <Bell className="w-5 h-5 text-white" />
                                <span className="text-xs text-white/60">Alerte</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                <Share2 className="w-5 h-5 text-white" />
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
                                        <span className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full">
                                            {card.rarity}
                                        </span>
                                    )}
                                    {card.types?.map((type) => (
                                        <span key={type} className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full">
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
                            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-white' : 'text-white/60'}`}>
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
                            <BarChart3 className="w-5 h-5 text-white" />
                            Analyse de Spéculation
                        </h2>

                        <div className="space-y-4">
                            {[
                                { name: 'D1: Volatilité', score: score.d1?.score ?? 50, description: 'Variation des prix' },
                                { name: 'D2: Croissance', score: score.d2?.score ?? 50, description: 'Rendement vs benchmark' },
                                { name: 'D3: Rareté', score: score.d3?.score ?? 50, description: 'Offre vs demande' },
                                { name: 'D4: Sentiment', score: score.d4?.score ?? 50, description: 'Hype réseaux sociaux' },
                                { name: 'D5: Macro', score: score.d5?.score ?? 50, description: 'Corrélation crypto/marché' },
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

                    {/* Rebond Potential Section */}
                    {rebondScore && technicals && (
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-white" />
                                Potentiel de Rebond
                            </h2>

                            {/* Rebond Score */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm text-white/50">Score de Rebond</p>
                                    <p className="text-3xl font-bold text-white mt-1">{rebondScore.score}/100</p>
                                    <p className="text-sm text-white/60 mt-1">Confiance: {Math.round(rebondScore.confidence * 100)}%</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl font-bold ${rebondScore.recommendation === 'strong_buy' ? 'bg-white/20 text-white' :
                                        rebondScore.recommendation === 'buy' ? 'bg-white/15 text-white/90' :
                                            rebondScore.recommendation === 'hold' ? 'bg-white/10 text-white/70' :
                                                'bg-white/5 text-white/50'
                                    }`}>
                                    {rebondScore.recommendation === 'strong_buy' ? 'ACHAT FORT' :
                                        rebondScore.recommendation === 'buy' ? 'ACHAT' :
                                            rebondScore.recommendation === 'hold' ? 'CONSERVER' :
                                                rebondScore.recommendation === 'sell' ? 'VENDRE' : 'VENTE FORTE'}
                                </div>
                            </div>

                            {/* Technical Indicators */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* RSI */}
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-white/50">RSI (14)</span>
                                        {technicals.isOversold && (
                                            <span className="px-2 py-0.5 bg-white text-black text-xs rounded-full font-medium">
                                                Survente
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-2xl font-bold ${technicals.rsi14 < 30 ? 'text-white' :
                                            technicals.rsi14 > 70 ? 'text-white/50' : 'text-white/80'
                                        }`}>
                                        {technicals.rsi14.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-white/40 mt-1">
                                        {technicals.rsi14 < 30 ? 'Zone de survente' :
                                            technicals.rsi14 > 70 ? 'Zone de surachat' : 'Zone neutre'}
                                    </p>
                                </div>

                                {/* MACD */}
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-white/50">MACD</span>
                                        {technicals.isMACDBullish && (
                                            <span className="px-2 py-0.5 bg-white text-black text-xs rounded-full font-medium">
                                                Bullish
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-2xl font-bold ${technicals.macd.histogram > 0 ? 'text-white' : 'text-white/50'
                                        }`}>
                                        {technicals.macd.histogram > 0 ? '+' : ''}{technicals.macd.histogram.toFixed(3)}
                                    </p>
                                    <p className="text-xs text-white/40 mt-1">
                                        Signal: {technicals.macd.signalLine.toFixed(3)}
                                    </p>
                                </div>

                                {/* Volume */}
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-white/50">Volume</span>
                                        {technicals.isVolumeSpiking && (
                                            <span className="px-2 py-0.5 bg-white text-black text-xs rounded-full font-medium flex items-center gap-1">
                                                <Zap className="w-3 h-3" /> Spike
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-2xl font-bold ${technicals.volumeRatio > 2 ? 'text-white' : 'text-white/70'
                                        }`}>
                                        {technicals.volumeRatio.toFixed(1)}x
                                    </p>
                                    <p className="text-xs text-white/40 mt-1">
                                        vs moyenne
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Price chart placeholder */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-white" />
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
                            <Wallet className="w-5 h-5 text-white" />
                            Recommandation
                        </h2>

                        <div className={`p-4 rounded-xl ${score.total < 40 ? 'bg-white/20 border border-white/30' :
                            score.total < 70 ? 'bg-white/10 border border-white/20' :
                                'bg-white/5 border border-white/10'
                            }`}>
                            <p className={`text-lg font-bold ${score.total < 40 ? 'text-white' :
                                score.total < 70 ? 'text-white/80' :
                                    'text-white/60'
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
