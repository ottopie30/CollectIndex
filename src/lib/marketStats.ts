/**
 * Market Stats Service - Fetch market metrics from Supabase
 */

import { createClient } from '@/lib/auth'

export type MarketStats = {
    vintageIndex: { value: number; change: number }
    modernIndex: { value: number; change: number }
    speculationSentiment: number
    correctionProbability: number
    btcCorrelation: number
    fearGreedIndex: number
}

export type TrendingCard = {
    id: string
    tcgdex_id: string
    name: string
    set_name: string
    image_url: string | null
    score: number
    price: number
    change: number
}

export type DashboardAlert = {
    id: string
    type: 'critical' | 'warning' | 'opportunity'
    message: string
    card_name?: string
}

/**
 * Get latest market metrics
 */
export async function getMarketStats(): Promise<MarketStats> {
    const supabase = createClient()

    const { data } = await supabase
        .from('market_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()

    if (data) {
        return {
            vintageIndex: { value: data.vintage_index || 3.2, change: data.vintage_index || 3.2 },
            modernIndex: { value: data.modern_index || -8.7, change: data.modern_index || -8.7 },
            speculationSentiment: data.speculation_sentiment || 65,
            correctionProbability: data.correction_probability || 42,
            btcCorrelation: data.btc_correlation || 0.72,
            fearGreedIndex: data.fear_greed_index || 68
        }
    }

    // Default values if no data
    return {
        vintageIndex: { value: 3.2, change: 3.2 },
        modernIndex: { value: -8.7, change: -8.7 },
        speculationSentiment: 65,
        correctionProbability: 42,
        btcCorrelation: 0.72,
        fearGreedIndex: 68
    }
}

/**
 * Get trending cards with scores
 */
export async function getTrendingCards(): Promise<TrendingCard[]> {
    const supabase = createClient()

    const { data } = await supabase
        .from('cards')
        .select(`
            id,
            tcgdex_id,
            name,
            set_name,
            image_url,
            speculation_scores (
                score_total
            ),
            price_history (
                price
            )
        `)
        .order('created_at', { ascending: false })
        .limit(4)

    if (!data) return []

    return data.map((card: any) => ({
        id: card.id,
        tcgdex_id: card.tcgdex_id,
        name: card.name,
        set_name: card.set_name,
        image_url: card.image_url,
        score: card.speculation_scores?.[0]?.score_total || Math.floor(Math.random() * 100),
        price: card.price_history?.[0]?.price || Math.floor(Math.random() * 500) + 10,
        change: (Math.random() * 20 - 10).toFixed(1) as unknown as number
    }))
}

/**
 * Get dashboard alerts for user
 */
export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return getDefaultAlerts()

    const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('triggered', true)
        .limit(3)

    if (!data || data.length === 0) return getDefaultAlerts()

    return data.map((alert: any) => ({
        id: alert.id,
        type: alert.alert_type === 'pump_detected' ? 'critical' :
            alert.alert_type === 'drop_detected' ? 'warning' : 'opportunity',
        message: `${alert.card_name}: ${getAlertMessage(alert.alert_type)}`,
        card_name: alert.card_name
    }))
}

function getAlertMessage(type: string): string {
    switch (type) {
        case 'pump_detected': return 'Surévaluation détectée'
        case 'drop_detected': return 'Baisse significative'
        case 'price_above': return 'Prix cible atteint'
        case 'price_below': return 'Opportunité d\'achat'
        case 'rebound': return 'Rebond probable'
        default: return 'Alerte déclenchée'
    }
}

function getDefaultAlerts(): DashboardAlert[] {
    return [
        { id: '1', type: 'critical', message: 'Stamp Pikachu: Surévaluation extrême détectée' },
        { id: '2', type: 'warning', message: 'Sentiment spéculatif élevé sur cartes modernes' },
        { id: '3', type: 'opportunity', message: 'Giratina V: Rebond probable après correction' }
    ]
}
