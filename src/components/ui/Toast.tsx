'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (type: ToastType, message: string, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(7)
        setToasts(prev => [...prev, { id, type, message, duration }])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

// Toast container component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    )
}

// Individual toast item
function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
    const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle
    }

    const colors = {
        success: 'bg-green-500/20 border-green-500/50 text-green-400',
        error: 'bg-red-500/20 border-red-500/50 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
        warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400'
    }

    const Icon = icons[toast.type]

    return (
        <div className={`
            ${colors[toast.type]}
            px-4 py-3 rounded-xl border backdrop-blur-xl
            flex items-center gap-3 min-w-[300px]
            animate-in slide-in-from-right duration-300
        `}>
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-white/60 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

// Convenience hooks
export function useToastActions() {
    const { addToast } = useToast()

    return {
        success: (message: string, duration?: number) => addToast('success', message, duration),
        error: (message: string, duration?: number) => addToast('error', message, duration),
        info: (message: string, duration?: number) => addToast('info', message, duration),
        warning: (message: string, duration?: number) => addToast('warning', message, duration)
    }
}
