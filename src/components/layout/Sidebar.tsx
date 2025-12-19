'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Search,
    Wallet,
    Bell,
    Settings,
    BarChart3,
    Menu,
    X
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { useState, useEffect } from 'react'

export function Sidebar() {
    const { t } = useI18n()
    const pathname = usePathname()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileOpen) {
                setIsMobileOpen(false)
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isMobileOpen])

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
        { icon: Search, label: t('nav.cards'), href: '/cards' },
        { icon: Wallet, label: t('nav.portfolio'), href: '/portfolio' },
        { icon: Bell, label: t('nav.alerts'), href: '/alerts' },
        { icon: Settings, label: t('nav.settings'), href: '/settings' },
    ]

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Altum</h1>
                        <p className="text-xs text-white/50">Analytics</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                    ${isActive
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-sm font-medium text-white">Pro Plan</p>
                    <p className="text-xs text-white/50 mt-1">Unlimited access</p>
                </div>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 flex-col fixed left-0 top-0 bottom-0">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer */}
            {isMobileOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setIsMobileOpen(false)}
                    />

                    {/* Drawer */}
                    <aside className="md:hidden w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 bottom-0 z-50 animate-in slide-in-from-left duration-300">
                        {/* Close button */}
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <SidebarContent />
                    </aside>
                </>
            )}
        </>
    )
}
