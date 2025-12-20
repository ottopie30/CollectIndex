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
        d1: number  // Volatility
        d2: number  // Growth
        d3: number  // Scarcity  
        d4: number  // Sentiment
        d5: number  // Macro
    }
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

    // Calculate hybrid score (Technical + AI average)
    const hybridScore = useMemo(() => {
        if (!aiScores) return speculationScore
        const aiAvg = (aiScores.volatility + aiScores.growth + aiScores.scarcity + aiScores.sentiment + aiScores.macro) / 5
        return Math.round((speculationScore + aiAvg) / 2)
    }, [speculationScore, aiScores])

    // Final recommendation based on all factors
    const recommendation = useMemo(() => {
        const signals = {
            bullish: 0,
            bearish: 0,
            neutral: 0
        }

        // Speculation score signal
        if (speculationScore >= 70) signals.bullish += 2
        else if (speculationScore >= 50) signals.bullish += 1
        else if (speculationScore <= 30) signals.bearish += 2
        else signals.neutral += 1

        // Price momentum signal
        if (priceChange >= 10) signals.bullish += 1
        else if (priceChange <= -10) signals.bearish += 1
        else signals.neutral += 1

        // Rebound score signal
        if (rebondScore >= 70) signals.bullish += 2
        else if (rebondScore <= 30) signals.bearish += 1
        else signals.neutral += 1

        // AI verdict signal
        if (aiVerdict?.toLowerCase().includes('buy') || aiVerdict?.toLowerCase().includes('achat')) signals.bullish += 2
        else if (aiVerdict?.toLowerCase().includes('sell') || aiVerdict?.toLowerCase().includes('vente')) signals.bearish += 2
        else signals.neutral += 1

        // Determine final recommendation
        if (signals.bullish >= 5) return { type: 'STRONG_BUY', label: 'Achat Fort', color: 'emerald', icon: CheckCircle2 }
        if (signals.bullish >= 3) return { type: 'BUY', label: 'Achat', color: 'green', icon: TrendingUp }
        if (signals.bearish >= 5) return { type: 'STRONG_SELL', label: 'Vente Forte', color: 'red', icon: XCircle }
        if (signals.bearish >= 3) return { type: 'SELL', label: 'Vente', color: 'orange', icon: TrendingDown }
        return { type: 'HOLD', label: 'Conserver', color: 'amber', icon: AlertTriangle }
    }, [speculationScore, priceChange, rebondScore, aiVerdict])

    // Risk level
    const riskLevel = useMemo(() => {
        const volatility = dimensions.d1
        if (volatility >= 70) return { label: 'Faible', color: 'emerald' }
        if (volatility >= 40) return { label: 'Modéré', color: 'amber' }
        return { label: 'Élevé', color: 'red' }
    }, [dimensions.d1])

    // Confidence level based on data completeness
    const confidence = useMemo(() => {
        let score = 50
        if (aiScores) score += 25
        if (rebondScore !== 50) score += 15
        if (price > 0) score += 10
        return Math.min(score, 100)
    }, [aiScores, rebondScore, price])

    const RecommendationIcon = recommendation.icon

    return (
        <SpotlightCard
            className="!p-0 overflow-hidden"
            spotlightColor={`rgba(${recommendation.color === 'emerald' ? '16, 185, 129' : recommendation.color === 'red' ? '239, 68, 68' : '245, 158, 11'}, 0.3)`}
        >
            {/* Header with gradient */}
            <div className={`p-6 bg-gradient-to-r ${recommendation.color === 'emerald' ? 'from-emerald-500/20 to-green-500/10' :
                    recommendation.color === 'red' ? 'from-red-500/20 to-orange-500/10' :
                        'from-amber-500/20 to-yellow-500/10'
                } border-b border-white/10`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-${recommendation.color}-500/20`}>
                            <Target className={`w-6 h-6 text-${recommendation.color}-400`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Synthèse Globale</h3>
                            <p className="text-sm text-white/50">Analyse complète multi-facteurs</p>
                        </div>
                    </div>

                    {/* Main verdict badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${recommendation.color}-500/20 border border-${recommendation.color}-500/30`}>
                        <RecommendationIcon className={`w-5 h-5 text-${recommendation.color}-400`} />
                        <span className={`font-bold text-${recommendation.color}-400`}>{recommendation.label}</span>
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
                        <div className={`text-3xl font-bold text-${riskLevel.color}-400`}>{riskLevel.label}</div>
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
                            const color = dim.value >= 60 ? 'emerald' : dim.value >= 40 ? 'amber' : 'red'
                            return (
                                <div key={dim.name} className="text-center">
                                    <div className="relative h-16 bg-white/5 rounded-lg overflow-hidden">
                                        <div
                                            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-${color}-500/50 to-${color}-500/20`}
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
                        <span className="text-xs text-white/40">Confiance analyse:</span>
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
