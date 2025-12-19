
import { useEffect, useState } from 'react'
import { Sparkles, Bot, AlertTriangle } from 'lucide-react'

interface AiInsightProps {
    cardName: string
    price: number
    trend: number
    scores: any
}

interface AiResponse {
    analysis: {
        context: string
        diagnosis: string
        verdict: string
    }
    scores: {
        volatility: number
        growth: number
        scarcity: number
        sentiment: number
        macro: number
    }
}

export function AiInsight({ cardName, price, trend, scores }: AiInsightProps) {
    const [data, setData] = useState<AiResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let mounted = true
        async function fetchAnalysis() {
            try {
                const res = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardName, price, trend, scores })
                })
                const json = await res.json()

                if (mounted) {
                    if (json.analysis && json.scores) {
                        setData(json)
                    } else {
                        setError(true)
                    }
                    setLoading(false)
                }
            } catch (e) {
                if (mounted) {
                    setError(true)
                    setLoading(false)
                }
            }
        }
        setTimeout(fetchAnalysis, 500)
        return () => { mounted = false }
    }, [cardName, price, trend, scores])

    if (error) return null

    // Calculate Hybrid Score if data is ready
    const aiAverage = data ? (
        data.scores.volatility +
        data.scores.growth +
        data.scores.scarcity +
        data.scores.sentiment +
        data.scores.macro
    ) / 5 : 0

    // Hybrid = (Technical Total + AI Average) / 2
    const hybridScore = data ? Math.round((scores.total + aiAverage) / 2) : 0

    return (
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 opacity-50" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 shadow-lg shadow-cyan-500/20">
                        {loading ? (
                            <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
                        ) : (
                            <Bot className="w-6 h-6 text-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Gemini 3.0 Flash
                            <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                                HYBRID ENGINE
                            </span>
                        </h3>
                        <p className="text-sm text-gray-400">Analyse Qualitative & Quantitative</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-20 bg-white/5 rounded-xl" />
                        <div className="h-40 bg-white/5 rounded-xl" />
                    </div>
                ) : data && (
                    <div className="space-y-6">
                        {/* Hybrid Score Card */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Score Hybride (Tech + IA)</p>
                                <div className="text-3xl font-bold text-white">
                                    {hybridScore} <span className="text-sm font-normal text-gray-500">/ 100</span>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-lg font-bold ${data.analysis.verdict.toLowerCase().includes('buy') ? 'bg-green-500/20 text-green-400' :
                                    data.analysis.verdict.toLowerCase().includes('sell') ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {data.analysis.verdict}
                            </div>
                        </div>

                        {/* Analysis Text */}
                        <div className="prose prose-invert prose-sm">
                            <p><strong className="text-cyan-400">Contexte:</strong> {data.analysis.context}</p>
                            <p><strong className="text-cyan-400">Diagnostic:</strong> {data.analysis.diagnosis}</p>
                        </div>

                        {/* 5 Dimensions Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(data.scores).map(([key, value]) => (
                                <div key={key} className="bg-black/20 p-3 rounded-lg">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1 capitalize">
                                        {key}
                                        <span className="text-white font-mono">{value}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 rounded-full"
                                            style={{ width: `${value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
