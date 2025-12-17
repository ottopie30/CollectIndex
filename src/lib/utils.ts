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
            bg: 'bg-emerald-500/20',
            text: 'text-emerald-400',
            label: 'Investissement',
            gradient: 'from-emerald-500 to-green-500'
        }
    }
    if (score < 60) {
        return {
            bg: 'bg-amber-500/20',
            text: 'text-amber-400',
            label: 'Transition',
            gradient: 'from-amber-500 to-orange-500'
        }
    }
    return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        label: 'Spéculation',
        gradient: 'from-red-500 to-rose-600'
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
