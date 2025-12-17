'use client'

import { getScoreColor } from '@/lib/utils'

interface ScoreGaugeProps {
    score: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
}

export function ScoreGauge({ score, size = 'md', showLabel = true }: ScoreGaugeProps) {
    const { bg, text, label, gradient } = getScoreColor(score)

    const sizeClasses = {
        sm: 'w-16 h-16 text-lg',
        md: 'w-24 h-24 text-2xl',
        lg: 'w-32 h-32 text-3xl'
    }

    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`relative ${sizeClasses[size]}`}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-white/10"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" className={`stop-color: currentColor`} style={{ stopColor: score < 30 ? '#10b981' : score < 60 ? '#f59e0b' : '#ef4444' }} />
                            <stop offset="100%" className={`stop-color: currentColor`} style={{ stopColor: score < 30 ? '#22c55e' : score < 60 ? '#f97316' : '#e11d48' }} />
                        </linearGradient>
                    </defs>
                </svg>
                {/* Score number */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-bold ${text}`}>{score}</span>
                </div>
            </div>
            {showLabel && (
                <div className={`px-3 py-1 rounded-full ${bg} ${text} text-sm font-medium`}>
                    {label}
                </div>
            )}
        </div>
    )
}
