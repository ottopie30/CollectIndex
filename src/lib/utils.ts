import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ScoreColors {
  bg: string
  text: string
  label: string
  gradient: string
}

export function getScoreColor(score: number): ScoreColors {
  if (score >= 80) {
    return {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      label: 'Excellent',
      gradient: 'from-emerald-500 to-green-400'
    }
  } else if (score >= 60) {
    return {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400',
      label: 'Bon',
      gradient: 'from-cyan-500 to-blue-400'
    }
  } else if (score >= 40) {
    return {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      label: 'Moyen',
      gradient: 'from-amber-500 to-yellow-400'
    }
  } else if (score >= 20) {
    return {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      label: 'Faible',
      gradient: 'from-orange-500 to-red-400'
    }
  } else {
    return {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      label: 'Risqué',
      gradient: 'from-red-500 to-rose-400'
    }
  }
}

export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return 'N/A'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}
