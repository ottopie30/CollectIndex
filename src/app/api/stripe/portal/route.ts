// Stripe Billing Portal Endpoint
// POST /api/stripe/portal - Create billing portal session

import { NextResponse } from 'next/server'
import { createBillingPortalSession } from '@/lib/stripe/client'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId } = body as { userId: string }

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        const supabase = getSupabase()

        // Get user's Stripe customer ID
        const { data: subscription, error } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

        if (error || !subscription?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No subscription found for this user' },
                { status: 404 }
            )
        }

        const origin = request.headers.get('origin') || 'http://localhost:3000'

        const session = await createBillingPortalSession(
            subscription.stripe_customer_id,
            `${origin}/settings/billing`
        )

        return NextResponse.json({
            url: session.url
        })

    } catch (error) {
        console.error('Billing portal error:', error)
        return NextResponse.json(
            { error: 'Failed to create billing portal session' },
            { status: 500 }
        )
    }
}
