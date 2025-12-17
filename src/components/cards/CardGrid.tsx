'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ScoreGauge } from './ScoreGauge'
import { getScoreColor, formatPrice } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface CardGridItemProps {
    card: {
        id: string
        name: string
        set_name: string
        image_url?: string
        rarity?: string
        grade?: string
    }
    score?: number
    price?: number
    priceChange?: number
}

export function CardGridItem({ card, score = 50, price, priceChange }: CardGridItemProps) {
    const scoreColors = getScoreColor(score)

    return (
        <Link href={`/cards/${card.id}`}>
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${scoreColors.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

                {/* Score badge */}
                <div className="absolute -top-2 -right-2 z-10">
                    <div className={`w-10 h-10 rounded-full ${scoreColors.bg} border border-white/20 flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${scoreColors.text}`}>{score}</span>
                    </div>
                </div>

                {/* Card image */}
                <div className="relative aspect-[63/88] mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                    {card.image_url ? (
                        <Image
                            src={card.image_url}
                            alt={card.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/30">
                            <span className="text-4xl">?</span>
                        </div>
                    )}

                    {/* Grade badge */}
                    {card.grade && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs font-bold text-yellow-400">
                            PSA {card.grade}
                        </div>
                    )}
                </div>

                {/* Card info */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                        {card.name}
                    </h3>
                    <p className="text-sm text-white/50 truncate">{card.set_name}</p>

                    {/* Price and change */}
                    {price !== undefined && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="font-bold text-white">{formatPrice(price)}</span>
                            {priceChange !== undefined && (
                                <div className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Warning for high speculation */}
                    {score >= 70 && (
                        <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-xs text-red-400">Spéculation élevée</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}

interface CardGridProps {
    cards: CardGridItemProps['card'][]
    scores?: Record<string, number>
    prices?: Record<string, { price: number; change: number }>
}

export function CardGrid({ cards, scores = {}, prices = {} }: CardGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {cards.map((card) => (
                <CardGridItem
                    key={card.id}
                    card={card}
                    score={scores[card.id] ?? 50}
                    price={prices[card.id]?.price}
                    priceChange={prices[card.id]?.change}
                />
            ))}
        </div>
    )
}
