'use client'

// Correlation Heatmap Component
// Displays correlation matrix between portfolio cards

import { useEffect, useState } from 'react'
import { calculateCorrelationMatrix } from '@/lib/analytics/advanced'

type CorrelationHeatmapProps = {
    cardIds: string[]
    cardNames: Map<string, string>
}

export function CorrelationHeatmap({ cardIds, cardNames }: CorrelationHeatmapProps) {
    const [matrix, setMatrix] = useState<Map<string, Map<string, number>> | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadCorrelations() {
            setLoading(true)
            const corrMatrix = await calculateCorrelationMatrix(cardIds, 90)
            setMatrix(corrMatrix)
            setLoading(false)
        }

        if (cardIds.length > 1) {
            loadCorrelations()
        }
    }, [cardIds])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white/60">Calculating correlations...</div>
            </div>
        )
    }

    if (!matrix || cardIds.length < 2) {
        return (
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/60">Need at least 2 cards to show correlations</p>
            </div>
        )
    }

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Correlation Heatmap</h3>
            <p className="text-sm text-white/60 mb-6">
                Correlations between your cards (90 days)
            </p>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {cardIds.map(id => (
                                <th key={id} className="p-2 text-xs text-white/80 rotate-[-45deg] origin-bottom-left">
                                    <div className="w-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {cardNames.get(id)?.substring(0, 8) || id.substring(0, 8)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cardIds.map((id1, i) => (
                            <tr key={id1}>
                                <td className="p-2 text-xs text-white/80 font-medium">
                                    {cardNames.get(id1) || id1}
                                </td>
                                {cardIds.map((id2, j) => {
                                    const corr = matrix.get(id1)?.get(id2) || 0
                                    const color = getCorrelationColor(corr)

                                    return (
                                        <td
                                            key={id2}
                                            className="p-1"
                                            title={`${cardNames.get(id1)} vs ${cardNames.get(id2)}: ${corr.toFixed(2)}`}
                                        >
                                            <div
                                                className="w-12 h-12 rounded flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                                                style={{
                                                    backgroundColor: color.bg,
                                                    color: color.text
                                                }}
                                            >
                                                {corr.toFixed(2)}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 text-sm">
                <span className="text-white/60">Correlation:</span>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(220, 38, 38)' }}></div>
                    <span className="text-white/80">Strong Negative</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(156, 163, 175)' }}></div>
                    <span className="text-white/80">Weak</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
                    <span className="text-white/80">Strong Positive</span>
                </div>
            </div>
        </div>
    )
}

// Helper: Get color based on correlation value
function getCorrelationColor(corr: number): { bg: string; text: string } {
    if (corr >= 0.7) {
        return { bg: 'rgb(34, 197, 94)', text: 'rgb(255, 255, 255)' } // Strong positive - green
    } else if (corr >= 0.3) {
        return { bg: 'rgb(134, 239, 172)', text: 'rgb(0, 0, 0)' } // Moderate positive - light green
    } else if (corr >= -0.3) {
        return { bg: 'rgb(156, 163, 175)', text: 'rgb(0, 0, 0)' } // Weak - gray
    } else if (corr >= -0.7) {
        return { bg: 'rgb(252, 165, 165)', text: 'rgb(0, 0, 0)' } // Moderate negative - light red
    } else {
        return { bg: 'rgb(220, 38, 38)', text: 'rgb(255, 255, 255)' } // Strong negative - red
    }
}
