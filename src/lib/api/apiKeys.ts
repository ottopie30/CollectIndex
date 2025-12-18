// API Key Management Service
// Validates API keys and returns user tier

import { getSupabase } from '../supabase'
import { RateLimitTier } from './rateLimit'

export type ApiKeyInfo = {
    id: string
    userId: string
    tier: RateLimitTier
    name: string
    isActive: boolean
    createdAt: string
    lastUsedAt: string | null
}

// Cache for API keys (TTL 5 minutes)
const apiKeyCache = new Map<string, { info: ApiKeyInfo | null; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Validate an API key and return its info
export async function validateApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
    // Check cache first
    const cached = apiKeyCache.get(apiKey)
    if (cached && cached.expiry > Date.now()) {
        return cached.info
    }

    try {
        const supabase = getSupabase()

        // Hash the API key for lookup (in production, store hashed keys)
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('key_hash', hashApiKey(apiKey))
            .eq('is_active', true)
            .single()

        if (error || !data) {
            // Cache negative result
            apiKeyCache.set(apiKey, { info: null, expiry: Date.now() + CACHE_TTL })
            return null
        }

        const info: ApiKeyInfo = {
            id: data.id,
            userId: data.user_id,
            tier: data.tier as RateLimitTier,
            name: data.name,
            isActive: data.is_active,
            createdAt: data.created_at,
            lastUsedAt: data.last_used_at
        }

        // Cache positive result
        apiKeyCache.set(apiKey, { info, expiry: Date.now() + CACHE_TTL })

        // Update last used timestamp (fire and forget)
        supabase
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', data.id)
            .then(() => { })

        return info
    } catch (error) {
        console.error('Error validating API key:', error)
        return null
    }
}

// Generate a new API key
export function generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const prefix = 'altum_'
    let key = prefix

    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return key
}

// Hash an API key for storage
export function hashApiKey(apiKey: string): string {
    // Simple hash for demo - use crypto.subtle.digest in production
    let hash = 0
    for (let i = 0; i < apiKey.length; i++) {
        const char = apiKey.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return 'hash_' + Math.abs(hash).toString(16)
}

// Create a new API key for a user
export async function createApiKey(
    userId: string,
    name: string,
    tier: RateLimitTier = 'free'
): Promise<{ key: string; info: ApiKeyInfo } | null> {
    try {
        const supabase = getSupabase()
        const key = generateApiKey()
        const keyHash = hashApiKey(key)

        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                user_id: userId,
                key_hash: keyHash,
                name,
                tier,
                is_active: true
            })
            .select()
            .single()

        if (error || !data) {
            console.error('Error creating API key:', error)
            return null
        }

        return {
            key, // Only time we return the actual key
            info: {
                id: data.id,
                userId: data.user_id,
                tier: data.tier,
                name: data.name,
                isActive: data.is_active,
                createdAt: data.created_at,
                lastUsedAt: null
            }
        }
    } catch (error) {
        console.error('Error creating API key:', error)
        return null
    }
}

// Revoke an API key
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
        const supabase = getSupabase()

        const { error } = await supabase
            .from('api_keys')
            .update({ is_active: false })
            .eq('id', keyId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error revoking API key:', error)
            return false
        }

        // Clear from cache
        for (const [key, value] of apiKeyCache.entries()) {
            if (value.info?.id === keyId) {
                apiKeyCache.delete(key)
            }
        }

        return true
    } catch (error) {
        console.error('Error revoking API key:', error)
        return false
    }
}

// Get tier from request (API key or default to free)
export async function getTierFromRequest(request: Request): Promise<{
    tier: RateLimitTier
    identifier: string
    apiKeyInfo: ApiKeyInfo | null
}> {
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

    if (apiKey) {
        const info = await validateApiKey(apiKey)
        if (info) {
            return {
                tier: info.tier,
                identifier: info.id,
                apiKeyInfo: info
            }
        }
    }

    // Fall back to IP-based rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown'

    return {
        tier: 'free',
        identifier: `ip:${ip}`,
        apiKeyInfo: null
    }
}
