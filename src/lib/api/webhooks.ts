// Webhooks Service
// Manages webhook subscriptions and event delivery

import { getSupabase } from '../supabase'

export type WebhookEvent =
    | 'price_change'
    | 'score_update'
    | 'rebond_detected'
    | 'alert_triggered'

export type Webhook = {
    id: string
    userId: string
    url: string
    events: WebhookEvent[]
    secret: string | null
    isActive: boolean
    createdAt: string
    lastCalledAt: string | null
    failCount: number
}

export type WebhookPayload = {
    event: WebhookEvent
    timestamp: string
    data: Record<string, unknown>
}

// Create HMAC signature for webhook payload
export function signPayload(payload: string, secret: string): string {
    // Simple signature for demo - use crypto.subtle.sign in production
    let hash = 0
    const combined = payload + secret
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return 'sha256=' + Math.abs(hash).toString(16).padStart(16, '0')
}

// Create a new webhook
export async function createWebhook(
    userId: string,
    url: string,
    events: WebhookEvent[],
    secret?: string
): Promise<Webhook | null> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('webhooks')
            .insert({
                user_id: userId,
                url,
                events,
                secret: secret || null,
                is_active: true,
                fail_count: 0
            })
            .select()
            .single()

        if (error || !data) {
            console.error('Error creating webhook:', error)
            return null
        }

        return {
            id: data.id,
            userId: data.user_id,
            url: data.url,
            events: data.events,
            secret: data.secret,
            isActive: data.is_active,
            createdAt: data.created_at,
            lastCalledAt: data.last_called_at,
            failCount: data.fail_count
        }
    } catch (error) {
        console.error('Error creating webhook:', error)
        return null
    }
}

// Get webhooks for a user
export async function getUserWebhooks(userId: string): Promise<Webhook[]> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('webhooks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error || !data) {
            return []
        }

        return data.map(w => ({
            id: w.id,
            userId: w.user_id,
            url: w.url,
            events: w.events,
            secret: w.secret,
            isActive: w.is_active,
            createdAt: w.created_at,
            lastCalledAt: w.last_called_at,
            failCount: w.fail_count
        }))
    } catch {
        return []
    }
}

// Delete a webhook
export async function deleteWebhook(webhookId: string, userId: string): Promise<boolean> {
    try {
        const supabase = getSupabase()

        const { error } = await supabase
            .from('webhooks')
            .delete()
            .eq('id', webhookId)
            .eq('user_id', userId)

        return !error
    } catch {
        return false
    }
}

// Deliver event to a single webhook
async function deliverToWebhook(
    webhook: Webhook,
    payload: WebhookPayload
): Promise<boolean> {
    try {
        const body = JSON.stringify(payload)
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': payload.event,
            'X-Webhook-Timestamp': payload.timestamp
        }

        // Add signature if secret is configured
        if (webhook.secret) {
            headers['X-Webhook-Signature'] = signPayload(body, webhook.secret)
        }

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        if (!response.ok) {
            console.error(`Webhook ${webhook.id} failed: ${response.status}`)
            return false
        }

        // Update last called time
        const supabase = getSupabase()
        await supabase
            .from('webhooks')
            .update({
                last_called_at: new Date().toISOString(),
                fail_count: 0
            })
            .eq('id', webhook.id)

        return true
    } catch (error) {
        console.error(`Webhook ${webhook.id} error:`, error)

        // Increment fail count
        const supabase = getSupabase()
        await supabase
            .from('webhooks')
            .update({
                fail_count: webhook.failCount + 1,
                is_active: webhook.failCount + 1 < 5 // Disable after 5 failures
            })
            .eq('id', webhook.id)

        return false
    }
}

// Dispatch event to all subscribed webhooks
export async function dispatchEvent(
    event: WebhookEvent,
    data: Record<string, unknown>,
    userIds?: string[]
): Promise<{ sent: number; failed: number }> {
    try {
        const supabase = getSupabase()

        // Get all active webhooks subscribed to this event
        let query = supabase
            .from('webhooks')
            .select('*')
            .eq('is_active', true)
            .contains('events', [event])

        if (userIds && userIds.length > 0) {
            query = query.in('user_id', userIds)
        }

        const { data: webhooks, error } = await query

        if (error || !webhooks) {
            return { sent: 0, failed: 0 }
        }

        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data
        }

        // Deliver to all webhooks in parallel
        const results = await Promise.all(
            webhooks.map(w => deliverToWebhook({
                id: w.id,
                userId: w.user_id,
                url: w.url,
                events: w.events,
                secret: w.secret,
                isActive: w.is_active,
                createdAt: w.created_at,
                lastCalledAt: w.last_called_at,
                failCount: w.fail_count
            }, payload))
        )

        const sent = results.filter(r => r).length
        const failed = results.filter(r => !r).length

        return { sent, failed }
    } catch (error) {
        console.error('Error dispatching event:', error)
        return { sent: 0, failed: 0 }
    }
}
