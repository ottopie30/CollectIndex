'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

// Replace with your Google Analytics ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

// Track page views
function usePageTracking() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!GA_ID) return

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

        // @ts-expect-error gtag is defined by the script
        window.gtag?.('config', GA_ID, {
            page_path: url,
        })
    }, [pathname, searchParams])
}

function PageTracker() {
    usePageTracking()
    return null
}

// Analytics Component
export function Analytics() {
    if (!GA_ID) return null

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
            </Script>
            <Suspense fallback={null}>
                <PageTracker />
            </Suspense>
        </>
    )
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
    if (!GA_ID) return

    // @ts-expect-error gtag is defined by the script
    window.gtag?.('event', action, {
        event_category: category,
        event_label: label,
        value: value,
    })
}

// Predefined events for the app
export const analyticsEvents = {
    // Card events
    cardSearch: (query: string) => trackEvent('search', 'cards', query),
    cardView: (cardId: string) => trackEvent('view', 'cards', cardId),
    cardAddToPortfolio: (cardId: string) => trackEvent('add_to_portfolio', 'cards', cardId),

    // Score events
    scoreViewed: (score: number) => trackEvent('view', 'score', undefined, score),

    // Auth events
    signupStarted: () => trackEvent('signup_started', 'auth'),
    signupCompleted: () => trackEvent('signup_completed', 'auth'),
    loginSuccess: () => trackEvent('login', 'auth'),

    // Feature engagement
    tutorialStarted: () => trackEvent('tutorial_started', 'engagement'),
    tutorialCompleted: () => trackEvent('tutorial_completed', 'engagement'),
    alertCreated: () => trackEvent('alert_created', 'engagement'),

    // Pricing
    pricingViewed: () => trackEvent('view', 'pricing'),
    proClicked: () => trackEvent('pro_clicked', 'pricing'),
}
