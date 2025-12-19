import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
    key: string
    ctrlKey?: boolean
    metaKey?: boolean
    shiftKey?: boolean
    action: () => void
    description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        for (const shortcut of shortcuts) {
            const ctrlOrMeta = (shortcut.ctrlKey && event.ctrlKey) || (shortcut.metaKey && event.metaKey)
            const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey

            if (
                event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                ctrlOrMeta &&
                shiftMatch
            ) {
                event.preventDefault()
                shortcut.action()
                break
            }
        }
    }, [shortcuts])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Global shortcuts that should work everywhere
export function useGlobalShortcuts(callbacks: {
    onSearchFocus?: () => void
    onShowShortcuts?: () => void
}) {
    useKeyboardShortcuts([
        {
            key: 'k',
            metaKey: true,
            action: () => callbacks.onSearchFocus?.(),
            description: 'Focus search'
        },
        {
            key: 'k',
            ctrlKey: true,
            action: () => callbacks.onSearchFocus?.(),
            description: 'Focus search'
        },
        {
            key: '/',
            metaKey: true,
            action: () => callbacks.onShowShortcuts?.(),
            description: 'Show shortcuts'
        },
        {
            key: '/',
            ctrlKey: true,
            action: () => callbacks.onShowShortcuts?.(),
            description: 'Show shortcuts'
        }
    ])
}
