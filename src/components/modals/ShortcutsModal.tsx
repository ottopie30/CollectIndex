'use client'

import { X, Command } from 'lucide-react'

interface ShortcutsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    if (!isOpen) return null

    const shortcuts = [
        { keys: ['⌘', 'K'], description: 'Focus search bar' },
        { keys: ['Ctrl', 'K'], description: 'Focus search bar (Windows)' },
        { keys: ['⌘', '/'], description: 'Show this dialog' },
        { keys: ['Esc'], description: 'Close dialog' },
        { keys: ['→'], description: 'Navigate forward' },
        { keys: ['←'], description: 'Navigate back' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Command className="w-5 h-5 text-white" />
                        <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Shortcuts list */}
                <div className="space-y-3">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                        >
                            <span className="text-white/70 text-sm">{shortcut.description}</span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, i) => (
                                    <span key={i}>
                                        <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs font-mono">
                                            {key}
                                        </kbd>
                                        {i < shortcut.keys.length - 1 && (
                                            <span className="text-white/40 mx-1">+</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-center text-white/40 text-xs">
                    Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/60">Esc</kbd> to close
                </p>
            </div>
        </div>
    )
}
