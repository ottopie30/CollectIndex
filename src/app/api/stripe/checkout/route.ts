// Stripe Checkout API Endpoint
// POST /api/stripe/checkout - Create checkout session

import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { PRICING_TIERS, PricingTier } from '@/lib/stripe/pricing'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { tier, userId, userEmail } = body as {
            tier: PricingTier
            userId: string
            userEmail: string
        }

        // Validate tier
        if (!tier || !PRICING_TIERS[tier]) {
            return NextResponse.json(
                { error: 'Invalid tier' },
                { status: 400 }
            )
        }

        const tierInfo = PRICING_TIERS[tier]

        // Free tier doesn't need checkout
        if (tier === 'free' || !tierInfo.priceId) {
            return NextResponse.json(
                { error: 'Free tier does not require payment' },
                { status: 400 }
            )
        }

        if (!userId || !userEmail) {
            return NextResponse.json(
                { error: 'userId and userEmail are required' },
                { status: 400 }
            )
        }

        // Create checkout session
        const origin = request.headers.get('origin') || 'http://localhost:3000'

        const session = await createCheckoutSession({
            priceId: tierInfo.priceId,
            userId,
            userEmail,
            successUrl: `${origin}/settings/billing?success=true`,
            cancelUrl: `${origin}/settings/billing?canceled=true`
        })

        return NextResponse.json({
            sessionId: session.id,
            url: session.url
        })

    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
