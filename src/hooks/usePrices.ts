'use client'

import { useState, useEffect, useCallback } from 'react'
import { PriceData, PriceHistory } from '@/lib/prices'

type UsePriceResult = {
    price: PriceData | null
    history: PriceHistory[]
    isLoading: boolean
    error: string | null
    refetch: () => void
}

type UsePricesResult = {
    prices: Map<string, PriceData>
    isLoading: boolean
    error: string | null
    refetch: () => void
}

// Hook for single card price
export function usePrice(cardId: string, includeHistory = false): UsePriceResult {
    const [price, setPrice] = useState<PriceData | null>(null)
    const [history, setHistory] = useState<PriceHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrice = useCallback(async () => {
        if (!cardId) return

        setIsLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({ cardId })
            if (includeHistory) params.append('history', 'true')

            const response = await fetch(`/api/prices?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch price')
            }

            const data = await response.json()
            setPrice(data)

            if (data.history) {
                setHistory(data.history)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsLoading(false)
        }
    }, [cardId, includeHistory])

    useEffect(() => {
        fetchPrice()
    }, [fetchPrice])

    return {
        price,
        history,
        isLoading,
        error,
        refetch: fetchPrice
    }
}

// Hook for multiple card prices
export function usePrices(cardIds: string[]): UsePricesResult {
    const [prices, setPrices] = useState<Map<string, PriceData>>(new Map())
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrices = useCallback(async () => {
        if (cardIds.length === 0) {
            setPrices(new Map())
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/prices?cardIds=${cardIds.join(',')}`)

            if (!response.ok) {
                throw new Error('Failed to fetch prices')
            }

            const data = await response.json()
            setPrices(new Map(Object.entries(data.prices)))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsLoading(false)
        }
    }, [cardIds])

    useEffect(() => {
        fetchPrices()
    }, [fetchPrices])

    return {
        prices,
        isLoading,
        error,
        refetch: fetchPrices
    }
}

// Helper to get best price from PriceData
export function getBestPrice(priceData: PriceData | null): number {
    if (!priceData) return 0

    // Prefer CardMarket trend price, fallback to TCGPlayer market
    return priceData.prices.cardmarket?.trendPrice
        || priceData.prices.tcgplayer?.market
        || 0
}

// Format relative time
export function formatLastUpdated(isoString: string): string {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`
    return `Il y a ${Math.floor(diffMins / 1440)}j`
}
