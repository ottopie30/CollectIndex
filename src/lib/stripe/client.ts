// Stripe Client Configuration
// Server-side Stripe utilities

import Stripe from 'stripe'

// Stripe client singleton
let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
    if (!stripeClient) {
        const secretKey = process.env.STRIPE_SECRET_KEY

        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured')
        }

        stripeClient = new Stripe(secretKey, {
            apiVersion: '2025-12-15.clover'
        })
    }

    return stripeClient
}

// Create a checkout session for subscription
export async function createCheckoutSession(params: {
    priceId: string
    userId: string
    userEmail: string
    successUrl: string
    cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: params.priceId,
                quantity: 1
            }
        ],
        customer_email: params.userEmail,
        client_reference_id: params.userId,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
            userId: params.userId
        },
        subscription_data: {
            metadata: {
                userId: params.userId
            }
        }
    })

    return session
}

// Create billing portal session
export async function createBillingPortalSession(
    customerId: string,
    returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
    const stripe = getStripe()

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
    })

    return session
}

// Get customer by ID
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
        const stripe = getStripe()
        const customer = await stripe.customers.retrieve(customerId)

        if (customer.deleted) {
            return null
        }

        return customer as Stripe.Customer
    } catch {
        return null
    }
}

// Get active subscription for a customer
export async function getActiveSubscription(
    customerId: string
): Promise<Stripe.Subscription | null> {
    try {
        const stripe = getStripe()

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
        })

        return subscriptions.data[0] || null
    } catch {
        return null
    }
}

// Cancel subscription
export async function cancelSubscription(
    subscriptionId: string,
    immediately = false
): Promise<Stripe.Subscription> {
    const stripe = getStripe()

    if (immediately) {
        return stripe.subscriptions.cancel(subscriptionId)
    }

    return stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
    })
}

// Construct webhook event
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
): Stripe.Event {
    const stripe = getStripe()
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
