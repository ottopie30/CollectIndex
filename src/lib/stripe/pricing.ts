// Stripe Payment Integration
// Handles subscriptions, payments, and webhook events

// Pricing tiers
export const PRICING_TIERS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        priceId: null, // No Stripe price for free tier
        features: [
            '10 analyses par mois',
            'Recherche basique',
            'Score de spéculation'
        ],
        limits: {
            analysesPerMonth: 10,
            alertsMax: 2,
            apiRequestsPerDay: 100,
            portfolioCards: 25
        }
    },
    essential: {
        id: 'essential',
        name: 'Essential',
        price: 999, // 9.99€ in cents
        priceId: process.env.STRIPE_PRICE_ESSENTIAL || 'price_essential',
        features: [
            'Analyses illimitées',
            'Score de rebond',
            '10 alertes personnalisées',
            'Historique de prix 1 an',
            'API: 1,000 req/jour'
        ],
        limits: {
            analysesPerMonth: Infinity,
            alertsMax: 10,
            apiRequestsPerDay: 1000,
            portfolioCards: 100
        }
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 2999, // 29.99€ in cents
        priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
        features: [
            'Tout Essential +',
            'Prédictions ML avancées',
            'Alertes illimitées',
            'API: 10,000 req/jour',
            'Export CSV/JSON',
            'Support prioritaire',
            'Webhooks temps réel'
        ],
        limits: {
            analysesPerMonth: Infinity,
            alertsMax: Infinity,
            apiRequestsPerDay: 10000,
            portfolioCards: Infinity
        }
    }
} as const

export type PricingTier = keyof typeof PRICING_TIERS

// Get tier info
export function getTierInfo(tierId: PricingTier) {
    return PRICING_TIERS[tierId]
}

// Format price for display
export function formatPrice(priceInCents: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency
    }).format(priceInCents / 100)
}
