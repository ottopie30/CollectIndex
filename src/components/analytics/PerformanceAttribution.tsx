'use client'

// Performance Attribution Component
// Shows contribution of each card to portfolio performance

import { useEffect, useState } from 'react'
import { PerformanceAttribution, calculatePerformanceAttribution } from '@/lib/analytics/advanced'
import { TrendingUp, TrendingDown } from 'lucide-react'

type PerformanceAttributionProps = {
    portfolioId: string
    startDate: Date
    endDate: Date
}

export function PerformanceAttributionChart({ portfolioId, startDate, endDate }: PerformanceAttributionProps) {
    const [attribution, setAttribution] = useState<PerformanceAttribution[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadAttribution() {
            setLoading(true)
            const data = await calculatePerformanceAttribution(portfolioId, startDate, endDate)
            setAttribution(data)
            setLoading(false)
        }

        loadAttribution()
    }, [portfolioId, startDate, endDate])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white/60">Calculating performance attribution...</div>
            </div>
        )
    }

    if (attribution.length === 0) {
        return (
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/60">No performance data available</p>
            </div>
        )
    }

    const maxContribution = Math.max(...attribution.map(a => Math.abs(a.contribution)))

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-2">Performance Attribution</h3>
            <p className="text-sm text-white/60 mb-6">
                Contribution of each card to total portfolio return
            </p>

            <div className="space-y-3">
                {attribution.map((attr, index) => {
                    const isPositive = attr.contribution >= 0
                    const barWidth = (Math.abs(attr.contribution) / maxContribution) * 100

                    return (
                        <div key={attr.cardId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-white/80 font-medium">{attr.cardName}</span>
                                    <span className="text-xs text-white/50">
                                        {attr.weight.toFixed(1)}% weight
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    </span>
                                    <span className="font-bold text-white">
                                        {attr.contribution >= 0 ? '+' : ''}{attr.contribution.toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                                <div
                                    className={`absolute top-0 h-full transition-all duration-300 flex items-center justify-end pr-3 ${isPositive
                                            ? 'left-1/2 bg-gradient-to-r from-green-500/30 to-green-500/60'
                                            : 'right-1/2 bg-gradient-to-l from-red-500/30 to-red-500/60'
                                        }`}
                                    style={{ width: `${barWidth / 2}%` }}
                                >
                                    <span className="text-xs text-white/80">
                                        {attr.returns >= 0 ? '+' : ''}{attr.returns.toFixed(1)}% return
                                    </span>
                                </div>
                                <div className="absolute left-1/2 top-0 w-px h-full bg-white/20"></div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between text-sm">
                <div>
                    <span className="text-white/60">Top Contributor: </span>
                    <span className="text-green-400 font-bold">
                        {attribution[0]?.cardName} (+{attribution[0]?.contribution.toFixed(2)}%)
                    </span>
                </div>
                <div>
                    <span className="text-white/60">Bottom: </span>
                    <span className="text-red-400 font-bold">
                        {attribution[attribution.length - 1]?.cardName} ({attribution[attribution.length - 1]?.contribution.toFixed(2)}%)
                    </span>
                </div>
            </div>
        </div>
    )
}
