'use client'

// Language Switcher Component
// Simple dropdown for language selection

import { useI18n, locales, languageNames, type Locale } from '@/lib/i18n/provider'
import { Globe } from 'lucide-react'
import { useState } from 'react'

export function LanguageSwitcher() {
    const { locale, setLocale } = useI18n()
    const [isOpen, setIsOpen] = useState(false)

    const switchLanguage = (newLocale: Locale) => {
        setLocale(newLocale)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{languageNames[locale]}</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                        {locales.map((loc) => (
                            <button
                                key={loc}
                                onClick={() => switchLanguage(loc)}
                                className={`
                                    w-full px-4 py-3 text-left text-sm transition-all
                                    ${locale === loc
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{languageNames[loc]}</span>
                                    {locale === loc && (
                                        <span className="text-green-400">✓</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
