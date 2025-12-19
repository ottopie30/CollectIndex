'use client'

// Simple i18n Context Provider
// Manages language state and translation loading

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Locale = 'en' | 'fr' | 'de' | 'es'

export const locales: Locale[] = ['en', 'fr', 'de', 'es']
export const defaultLocale: Locale = 'fr'

export const languageNames: Record<Locale, string> = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español'
}

type Messages = Record<string, any>

type I18nContextType = {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string>) => string
    messages: Messages
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale)
    const [messages, setMessages] = useState<Messages>({})

    // Load messages when locale changes
    useEffect(() => {
        async function loadMessages() {
            try {
                const msgs = await import(`../../messages/${locale}.json`)
                setMessages(msgs.default)
            } catch (error) {
                console.error(`Failed to load messages for locale: ${locale}`, error)
            }
        }
        loadMessages()
    }, [locale])

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem('locale')
        if (saved && locales.includes(saved as Locale)) {
            setLocaleState(saved as Locale)
        }
    }, [])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem('locale', newLocale)
    }

    // Translation function
    const t = (key: string, params?: Record<string, string>): string => {
        const keys = key.split('.')
        let value: any = messages

        for (const k of keys) {
            value = value?.[k]
        }

        if (typeof value !== 'string') {
            return key // Return key if translation not found
        }

        // Replace params
        if (params) {
            Object.entries(params).forEach(([param, val]) => {
                value = value.replace(`{${param}}`, val)
            })
        }

        return value
    }

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, messages }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider')
    }
    return context
}
