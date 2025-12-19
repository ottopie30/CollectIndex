'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useRouter } from 'next/navigation'
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ShortcutsModal } from '../modals/ShortcutsModal'

export function Header() {
    const { t } = useI18n()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [showShortcuts, setShowShortcuts] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Global keyboard shortcuts
    useGlobalShortcuts({
        onSearchFocus: () => {
            searchInputRef.current?.focus()
        },
        onShowShortcuts: () => {
            setShowShortcuts(true)
        }
    })

    // Close shortcuts modal with Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showShortcuts) {
                setShowShortcuts(false)
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [showShortcuts])

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/cards?search=${encodeURIComponent(searchQuery)}`)
        } else {
            router.push('/cards')
        }
    }

    return (
        <>
            <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-6">
                {/* Search bar */}
                <div className="flex-1 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t('cards.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch()
                                }
                            }}
                            className="w-full pl-12 pr-8 md:pr-20 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm md:text-base"
                        />
                        <kbd className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white/10 border border-white/20 rounded text-white/40 text-xs font-mono">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-4 ml-6">
                    <LanguageSwitcher />

                    {/* Notifications */}
                    <button className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User menu */}
                    <button className="flex items-center gap-3 p-2 pr-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white">{t('nav.settings')}</span>
                    </button>
                </div>
            </header>

            {/* Shortcuts Modal */}
            <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </>
    )
}
