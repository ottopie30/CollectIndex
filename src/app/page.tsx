'use client'

import Link from 'next/link'
import {
    BarChart3,
    TrendingUp,
    Shield,
    Zap,
    Star,
    ArrowRight,
    CheckCircle2,
    Sparkles
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
    const { t } = useI18n()
    const router = useRouter()

    // Redirect authenticated users to dashboard
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/session')
                const data = await res.json()
                if (data.user) {
                    router.push('/dashboard')
                }
            } catch (e) {
                // User not authenticated, stay on landing
            }
        }
        checkAuth()
    }, [router])

    return (
        <div className="min-h-screen bg-black">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-black" />
                            </div>
                            <span className="text-xl font-bold text-white">Altum Analytics</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a>
                            <a href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</a>
                            <a href="#faq" className="text-white/70 hover:text-white transition-colors">FAQ</a>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm mb-8">
                                <Sparkles className="w-4 h-4" />
                                <span>{t('landing.hero.badge')}</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                {t('landing.hero.title')}
                                <span className="text-white/60"> {t('landing.hero.titleHighlight')} </span>
                                {t('landing.hero.titleSuffix')}
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl text-white/50 mb-8 max-w-xl mx-auto lg:mx-0">
                                {t('landing.hero.subtitle')}
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/cards"
                                    className="group px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-white/90 transition-colors flex items-center gap-2"
                                >
                                    {t('landing.hero.cta')}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href="#features"
                                    className="px-8 py-4 text-white/70 hover:text-white transition-colors font-medium"
                                >
                                    {t('landing.hero.features')} →
                                </a>
                            </div>

                            {/* Social Proof */}
                            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">500+</div>
                                    <div className="text-sm text-white/50">{t('landing.stats.analyzed')}</div>
                                </div>
                                <div className="w-px h-10 bg-white/20" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">5D</div>
                                    <div className="text-sm text-white/50">{t('landing.stats.score')}</div>
                                </div>
                                <div className="w-px h-10 bg-white/20" />
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-white text-white" />
                                        ))}
                                    </div>
                                    <div className="text-sm text-white/50">{t('landing.stats.reviews')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="flex-1 relative">
                            <div className="relative w-full aspect-square max-w-lg mx-auto">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />

                                {/* Score Card Preview */}
                                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="text-sm text-white/50">Charizard VMAX</div>
                                            <div className="text-2xl font-bold text-white">Score: 72</div>
                                        </div>
                                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                            <span className="text-2xl font-bold text-black">72</span>
                                        </div>
                                    </div>

                                    {/* Score Bars - Monochrome */}
                                    <div className="space-y-3">
                                        {[
                                            { name: 'D1 Volatilité', value: 65 },
                                            { name: 'D2 Croissance', value: 78 },
                                            { name: 'D3 Rareté', value: 85 },
                                            { name: 'D4 Sentiment', value: 70 },
                                            { name: 'D5 Macro', value: 62 },
                                        ].map((dim) => (
                                            <div key={dim.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-white/60">{dim.name}</span>
                                                    <span className="text-white font-medium">{dim.value}</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white rounded-full transition-all duration-1000"
                                                        style={{ width: `${dim.value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-3 bg-white/5 border border-white/20 rounded-xl">
                                        <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                            <Shield className="w-4 h-4" />
                                            Spéculation Élevée - Risque de correction
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {t('landing.features.title')}
                        </h2>
                        <p className="text-xl text-white/50 max-w-2xl mx-auto">
                            {t('landing.features.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: TrendingUp,
                                title: `D1: ${t('landing.features.volatility')}`,
                                description: t('landing.features.volatilityDesc'),
                            },
                            {
                                icon: Zap,
                                title: `D2: ${t('landing.features.growth')}`,
                                description: t('landing.features.growthDesc'),
                            },
                            {
                                icon: Star,
                                title: `D3: ${t('landing.features.rarity')}`,
                                description: t('landing.features.rarityDesc'),
                            },
                            {
                                icon: BarChart3,
                                title: `D4: ${t('landing.features.sentiment')}`,
                                description: t('landing.features.sentimentDesc'),
                            },
                            {
                                icon: Shield,
                                title: `D5: ${t('landing.features.macro')}`,
                                description: t('landing.features.macroDesc'),
                            },
                            {
                                icon: CheckCircle2,
                                title: t('landing.features.total'),
                                description: t('landing.features.totalDesc'),
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-black" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/50">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {t('landing.pricing.title')}
                        </h2>
                        <p className="text-xl text-white/50">
                            {t('landing.pricing.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Free Plan */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                            <div className="text-sm text-white/50 mb-2">{t('pricing.free.name')}</div>
                            <div className="text-4xl font-bold text-white mb-6">0€<span className="text-lg font-normal text-white/50">{t('pricing.free.period')}</span></div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    t('landing.pricing.features.unlimitedSearch'),
                                    t('landing.pricing.features.scoring'),
                                    t('landing.pricing.features.charts'),
                                    t('landing.pricing.features.trends'),
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-white/60 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/cards"
                                className="block w-full py-3 text-center bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                            >
                                {t('landing.hero.cta')}
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/30">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white rounded-full text-black text-sm font-medium">
                                {t('landing.pricing.popular')}
                            </div>

                            <div className="text-sm text-white/70 mb-2">{t('pricing.pro.name')}</div>
                            <div className="text-4xl font-bold text-white mb-6">9€<span className="text-lg font-normal text-white/50">{t('pricing.pro.period')}</span></div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    t('landing.pricing.features.unlimitedSearch'),
                                    t('landing.pricing.features.alerts'),
                                    t('landing.pricing.features.portfolio'),
                                    t('landing.pricing.features.history'),
                                    t('landing.pricing.features.export'),
                                    t('landing.pricing.features.support'),
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="block w-full py-3 text-center bg-white hover:bg-white/90 text-black rounded-xl font-medium transition-colors"
                            >
                                {t('landing.pricing.soon')}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {t('landing.cta.title')}
                        </h2>
                        <p className="text-xl text-white/50 mb-8">
                            {t('landing.cta.subtitle')}
                        </p>
                        <Link
                            href="/cards"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-white/90 transition-colors"
                        >
                            {t('landing.cta.button')}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-semibold text-white">Altum Analytics</span>
                    </div>

                    <div className="text-white/50 text-sm">
                        {t('footer.copyright')}
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">{t('footer.terms')}</a>
                        <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">{t('footer.privacy')}</a>
                        <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">{t('footer.contact')}</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
