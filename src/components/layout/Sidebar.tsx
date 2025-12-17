'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Search,
    Wallet,
    Bell,
    Settings,
    TrendingUp,
    BarChart3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Recherche', href: '/cards', icon: Search },
    { name: 'Portfolio', href: '/portfolio', icon: Wallet },
    { name: 'Analyses', href: '/analytics', icon: BarChart3 },
    { name: 'Alertes', href: '/alerts', icon: Bell },
    { name: 'Paramètres', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside className={cn(
            "fixed left-0 top-0 h-full bg-black/40 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 z-40",
            collapsed ? "w-20" : "w-64"
        )}>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white">Altum</h1>
                            <p className="text-xs text-white/50">Analytics</p>
                        </div>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive && "text-purple-400")} />
                            {!collapsed && <span className="font-medium">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-500 transition-colors"
            >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Bottom section */}
            {!collapsed && (
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20">
                        <h3 className="font-semibold text-white text-sm">Passez à Pro</h3>
                        <p className="text-xs text-white/60 mt-1">Analyses illimitées et prédictions ML</p>
                        <button className="mt-3 w-full py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg text-sm font-medium text-white hover:from-purple-600 hover:to-blue-700 transition-all">
                            Voir les offres
                        </button>
                    </div>
                </div>
            )}
        </aside>
    )
}
