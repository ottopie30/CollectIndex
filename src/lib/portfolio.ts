/**
 * Portfolio Service - Supabase CRUD operations for user portfolios
 */

import { createClient } from '@/lib/auth'

export type PortfolioItem = {
    id: string
    portfolio_id: string
    card_id: string
    tcgdex_id: string
    name: string
    set_name: string
    image_url: string | null
    quantity: number
    purchase_price: number
    current_price: number
    score: number
    created_at: string
}

export type Portfolio = {
    id: string
    user_id: string
    name: string
    is_default: boolean
    created_at: string
}

/**
 * Get or create default portfolio for user
 */
export async function getOrCreateDefaultPortfolio(): Promise<Portfolio | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Check for existing default portfolio
    const { data: existing } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

    if (existing) return existing

    // Create default portfolio
    const { data: newPortfolio, error } = await supabase
        .from('portfolios')
        .insert({
            user_id: user.id,
            name: 'Mon Portfolio',
            is_default: true
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating portfolio:', error)
        return null
    }

    return newPortfolio
}

/**
 * Get all items in a portfolio
 */
export async function getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching portfolio items:', error)
        return []
    }

    return data || []
}

/**
 * Add a card to the portfolio
 */
export async function addCardToPortfolio(
    portfolioId: string,
    card: {
        tcgdex_id: string
        name: string
        set_name: string
        image_url: string | null
        quantity?: number
        purchase_price?: number
        current_price?: number
        score?: number
    }
): Promise<PortfolioItem | null> {
    const supabase = createClient()

    // Check if card already exists in portfolio
    const { data: existing } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('tcgdex_id', card.tcgdex_id)
        .single()

    if (existing) {
        // Update quantity
        const { data, error } = await supabase
            .from('portfolio_items')
            .update({ quantity: existing.quantity + (card.quantity || 1) })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating portfolio item:', error)
            return null
        }
        return data
    }

    // Insert new item
    const { data, error } = await supabase
        .from('portfolio_items')
        .insert({
            portfolio_id: portfolioId,
            tcgdex_id: card.tcgdex_id,
            name: card.name,
            set_name: card.set_name,
            image_url: card.image_url,
            quantity: card.quantity || 1,
            purchase_price: card.purchase_price || 0,
            current_price: card.current_price || 0,
            score: card.score || 50
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding to portfolio:', error)
        return null
    }

    return data
}

/**
 * Remove a card from the portfolio
 */
export async function removeCardFromPortfolio(itemId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        console.error('Error removing from portfolio:', error)
        return false
    }

    return true
}

/**
 * Update item quantity
 */
export async function updatePortfolioItemQuantity(itemId: string, quantity: number): Promise<boolean> {
    const supabase = createClient()

    if (quantity < 1) {
        return removeCardFromPortfolio(itemId)
    }

    const { error } = await supabase
        .from('portfolio_items')
        .update({ quantity })
        .eq('id', itemId)

    if (error) {
        console.error('Error updating quantity:', error)
        return false
    }

    return true
}

/**
 * Update item purchase price
 */
export async function updatePortfolioItemPrice(itemId: string, purchasePrice: number): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('portfolio_items')
        .update({ purchase_price: purchasePrice })
        .eq('id', itemId)

    if (error) {
        console.error('Error updating price:', error)
        return false
    }

    return true
}
