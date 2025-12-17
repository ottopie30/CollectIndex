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

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-white" />
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
                                href="/cards"
                                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/cards"
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-8">
                                <Sparkles className="w-4 h-4" />
                                <span>Intelligence d'investissement Pokémon</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                Investissez en
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"> confiance </span>
                                dans les cartes Pokémon
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl text-white/60 mb-8 max-w-xl mx-auto lg:mx-0">
                                Notre algorithme de scoring 5D analyse chaque carte pour distinguer les opportunités d'investissement solides de la pure spéculation.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/cards"
                                    className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold text-lg hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    Commencer gratuitement
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href="#features"
                                    className="px-8 py-4 text-white/70 hover:text-white transition-colors font-medium"
                                >
                                    Découvrir les features →
                                </a>
                            </div>

                            {/* Social Proof */}
                            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">500+</div>
                                    <div className="text-sm text-white/50">Cartes analysées</div>
                                </div>
                                <div className="w-px h-10 bg-white/20" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">5D</div>
                                    <div className="text-sm text-white/50">Score de spéculation</div>
                                </div>
                                <div className="w-px h-10 bg-white/20" />
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <div className="text-sm text-white/50">Avis utilisateurs</div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="flex-1 relative">
                            <div className="relative w-full aspect-square max-w-lg mx-auto">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-3xl" />

                                {/* Score Card Preview */}
                                <div className="relative glass rounded-3xl p-8 border border-white/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="text-sm text-white/50">Charizard VMAX</div>
                                            <div className="text-2xl font-bold text-white">Score: 72</div>
                                        </div>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">72</span>
                                        </div>
                                    </div>

                                    {/* Score Bars */}
                                    <div className="space-y-3">
                                        {[
                                            { name: 'D1 Volatilité', value: 65, color: 'from-amber-500 to-orange-500' },
                                            { name: 'D2 Croissance', value: 78, color: 'from-red-500 to-pink-500' },
                                            { name: 'D3 Rareté', value: 85, color: 'from-purple-500 to-violet-500' },
                                            { name: 'D4 Sentiment', value: 70, color: 'from-blue-500 to-cyan-500' },
                                            { name: 'D5 Macro', value: 62, color: 'from-emerald-500 to-teal-500' },
                                        ].map((dim) => (
                                            <div key={dim.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-white/60">{dim.name}</span>
                                                    <span className="text-white font-medium">{dim.value}</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${dim.color} rounded-full transition-all duration-1000`}
                                                        style={{ width: `${dim.value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                                        <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
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
                            Scoring 5D: Votre avantage compétitif
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Notre algorithme propriétaire analyse 5 dimensions clés pour évaluer le risque spéculatif de chaque carte.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: TrendingUp,
                                title: 'D1: Volatilité',
                                description: 'Analyse la variation des prix pour détecter les mouvements anormaux.',
                                color: 'from-amber-500 to-orange-500'
                            },
                            {
                                icon: Zap,
                                title: 'D2: Croissance',
                                description: 'Identifie les rendements excessifs par rapport au benchmark marché.',
                                color: 'from-red-500 to-pink-500'
                            },
                            {
                                icon: Star,
                                title: 'D3: Rareté',
                                description: 'Évalue la vraie rareté basée sur population PSA et offre/demande.',
                                color: 'from-purple-500 to-violet-500'
                            },
                            {
                                icon: BarChart3,
                                title: 'D4: Sentiment',
                                description: 'Mesure le buzz social et la hype pour anticiper les corrections.',
                                color: 'from-blue-500 to-cyan-500'
                            },
                            {
                                icon: Shield,
                                title: 'D5: Macro',
                                description: 'Corrélation avec crypto, Fear & Greed Index, saisonnalité.',
                                color: 'from-emerald-500 to-teal-500'
                            },
                            {
                                icon: CheckCircle2,
                                title: 'Score Total',
                                description: 'Synthèse pondérée pour une décision d\'investissement éclairée.',
                                color: 'from-purple-500 to-blue-500'
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/60">{feature.description}</p>
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
                            Tarifs simples et transparents
                        </h2>
                        <p className="text-xl text-white/60">
                            Commencez gratuitement, passez Pro quand vous êtes prêt.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Free Plan */}
                        <div className="glass rounded-3xl p-8 border border-white/10">
                            <div className="text-sm text-white/50 mb-2">Gratuit</div>
                            <div className="text-4xl font-bold text-white mb-6">0€<span className="text-lg font-normal text-white/50">/mois</span></div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    'Recherche de cartes illimitée',
                                    'Score de spéculation 5D',
                                    'Graphiques de prix',
                                    'Top 50 cartes tendances',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/cards"
                                className="block w-full py-3 text-center bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                            >
                                Commencer gratuitement
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="relative glass rounded-3xl p-8 border-2 border-purple-500/50">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-sm font-medium">
                                Populaire
                            </div>

                            <div className="text-sm text-purple-300 mb-2">Pro</div>
                            <div className="text-4xl font-bold text-white mb-6">9€<span className="text-lg font-normal text-white/50">/mois</span></div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    'Tout du plan Gratuit',
                                    'Alertes prix et corrections',
                                    'Portfolio illimité',
                                    'Historique de prix complet',
                                    'Export données CSV',
                                    'Support prioritaire',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="block w-full py-3 text-center bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white rounded-xl font-medium transition-opacity"
                            >
                                Bientôt disponible
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="glass rounded-3xl p-12 border border-white/10">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Prêt à investir intelligemment ?
                        </h2>
                        <p className="text-xl text-white/60 mb-8">
                            Rejoignez les investisseurs qui utilisent Altum Analytics pour distinguer les opportunités de la spéculation.
                        </p>
                        <Link
                            href="/cards"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold text-lg hover:scale-105 transition-transform"
                        >
                            Analyser ma première carte
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">Altum Analytics</span>
                    </div>

                    <div className="text-white/50 text-sm">
                        © 2024 Altum Analytics. Tous droits réservés.
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Mentions légales</a>
                        <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Confidentialité</a>
                        <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
