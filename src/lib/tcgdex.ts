// TCGdex API integration for Pokemon card data
const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en'

export type TCGdexCard = {
    id: string
    localId: string
    name: string
    image?: string
    category?: string
    illustrator?: string
    rarity?: string
    set: {
        id: string
        name: string
        logo?: string
        symbol?: string
    }
    variants?: {
        firstEdition: boolean
        holo: boolean
        normal: boolean
        reverse: boolean
    }
    hp?: number
    types?: string[]
    stage?: string
}

export type TCGdexSet = {
    id: string
    name: string
    logo?: string
    symbol?: string
    cardCount: {
        total: number
        official: number
    }
}

export async function searchCards(query: string): Promise<TCGdexCard[]> {
    try {
        const response = await fetch(
            `${TCGDEX_API_BASE}/cards?name=${encodeURIComponent(query)}`
        )
        if (!response.ok) return []
        const data = await response.json()
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error('TCGdex search error:', error)
        return []
    }
}

export async function getCard(cardId: string): Promise<TCGdexCard | null> {
    try {
        const response = await fetch(`${TCGDEX_API_BASE}/cards/${cardId}`)
        if (!response.ok) return null
        return response.json()
    } catch (error) {
        console.error('TCGdex get card error:', error)
        return null
    }
}

export async function getAllSets(): Promise<TCGdexSet[]> {
    try {
        const response = await fetch(`${TCGDEX_API_BASE}/sets`)
        if (!response.ok) return []
        return response.json()
    } catch (error) {
        console.error('TCGdex get sets error:', error)
        return []
    }
}

export async function getSetCards(setId: string): Promise<TCGdexCard[]> {
    try {
        const response = await fetch(`${TCGDEX_API_BASE}/sets/${setId}`)
        if (!response.ok) return []
        const set = await response.json()
        return set.cards || []
    } catch (error) {
        console.error('TCGdex get set cards error:', error)
        return []
    }
}

export function getCardImageUrl(card: TCGdexCard, quality: 'low' | 'high' = 'high'): string {
    if (!card.image) {
        return '/placeholder-card.png'
    }
    return `${card.image}/${quality}.webp`
}
