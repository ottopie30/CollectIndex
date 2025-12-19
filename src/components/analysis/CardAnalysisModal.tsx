'use client'

import React from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import {
    TrendingUp,
    Shield,
    Zap,
    Brain,
    Globe,
    X,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    Info
} from 'lucide-react'
import Image from 'next/image'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { AnalyzedCard } from '@/app/analysis/page'

type CardAnalysisModalProps = {
    card: AnalyzedCard
    onClose: () => void
}

export function CardAnalysisModal({ card, onClose }: CardAnalysisModalProps) {
    // Generate simulated historical data seeded by card ID to be consistent
    const historyData = React.useMemo(() => {
        const data = []
        let price = card.estimatedValue
        // Seed randomness
        const seed = card.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)

        for (let i = 30; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const random = Math.sin(seed + i) * 0.5 + 0.5 // 0-1 deterministic
            const volatility = card.isVintage ? 0.02 : 0.05
            price = price * (1 + (random - 0.5) * volatility)

            data.push({
                date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                price: Math.max(0, price)
            })
        }
        // Ensure last point matches current value
        data[data.length - 1].price = card.estimatedValue
        return data
    }, [card])

    const dimensions = [
        {
            id: 'd1',
            label: 'Volatilité',
            score: card.isVintage ? 20 : 70,
            icon: TrendingUp,
            color: 'blue',
            desc: card.isVintage ? 'Faible volatilité (Stable)' : 'Volatilité élevée (Risqué)'
        },
        {
            id: 'd2',
            label: 'Croissance',
            score: card.score > 60 ? 80 : 40,
            icon: Zap,
            color: 'purple',
            desc: card.score > 60 ? 'Croissance spéculative détectée' : 'Croissance organique'
        },
        {
            id: 'd3',
            label: 'Scarcité',
            score: card.isVintage ? 85 : 30,
            icon: Shield,
            color: 'amber',
            desc: card.isVintage ? 'Forte rareté (Vintage)' : 'Offre abondante (Moderne)'
        },
        {
            id: 'd4',
            label: 'Sentiment',
            score: card.score > 50 ? 75 : 40,
            icon: Brain,
            color: 'pink',
            desc: card.score > 50 ? 'Hype sociale élevée' : 'Intérêt modéré'
        },
        {
            id: 'd5',
            label: 'Macro',
            score: 65,
            icon: Globe,
            color: 'cyan',
            desc: 'Risque de marché moyen'
        },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl custom-scrollbar">

                {/* Header with Image Background */}
                <div className="relative h-48 sm:h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a2e] z-10" />
                    <Image
                        src={card.imageUrl}
                        alt={card.name}
                        fill
                        className="object-cover opacity-20 blur-md"
                        unoptimized
                    />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex items-end justify-between">
                        <div className="flex items-end gap-4 sm:gap-6">
                            <div className="relative w-24 h-32 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#12121a]">
                                <Image
                                    src={card.imageUrl}
                                    alt={card.name}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            <div className="mb-2">
                                <span className={`inline-block px-2 py-0.5 rounded textxs font-bold mb-2 border ${card.isVintage
                                        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                                        : 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
                                    }`}>
                                    {card.isVintage ? 'VINTAGE' : 'MODERNE'}
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-1">{card.name}</h2>
                                <p className="text-white/60 text-sm sm:text-base">{card.setName} • {card.rarity}</p>
                            </div>
                        </div>

                        <div className="hidden sm:block text-right mb-4">
                            <p className="text-white/40 text-sm mb-1">Prix Estimé</p>
                            <p className="text-3xl font-bold text-white">${card.estimatedValue}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Stats & Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Price Chart */}
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                    Historique Prix (30j)
                                </h3>
                                <span className="text-emerald-400 font-mono font-bold">+{(Math.random() * 10).toFixed(1)}%</span>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#ffffff40"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#ffffff40"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#ffffff20', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#ffffff60' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Analysis Text */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-400" />
                                Analyse Détaillée
                            </h3>
                            <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                                {card.analysisText}
                                <br /><br />
                                {card.isVintage ? (
                                    "Cette carte bénéficie d'une forte stabilité due à son âge. La population PSA 10 est probablement faible, ce qui drive la valeur à long terme. C'est un actif de conservation de valeur."
                                ) : (
                                    "La valeur de cette carte est fortement corrélée à la méta actuelle et au volume d'ouverture des boosters récents. Attention à la volatilité à court terme."
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: 5D Score Breakdown */}
                    <div className="space-y-4">
                        <div className="glass rounded-xl p-6 text-center bg-gradient-to-b from-white/5 to-transparent">
                            <p className="text-white/50 text-sm mb-2">SCORE SPÉCULATION</p>
                            <div className="flex justify-center mb-2">
                                <ScoreGauge score={card.score} size="lg" />
                            </div>
                            <p className={`font-bold ${card.score < 30 ? 'text-emerald-400' :
                                    card.score < 60 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {card.score < 30 ? 'INVESTISSEMENT SOLIDE' :
                                    card.score < 60 ? 'SPÉCULATION MODÉRÉE' : 'FORT RISQUE SPÉCULATIF'}
                            </p>
                        </div>

                        <div className="glass rounded-xl p-6 space-y-4">
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Détail des Dimensions</h4>
                            {dimensions.map((dim) => {
                                const Icon = dim.icon
                                return (
                                    <div key={dim.id} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Icon className={`w-4 h-4 text-${dim.color}-400`} />
                                                <span>{dim.label}</span>
                                            </div>
                                            <span className="font-bold text-white">{dim.score}/100</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-${dim.color}-500 rounded-full transition-all duration-500`}
                                                style={{ width: `${dim.score}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/40">{dim.desc}</p>
                                    </div>
                                )
                            })}
                        </div>

                        <a
                            href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + ' ' + card.rarity)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full p-3 bg-[#0063D1] hover:bg-[#0052ad] text-white rounded-xl font-bold transition-colors"
                        >
                            Voir sur eBay <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
