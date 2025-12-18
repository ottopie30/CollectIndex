// Rate Limiter for API endpoints
// In production, use Redis for distributed rate limiting

type RateLimitEntry = {
    count: number
    resetAt: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit tiers
export const RATE_LIMITS = {
    free: { requests: 100, windowMs: 24 * 60 * 60 * 1000 },      // 100/day
    essential: { requests: 1000, windowMs: 24 * 60 * 60 * 1000 }, // 1000/day
    pro: { requests: 10000, windowMs: 24 * 60 * 60 * 1000 },      // 10000/day
    unlimited: { requests: Infinity, windowMs: 0 }
} as const

export type RateLimitTier = keyof typeof RATE_LIMITS

export type RateLimitResult = {
    allowed: boolean
    remaining: number
    resetAt: Date
    limit: number
}

// Check rate limit for an API key or IP
export function checkRateLimit(
    identifier: string,
    tier: RateLimitTier = 'free'
): RateLimitResult {
    const now = Date.now()
    const limits = RATE_LIMITS[tier]

    if (tier === 'unlimited') {
        return {
            allowed: true,
            remaining: Infinity,
            resetAt: new Date(now),
            limit: Infinity
        }
    }

    const key = `${tier}:${identifier}`
    let entry = rateLimitStore.get(key)

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + limits.windowMs
        }
    }

    // Check if allowed
    const allowed = entry.count < limits.requests

    if (allowed) {
        entry.count++
        rateLimitStore.set(key, entry)
    }

    return {
        allowed,
        remaining: Math.max(0, limits.requests - entry.count),
        resetAt: new Date(entry.resetAt),
        limit: limits.requests
    }
}

// Get rate limit headers for response
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString()
    }
}

// Middleware helper for Next.js API routes
export function withRateLimit(
    identifier: string,
    tier: RateLimitTier = 'free'
): { allowed: boolean; headers: Record<string, string>; result: RateLimitResult } {
    const result = checkRateLimit(identifier, tier)
    return {
        allowed: result.allowed,
        headers: getRateLimitHeaders(result),
        result
    }
}

// Clean up expired entries (call periodically)
export function cleanupExpiredEntries(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key)
            cleaned++
        }
    }

    return cleaned
}

// Get usage stats for an identifier
export function getUsageStats(identifier: string, tier: RateLimitTier = 'free'): {
    used: number
    limit: number
    percentUsed: number
} {
    const key = `${tier}:${identifier}`
    const entry = rateLimitStore.get(key)
    const limits = RATE_LIMITS[tier]

    const used = entry?.count || 0
    const limit = limits.requests

    return {
        used,
        limit,
        percentUsed: limit === Infinity ? 0 : (used / limit) * 100
    }
}
