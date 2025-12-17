import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Get score color based on speculation score
 * 0-30: Green (Investment)
 * 30-60: Orange (Transition)
 * 60-100: Red (Speculation)
 */
export function getScoreColor(score: number): {
    bg: string
    text: string
    label: string
    gradient: string
} {
    if (score < 30) {
        return {
            bg: 'bg-white/20',
            text: 'text-white',
            label: 'Investissement',
            gradient: 'from-white to-white/70'
        }
    }
    if (score < 60) {
        return {
            bg: 'bg-white/10',
            text: 'text-white/80',
            label: 'Transition',
            gradient: 'from-white/80 to-white/50'
        }
    }
    return {
        bg: 'bg-white/5',
        text: 'text-white/60',
        label: 'Spéculation',
        gradient: 'from-white/60 to-white/30'
    }
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency
    }).format(price)
}

/**
 * Format percentage change
 */
export function formatChange(change: number): string {
    const prefix = change >= 0 ? '+' : ''
    return `${prefix}${change.toFixed(2)}%`
}

/**
 * Format large numbers (k, M, B)
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
    return num.toString()
}
