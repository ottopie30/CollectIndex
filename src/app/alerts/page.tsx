'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Bell,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Check,
    X,
    Search,
    ArrowUp,
    ArrowDown,
    Clock
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

// Alert types
type AlertType = 'price_above' | 'price_below' | 'score_change' | 'pump_detected' | 'drop_detected'

type Alert = {
    id: string
    cardId: string
    cardName: string
    cardImage: string | null
    type: AlertType
    threshold: number
    currentValue: number
    triggered: boolean
    triggeredAt?: string
    createdAt: string
    active: boolean
}

// Mock alerts data
const mockAlerts: Alert[] = [
    {
        id: '1',
        cardId: 'base1-4',
        cardName: 'Charizard',
        cardImage: 'https://assets.tcgdex.net/en/base/base1/4/high.webp',
        type: 'price_above',
        threshold: 500,
        currentValue: 420,
        triggered: false,
        createdAt: '2024-11-01',
        active: true
    },
    {
        id: '2',
        cardId: 'swsh12pt5-160',
        cardName: 'Pikachu VMAX',
        cardImage: 'https://assets.tcgdex.net/en/swsh/swsh12pt5/160/high.webp',
        type: 'pump_detected',
        threshold: 20,
        currentValue: 52,
        triggered: true,
        triggeredAt: '2024-12-15',
        createdAt: '2024-10-15',
        active: true
    },
    {
        id: '3',
        cardId: 'sv1-1',
        cardName: 'Sprigatito',
        cardImage: 'https://assets.tcgdex.net/en/sv/sv1/1/high.webp',
        type: 'price_below',
        threshold: 2,
        currentValue: 3.5,
        triggered: false,
        createdAt: '2024-11-20',
        active: true
    },
    {
        id: '4',
        cardId: 'neo1-9',
        cardName: 'Lugia',
        cardImage: 'https://assets.tcgdex.net/en/neo/neo1/9/high.webp',
        type: 'drop_detected',
        threshold: 15,
        currentValue: 180,
        triggered: true,
        triggeredAt: '2024-12-10',
        createdAt: '2024-09-01',
        active: false
    }
]

// Alert type config
const alertTypeConfig: Record<AlertType, { label: string; icon: typeof TrendingUp; color: string; bgColor: string }> = {
    price_above: { label: 'Prix au-dessus', icon: ArrowUp, color: 'text-white', bgColor: 'bg-white/10' },
    price_below: { label: 'Prix en-dessous', icon: ArrowDown, color: 'text-white', bgColor: 'bg-white/10' },
    score_change: { label: 'Score change', icon: AlertTriangle, color: 'text-white', bgColor: 'bg-white/10' },
    pump_detected: { label: 'Pump détecté', icon: TrendingUp, color: 'text-white', bgColor: 'bg-white/10' },
    drop_detected: { label: 'Drop détecté', icon: TrendingDown, color: 'text-white', bgColor: 'bg-white/10' }
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filter, setFilter] = useState<'all' | 'triggered' | 'active'>('all')

    // Filter alerts
    const filteredAlerts = alerts.filter(alert => {
        if (filter === 'triggered') return alert.triggered
        if (filter === 'active') return alert.active && !alert.triggered
        return true
    })

    // Stats
    const totalAlerts = alerts.length
    const activeAlerts = alerts.filter(a => a.active).length
    const triggeredAlerts = alerts.filter(a => a.triggered).length

    // Delete alert
    const deleteAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id))
    }

    // Toggle alert active state
    const toggleAlert = (id: string) => {
        setAlerts(alerts.map(a =>
            a.id === id ? { ...a, active: !a.active } : a
        ))
    }

    // Mark as read
    const markAsRead = (id: string) => {
        setAlerts(alerts.map(a =>
            a.id === id ? { ...a, triggered: false, triggeredAt: undefined } : a
        ))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Alertes</h1>
                    <p className="text-white/50 mt-1">Surveillez vos cartes et recevez des notifications</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nouvelle alerte
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">Total Alertes</p>
                            <p className="text-2xl font-bold text-white mt-1">{totalAlerts}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">Alertes Actives</p>
                            <p className="text-2xl font-bold text-white mt-1">{activeAlerts}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/50">Déclenchées</p>
                            <p className="text-2xl font-bold text-white mt-1">{triggeredAlerts}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                >
                    Toutes ({totalAlerts})
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                >
                    En attente ({activeAlerts - triggeredAlerts})
                </button>
                <button
                    onClick={() => setFilter('triggered')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'triggered'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                >
                    Déclenchées ({triggeredAlerts})
                </button>
            </div>

            {/* Alerts list */}
            <div className="glass rounded-2xl overflow-hidden">
                {filteredAlerts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">Aucune alerte</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                        >
                            Créer votre première alerte
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {filteredAlerts.map((alert) => {
                            const config = alertTypeConfig[alert.type]
                            const Icon = config.icon

                            return (
                                <div
                                    key={alert.id}
                                    className={`p-4 transition-colors ${alert.triggered
                                        ? 'bg-white/10 hover:bg-white/15'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Card image */}
                                        <div className="w-14 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                            {alert.cardImage ? (
                                                <Image
                                                    src={alert.cardImage}
                                                    alt={alert.cardName}
                                                    width={56}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Bell className="w-6 h-6 text-white/20" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Alert info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                                </div>
                                                <span className={`text-sm font-medium ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                {alert.triggered && (
                                                    <span className="px-2 py-0.5 bg-white text-black text-xs rounded-full font-medium">
                                                        Déclenché
                                                    </span>
                                                )}
                                                {!alert.active && (
                                                    <span className="px-2 py-0.5 bg-white/10 text-white/40 text-xs rounded-full">
                                                        Désactivé
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                href={`/cards/${alert.cardId}`}
                                                className="font-medium text-white hover:text-white/80 transition-colors"
                                            >
                                                {alert.cardName}
                                            </Link>

                                            <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                                                <span>
                                                    Seuil: {alert.type.includes('price') ? formatPrice(alert.threshold) : `${alert.threshold}%`}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    Actuel: {alert.type.includes('price') ? formatPrice(alert.currentValue) : `${alert.currentValue}`}
                                                </span>
                                            </div>

                                            {alert.triggeredAt && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
                                                    <Clock className="w-3 h-3" />
                                                    Déclenché le {new Date(alert.triggeredAt).toLocaleDateString('fr-FR')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {alert.triggered && (
                                                <button
                                                    onClick={() => markAsRead(alert.id)}
                                                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                                    title="Marquer comme lu"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toggleAlert(alert.id)}
                                                className={`p-2 rounded-lg transition-colors ${alert.active
                                                    ? 'text-white/30 hover:text-white hover:bg-white/10'
                                                    : 'text-white hover:bg-white/20'
                                                    }`}
                                                title={alert.active ? 'Désactiver' : 'Activer'}
                                            >
                                                <Bell className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteAlert(alert.id)}
                                                className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateAlertModal onClose={() => setShowCreateModal(false)} onCreated={(alert) => {
                    setAlerts([...alerts, alert])
                    setShowCreateModal(false)
                }} />
            )}
        </div>
    )
}

// Create Alert Modal Component
function CreateAlertModal({ onClose, onCreated }: { onClose: () => void; onCreated: (alert: Alert) => void }) {
    const [step, setStep] = useState(1)
    const [selectedCard, setSelectedCard] = useState<{ id: string; name: string; image: string } | null>(null)
    const [alertType, setAlertType] = useState<AlertType>('price_above')
    const [threshold, setThreshold] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    // Mock search results
    const mockResults = [
        { id: 'base1-4', name: 'Charizard', image: 'https://assets.tcgdex.net/en/base/base1/4/high.webp' },
        { id: 'swsh12pt5-160', name: 'Pikachu VMAX', image: 'https://assets.tcgdex.net/en/swsh/swsh12pt5/160/high.webp' },
        { id: 'sv1-1', name: 'Sprigatito', image: 'https://assets.tcgdex.net/en/sv/sv1/1/high.webp' },
    ]

    const handleCreate = () => {
        if (!selectedCard || !threshold) return

        const newAlert: Alert = {
            id: Date.now().toString(),
            cardId: selectedCard.id,
            cardName: selectedCard.name,
            cardImage: selectedCard.image,
            type: alertType,
            threshold: parseFloat(threshold),
            currentValue: 0,
            triggered: false,
            createdAt: new Date().toISOString().split('T')[0],
            active: true
        }

        onCreated(newAlert)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative glass rounded-3xl p-6 w-full max-w-lg border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {step === 1 ? 'Choisir une carte' : step === 2 ? 'Type d\'alerte' : 'Définir le seuil'}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Step 1: Select card */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher une carte..."
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-auto">
                            {mockResults.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(card => (
                                <button
                                    key={card.id}
                                    onClick={() => { setSelectedCard(card); setStep(2); }}
                                    className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors text-left"
                                >
                                    <Image src={card.image} alt={card.name} width={40} height={56} className="w-10 h-14 rounded object-cover" />
                                    <span className="font-medium text-white">{card.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Alert type */}
                {step === 2 && (
                    <div className="space-y-3">
                        {Object.entries(alertTypeConfig).map(([type, config]) => {
                            const Icon = config.icon
                            return (
                                <button
                                    key={type}
                                    onClick={() => { setAlertType(type as AlertType); setStep(3); }}
                                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-colors text-left ${alertType === type ? 'bg-white text-black border border-white' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${alertType === type ? 'bg-black/10' : config.bgColor}`}>
                                        <Icon className={`w-5 h-5 ${alertType === type ? 'text-black' : config.color}`} />
                                    </div>
                                    <span className={`font-medium ${alertType === type ? 'text-black' : 'text-white'}`}>{config.label}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Step 3: Threshold */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <Image src={selectedCard!.image} alt={selectedCard!.name} width={40} height={56} className="w-10 h-14 rounded object-cover" />
                            <div>
                                <p className="font-medium text-white">{selectedCard!.name}</p>
                                <p className="text-sm text-white/50">{alertTypeConfig[alertType].label}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                {alertType.includes('price') ? 'Prix seuil (€)' : 'Variation seuil (%)'}
                            </label>
                            <input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                placeholder={alertType.includes('price') ? '100.00' : '10'}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={!threshold}
                            className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                        >
                            Créer l&apos;alerte
                        </button>
                    </div>
                )}

                {/* Back button */}
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="mt-4 w-full py-2 text-white/50 hover:text-white transition-colors"
                    >
                        ← Retour
                    </button>
                )}
            </div>
        </div>
    )
}
