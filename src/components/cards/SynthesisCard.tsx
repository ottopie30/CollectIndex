'use client'

import { useMemo } from 'react'
import {
    Target,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Sparkles,
    Activity,
    Shield,
    Flame,
    BarChart3
} from 'lucide-react'
import SpotlightCard from '@/components/ui/SpotlightCard'

interface SynthesisCardProps {
    cardName: string
    setName: string
    price: number
    priceChange: number
    speculationScore: number
    rebondScore?: number
    aiVerdict?: string
    aiSummary?: string
    aiScores?: {
        volatility: number
        growth: number
        scarcity: number
        sentiment: number
        macro: number
    }
    dimensions: {
        d1: number
        d2: number
        d3: number
        d4: number
        d5: number
    }
}

// Helper functions for static class names
const getRecommendationStyles = (color: string) => {
    switch (color) {
        case 'emerald':
        case 'green':
            return {
                bg: 'bg-emerald-500/20',
                border: 'border-emerald-500/30',
                text: 'text-emerald-400',
                gradient: 'from-emerald-500/20 to-green-500/10'
            }
        case 'red':
        case 'orange':
            return {
                bg: 'bg-red-500/20',
                border: 'border-red-500/30',
                text: 'text-red-400',
                gradient: 'from-red-500/20 to-orange-500/10'
            }
        default:
            return {
                bg: 'bg-amber-500/20',
                border: 'border-amber-500/30',
                text: 'text-amber-400',
                gradient: 'from-amber-500/20 to-yellow-500/10'
            }
    }
}

const getRiskStyles = (color: string) => {
    switch (color) {
        case 'emerald':
            return 'text-emerald-400'
        case 'red':
            return 'text-red-400'
        default:
            return 'text-amber-400'
    }
}

const getBarColor = (value: number) => {
    if (value >= 60) return 'bg-gradient-to-t from-emerald-500/60 to-emerald-400/30'
    if (value >= 40) return 'bg-gradient-to-t from-amber-500/60 to-amber-400/30'
    return 'bg-gradient-to-t from-red-500/60 to-red-400/30'
}

export function SynthesisCard({
    cardName,
    setName,
    price,
    priceChange,
    speculationScore,
    rebondScore = 50,
    aiVerdict = 'Hold',
    aiSummary,
    aiScores,
    dimensions
}: SynthesisCardProps) {

    const hybridScore = useMemo(() => {
        if (!aiScores) return speculationScore
        const aiAvg = (aiScores.volatility + aiScores.growth + aiScores.scarcity + aiScores.sentiment + aiScores.macro) / 5
        return Math.round((speculationScore + aiAvg) / 2)
    }, [speculationScore, aiScores])

    const recommendation = useMemo(() => {
        const signals = { bullish: 0, bearish: 0, neutral: 0 }

        if (speculationScore >= 70) signals.bullish += 2
        else if (speculationScore >= 50) signals.bullish += 1
        else if (speculationScore <= 30) signals.bearish += 2
        else signals.neutral += 1

        if (priceChange >= 10) signals.bullish += 1
        else if (priceChange <= -10) signals.bearish += 1
        else signals.neutral += 1

        if (rebondScore >= 70) signals.bullish += 2
        else if (rebondScore <= 30) signals.bearish += 1
        else signals.neutral += 1

        if (aiVerdict?.toLowerCase().includes('buy') || aiVerdict?.toLowerCase().includes('achat')) signals.bullish += 2
        else if (aiVerdict?.toLowerCase().includes('sell') || aiVerdict?.toLowerCase().includes('vente')) signals.bearish += 2
        else signals.neutral += 1

        if (signals.bullish >= 5) return { type: 'STRONG_BUY', label: 'Achat Fort', color: 'emerald', icon: CheckCircle2 }
        if (signals.bullish >= 3) return { type: 'BUY', label: 'Achat', color: 'green', icon: TrendingUp }
        if (signals.bearish >= 5) return { type: 'STRONG_SELL', label: 'Vente Forte', color: 'red', icon: XCircle }
        if (signals.bearish >= 3) return { type: 'SELL', label: 'Vente', color: 'orange', icon: TrendingDown }
        return { type: 'HOLD', label: 'Conserver', color: 'amber', icon: AlertTriangle }
    }, [speculationScore, priceChange, rebondScore, aiVerdict])

    const riskLevel = useMemo(() => {
        const volatility = dimensions.d1
        if (volatility >= 70) return { label: 'Faible', color: 'emerald' }
        if (volatility >= 40) return { label: 'Modéré', color: 'amber' }
        return { label: 'Élevé', color: 'red' }
    }, [dimensions.d1])

    const confidence = useMemo(() => {
        let score = 50
        if (aiScores) score += 25
        if (rebondScore !== 50) score += 15
        if (price > 0) score += 10
        return Math.min(score, 100)
    }, [aiScores, rebondScore, price])

    const RecommendationIcon = recommendation.icon
    const recStyles = getRecommendationStyles(recommendation.color)
    const riskStyles = getRiskStyles(riskLevel.color)

    return (
        <SpotlightCard
            className="!p-0 overflow-hidden"
            spotlightColor={recommendation.color === 'emerald' || recommendation.color === 'green'
                ? 'rgba(16, 185, 129, 0.3)'
                : recommendation.color === 'red' || recommendation.color === 'orange'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)'
            }
        >
            {/* Header with gradient */}
            <div className={`p-6 bg-gradient-to-r ${recStyles.gradient} border-b border-white/10`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${recStyles.bg}`}>
                            <Target className={`w-6 h-6 ${recStyles.text}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Synthèse Globale</h3>
                            <p className="text-sm text-white/50">Analyse complète multi-facteurs</p>
                        </div>
                    </div>

                    {/* Main verdict badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${recStyles.bg} border ${recStyles.border}`}>
                        <RecommendationIcon className={`w-5 h-5 ${recStyles.text}`} />
                        <span className={`font-bold ${recStyles.text}`}>{recommendation.label}</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="p-6 space-y-6">
                {/* Score overview - 3 columns */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-3xl font-bold text-white">{hybridScore}</div>
                        <div className="text-xs text-white/50 mt-1">Score Hybride</div>
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] text-cyan-400">Tech + IA</span>
                        </div>
                    </div>

                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-3xl font-bold text-white">{rebondScore}</div>
                        <div className="text-xs text-white/50 mt-1">Potentiel Rebond</div>
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Activity className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] text-purple-400">Technique</span>
                        </div>
                    </div>

                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className={`text-3xl font-bold ${riskStyles}`}>{riskLevel.label}</div>
                        <div className="text-xs text-white/50 mt-1">Niveau de Risque</div>
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Shield className="w-3 h-3 text-white/40" />
                            <span className="text-[10px] text-white/40">Volatilité</span>
                        </div>
                    </div>
                </div>

                {/* Dimension breakdown - mini bars */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Facteurs d'analyse
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { name: 'Stabilité', value: dimensions.d1, icon: Shield },
                            { name: 'Croissance', value: dimensions.d2, icon: TrendingUp },
                            { name: 'Rareté', value: dimensions.d3, icon: Flame },
                            { name: 'Sentiment', value: dimensions.d4, icon: Sparkles },
                            { name: 'Macro', value: dimensions.d5, icon: Activity }
                        ].map((dim) => {
                            const DimIcon = dim.icon
                            return (
                                <div key={dim.name} className="text-center">
                                    <div className="relative h-16 bg-white/5 rounded-lg overflow-hidden">
                                        <div
                                            className={`absolute bottom-0 left-0 right-0 ${getBarColor(dim.value)}`}
                                            style={{ height: `${dim.value}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">{dim.value}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <DimIcon className="w-3 h-3 text-white/40" />
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-0.5">{dim.name}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* AI Summary if available */}
                {aiSummary && (
                    <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-white/80 leading-relaxed">{aiSummary}</p>
                        </div>
                    </div>
                )}

                {/* Footer with confidence */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">Confiance:</span>
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                style={{ width: `${confidence}%` }}
                            />
                        </div>
                        <span className="text-xs text-white/60">{confidence}%</span>
                    </div>
                    <div className="text-xs text-white/30">
                        {cardName} • {setName}
                    </div>
                </div>
            </div>
        </SpotlightCard>
    )
}
