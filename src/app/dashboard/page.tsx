'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Wallet,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { ScoreGauge } from '@/components/cards/ScoreGauge'
import { useI18n } from '@/lib/i18n/provider'
import {
  getMarketStats,
  getTrendingCards,
  getDashboardAlerts,
  MarketStats,
  TrendingCard,
  DashboardAlert
} from '@/lib/marketStats'
import Aurora from '@/components/ui/Aurora'
import FadeContent from '@/components/ui/FadeContent'
import CountUp from '@/components/ui/CountUp'
import ShinyText from '@/components/ui/ShinyText'

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  positive = true
}: {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  positive?: boolean
}) {
  return (
    <div className="stat-card glass rounded-2xl p-5 hover:border-purple-500/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${positive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          <Icon className={`w-5 h-5 ${positive ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{change >= 0 ? '+' : ''}{change}%</span>
          <span className="text-white/40 ml-1">vs 30j</span>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [marketStats, setMarketStats] = useState<MarketStats>({
    vintageIndex: { value: 0, change: 0 },
    modernIndex: { value: 0, change: 0 },
    speculationSentiment: 0,
    correctionProbability: 0,
    btcCorrelation: 0,
    fearGreedIndex: 0
  })
  const [trendingCards, setTrendingCards] = useState<TrendingCard[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])

  // Load dashboard data from Supabase
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [stats, cards, dashAlerts] = await Promise.all([
        getMarketStats(),
        getTrendingCards(),
        getDashboardAlerts()
      ])
      setMarketStats(stats)
      setTrendingCards(cards)
      setAlerts(dashAlerts)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Aurora Background */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <Aurora
          colorStops={['#00D4FF', '#7C3AED', '#F472B6']}
          amplitude={0.8}
          speed={0.3}
        />
      </div>

      {/* Page header */}
      <FadeContent blur duration={800}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              <ShinyText text={t('dashboard.title')} speed={3} className="text-3xl font-bold" />
            </h1>
            <p className="text-white/50 mt-1">{t('dashboard.marketOverview')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 glass rounded-xl">
              <span className="text-sm text-white/50">{t('dashboard.marketHealth')}</span>
              <span className="ml-2 text-amber-400 font-bold">42/100</span>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.stats.vintageIndex')}
          value={`${marketStats.vintageIndex.value > 0 ? '+' : ''}${marketStats.vintageIndex.value}%`}
          change={marketStats.vintageIndex.change}
          icon={TrendingUp}
          positive={marketStats.vintageIndex.value >= 0}
        />
        <StatCard
          title={t('dashboard.stats.modernIndex')}
          value={`${marketStats.modernIndex.value}%`}
          change={marketStats.modernIndex.change}
          icon={TrendingDown}
          positive={marketStats.modernIndex.value >= 0}
        />
        <StatCard
          title={t('dashboard.stats.speculationSentiment')}
          value={`${marketStats.speculationSentiment}/100`}
          icon={Zap}
          positive={marketStats.speculationSentiment < 50}
        />
        <StatCard
          title={t('dashboard.stats.correctionProbability')}
          value={`${marketStats.correctionProbability}%`}
          icon={AlertTriangle}
          positive={marketStats.correctionProbability < 40}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending cards */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{t('dashboard.trending.title')}</h2>
            <Link href="/cards" className="text-sm text-purple-400 hover:text-purple-300">
              {t('dashboard.trending.viewAll')} →
            </Link>
          </div>

          <div className="space-y-4">
            {trendingCards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                {/* Card image placeholder */}
                <div className="w-16 h-20 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white/30" />
                </div>

                {/* Card info */}
                <div className="flex-1">
                  <h3 className="font-medium text-white">{card.name}</h3>
                  <p className="text-sm text-white/50">{card.set_name}</p>
                </div>

                {/* Score */}
                <ScoreGauge score={card.score} size="sm" showLabel={false} />

                {/* Price */}
                <div className="text-right">
                  <p className="font-bold text-white">€{card.price.toLocaleString()}</p>
                  <p className={`text-sm ${card.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {card.change >= 0 ? '+' : ''}{card.change}%
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Alerts panel */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{t('dashboard.alerts.title')}</h2>
            <Link href="/alerts" className="text-sm text-purple-400 hover:text-purple-300">
              {t('dashboard.alerts.manage')} →
            </Link>
          </div>

          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${alert.type === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : alert.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === 'critical' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
                  {alert.type === 'warning' && <Zap className="w-5 h-5 text-amber-400 shrink-0" />}
                  {alert.type === 'opportunity' && <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium ${alert.type === 'critical' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                      {alert.type === 'critical' ? t('dashboard.alerts.critical') : alert.type === 'warning' ? t('dashboard.alerts.warning') : t('dashboard.alerts.opportunity')}
                    </p>
                    <p className="text-sm text-white/70 mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-white/50">{t('dashboard.quickStats.btcCorrelation')}</p>
                <p className="text-lg font-bold text-white">{marketStats.btcCorrelation}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-white/50">{t('dashboard.quickStats.fearGreed')}</p>
                <p className="text-lg font-bold text-amber-400">{marketStats.fearGreedIndex}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="glass-strong rounded-2xl p-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('dashboard.cta.title')}</h2>
            <p className="text-white/60 mt-2 max-w-lg">
              {t('dashboard.cta.subtitle')}
            </p>
          </div>
          <Link
            href="/portfolio"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl font-medium text-white hover:from-purple-600 hover:to-blue-700 transition-all flex items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            {t('dashboard.cta.button')}
          </Link>
        </div>
      </div>
    </div>
  )
}
