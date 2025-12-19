/**
 * Alerts Service - Supabase CRUD operations for user alerts
 */

import { createClient } from '@/lib/auth'

export type AlertType = 'price_above' | 'price_below' | 'score_change' | 'pump_detected' | 'drop_detected' | 'correction' | 'rebound'

export type Alert = {
    id: string
    user_id: string
    card_id?: string
    tcgdex_id: string
    card_name: string
    card_image: string | null
    alert_type: AlertType
    threshold_value: number
    current_value: number
    is_active: boolean
    triggered: boolean
    triggered_at?: string
    created_at: string
}

/**
 * Get all alerts for current user
 */
export async function getUserAlerts(): Promise<Alert[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching alerts:', error)
        return []
    }

    return data || []
}

/**
 * Create a new alert
 */
export async function createAlert(alert: {
    tcgdex_id: string
    card_name: string
    card_image: string | null
    alert_type: AlertType
    threshold_value: number
    current_value?: number
}): Promise<Alert | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('alerts')
        .insert({
            user_id: user.id,
            tcgdex_id: alert.tcgdex_id,
            card_name: alert.card_name,
            card_image: alert.card_image,
            alert_type: alert.alert_type,
            threshold_value: alert.threshold_value,
            current_value: alert.current_value || 0,
            is_active: true,
            triggered: false
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating alert:', error)
        return null
    }

    return data
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

    if (error) {
        console.error('Error deleting alert:', error)
        return false
    }

    return true
}

/**
 * Toggle alert active status
 */
export async function toggleAlert(alertId: string, isActive: boolean): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('alerts')
        .update({ is_active: isActive })
        .eq('id', alertId)

    if (error) {
        console.error('Error toggling alert:', error)
        return false
    }

    return true
}

/**
 * Mark alert as triggered
 */
export async function markAlertTriggered(alertId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('alerts')
        .update({
            triggered: true,
            triggered_at: new Date().toISOString()
        })
        .eq('id', alertId)

    if (error) {
        console.error('Error marking alert triggered:', error)
        return false
    }

    return true
}
