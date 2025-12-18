// Price Database Service - Persists prices to Supabase
// Saves daily price snapshots and provides historical data

import { getSupabase } from './supabase'
import { getCardWithPrices, getBestMarketPrice, PokemonTCGCard } from './pokemontcg'

export type DbPriceRecord = {
    card_tcgdex_id: string
    card_name: string
    price: number
    currency: string
    source: 'cardmarket' | 'tcgplayer' | 'pokemontcg'
    recorded_at: string
}

// Save a single card price to database
export async function savePriceToDb(
    cardId: string,
    price: number,
    source: 'cardmarket' | 'tcgplayer' | 'pokemontcg',
    currency: string = 'EUR'
): Promise<boolean> {
    try {
        const supabase = getSupabase()

        // First, ensure the card exists in the cards table
        const { data: existingCard } = await supabase
            .from('cards')
            .select('id')
            .eq('tcgdex_id', cardId)
            .single()

        let dbCardId: string

        if (!existingCard) {
            // Fetch card details and create it
            const cardData = await getCardWithPrices(cardId)
            if (!cardData) {
                console.error(`Card ${cardId} not found in API`)
                return false
            }

            const { data: newCard, error: insertError } = await supabase
                .from('cards')
                .insert({
                    tcgdex_id: cardId,
                    name: cardData.name,
                    set_name: cardData.set?.name || 'Unknown',
                    set_id: cardData.set?.id || '',
                    rarity: cardData.rarity || 'Unknown',
                    image_url: cardData.images?.large || cardData.images?.small || null
                })
                .select('id')
                .single()

            if (insertError || !newCard) {
                console.error('Error inserting card:', insertError)
                return false
            }
            dbCardId = newCard.id
        } else {
            dbCardId = existingCard.id
        }

        // Insert price record
        const { error: priceError } = await supabase
            .from('price_history')
            .insert({
                card_id: dbCardId,
                price,
                currency,
                source,
                listing_type: 'sold',
                recorded_at: new Date().toISOString()
            })

        if (priceError) {
            console.error('Error inserting price:', priceError)
            return false
        }

        return true
    } catch (error) {
        console.error('Error saving price to DB:', error)
        return false
    }
}

// Batch save prices for multiple cards
export async function savePricesBatch(
    cards: PokemonTCGCard[]
): Promise<{ saved: number; failed: number }> {
    let saved = 0
    let failed = 0

    for (const card of cards) {
        const priceInfo = getBestMarketPrice(card)
        if (priceInfo) {
            const success = await savePriceToDb(
                card.id,
                priceInfo.price,
                priceInfo.source as 'cardmarket' | 'tcgplayer' | 'pokemontcg',
                priceInfo.source === 'cardmarket' ? 'EUR' : 'USD'
            )
            if (success) saved++
            else failed++
        } else {
            failed++
        }
    }

    return { saved, failed }
}

// Get price history from database
export async function getPriceHistoryFromDb(
    cardId: string,
    days: number = 90
): Promise<{ date: string; price: number; source: string }[]> {
    try {
        const supabase = getSupabase()

        // First get the card's DB ID
        const { data: card } = await supabase
            .from('cards')
            .select('id')
            .eq('tcgdex_id', cardId)
            .single()

        if (!card) {
            return []
        }

        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)

        const { data: prices, error } = await supabase
            .from('price_history')
            .select('price, source, recorded_at')
            .eq('card_id', card.id)
            .gte('recorded_at', fromDate.toISOString())
            .order('recorded_at', { ascending: true })

        if (error || !prices) {
            console.error('Error fetching price history:', error)
            return []
        }

        return prices.map(p => ({
            date: p.recorded_at.split('T')[0],
            price: p.price,
            source: p.source
        }))
    } catch (error) {
        console.error('Error getting price history from DB:', error)
        return []
    }
}

// Get latest price for a card from database
export async function getLatestPriceFromDb(cardId: string): Promise<number | null> {
    try {
        const supabase = getSupabase()

        const { data: card } = await supabase
            .from('cards')
            .select('id')
            .eq('tcgdex_id', cardId)
            .single()

        if (!card) return null

        const { data: price } = await supabase
            .from('price_history')
            .select('price')
            .eq('card_id', card.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single()

        return price?.price || null
    } catch {
        return null
    }
}
