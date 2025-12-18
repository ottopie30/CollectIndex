// Stripe Webhooks Endpoint
// POST /api/stripe/webhooks - Handle Stripe events

import { NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe/client'
import { getSupabase } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(request: Request) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured')
        return NextResponse.json(
            { error: 'Webhook secret not configured' },
            { status: 500 }
        )
    }

    let event: Stripe.Event

    try {
        event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    // Handle different event types
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
                break

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionChange(event.data.object as Stripe.Subscription)
                break

            case 'customer.subscription.deleted':
                await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
                break

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
                break

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice)
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error(`Error handling ${event.type}:`, error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}

// Handle successful checkout
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id || session.metadata?.userId

    if (!userId) {
        console.error('No userId in checkout session')
        return
    }

    const supabase = getSupabase()

    // Update user's subscription info
    await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            tier: session.metadata?.tier || 'essential',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })

    console.log(`Subscription activated for user ${userId}`)
}

// Handle subscription changes
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId

    if (!userId) {
        console.error('No userId in subscription metadata')
        return
    }

    const supabase = getSupabase()

    // Determine tier from price ID
    let tier = 'essential'
    const priceId = subscription.items.data[0]?.price.id
    if (priceId?.includes('pro')) {
        tier = 'pro'
    }

    // Calculate period end (billing_cycle_anchor or default 30 days)
    const periodEnd = subscription.billing_cycle_anchor
        ? new Date((subscription.billing_cycle_anchor as number) * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            tier,
            current_period_end: periodEnd
        })

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId

    if (!userId) {
        return
    }

    const supabase = getSupabase()

    await supabase
        .from('user_subscriptions')
        .update({
            status: 'canceled',
            tier: 'free'
        })
        .eq('user_id', userId)

    console.log(`Subscription canceled for user ${userId}`)
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`)
    // Could send confirmation email here
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice ${invoice.id}`)
    // Could send payment failure notification here
}
