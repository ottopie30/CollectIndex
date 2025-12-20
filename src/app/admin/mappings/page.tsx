'use client'

import { useState } from 'react'

interface SetInfo {
    id: string
    name: string
    printedTotal: number
    releaseDate: string
    images: {
        symbol: string
        logo: string
    }
}

interface LogEntry {
    set: string
    status: 'success' | 'error' | 'pending' | 'retry'
    message: string
    details?: any
}

export default function MappingAdminPage() {
    const [sets, setSets] = useState<SetInfo[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [progress, setProgress] = useState(0)

    // Load available sets from API
    const loadSets = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/cardmarket/sync-mappings?mode=list')
            const text = await res.text()

            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                console.error('API returned non-JSON:', text.slice(0, 500))
                throw new Error(`API Error (${res.status}): ${text.slice(0, 100)}... (Check Console)`)
            }

            if (data.success) {
                // Sort by release date (newest first)
                const sorted = data.sets.sort((a: SetInfo, b: SetInfo) =>
                    new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
                )
                setSets(sorted)
            } else {
                throw new Error(data.error || 'Unknown API error')
            }
        } catch (e: any) {
            console.error('Failed to load sets', e)
            alert(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    // Helper to sync a single set with retries
    const syncSet = async (set: SetInfo, retryCount = 0): Promise<{ success: boolean, data?: any, error?: string }> => {
        try {
            const res = await fetch(`/api/cardmarket/sync-mappings?set=${set.id}`)
            const text = await res.text()

            // Handle Gateway Timeout specially
            if (res.status === 504) {
                throw new Error('Gateway Timeout (API too slow)')
            }

            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                throw new Error(`API Error (${res.status}): ${text.slice(0, 50)}...`)
            }

            if (data.success) {
                return { success: true, data }
            } else {
                throw new Error(data.error || 'Unknown error')
            }
        } catch (e: any) {
            if (retryCount < 2) {
                // Return generic error to trigger retry loop
                return { success: false, error: e.message }
            }
            return { success: false, error: e.message }
        }
    }

    // Sync all sets one by one
    const syncAll = async () => {
        if (!confirm(`Are you sure you want to map ALL ${sets.length} sets? This will take a while.`)) return

        setIsSyncing(true)
        setLogs([])
        setProgress(0)

        const total = sets.length
        let completed = 0

        for (const set of sets) {
            // Add pending log
            setLogs(prev => [{ set: set.name, status: 'pending', message: 'Starting...' }, ...prev])

            let attempt = 0
            let result

            // Try up to 3 times
            while (attempt < 3) {
                if (attempt > 0) {
                    setLogs(prev => {
                        const next = [...prev]
                        next[0] = { ...next[0], status: 'retry', message: `Retrying (${attempt}/3)...` }
                        return next
                    })
                    // Wait longer between retries
                    await new Promise(r => setTimeout(r, 2000 * attempt))
                }

                result = await syncSet(set, attempt)
                if (result.success) break
                attempt++
            }

            if (result?.success) {
                setLogs(prev => {
                    const next = [...prev]
                    next[0] = {
                        set: set.name,
                        status: 'success',
                        message: `Mapped ${result.data.mapped} cards`,
                        details: result.data
                    }
                    return next
                })
            } else {
                setLogs(prev => {
                    const next = [...prev]
                    next[0] = {
                        set: set.name,
                        status: 'error',
                        message: result?.error || 'Failed after retries'
                    }
                    return next
                })
            }

            completed++
            setProgress((completed / total) * 100)

            // Respect rate limits - wait 1s between sets
            await new Promise(r => setTimeout(r, 1000))
        }

        setIsSyncing(false)
        alert('Complete! Check logs for details.')
    }

    return (
        <div className="container mx-auto p-8 space-y-8 min-h-screen bg-slate-950 text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Cardmarket Mapping Center
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Manage relations between TCGdex and Cardmarket IDs
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={loadSets}
                        disabled={isLoading || isSyncing}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md font-medium text-sm disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Loading...' : 'Load Available Sets'}
                    </button>
                    <button
                        onClick={syncAll}
                        disabled={sets.length === 0 || isSyncing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-medium text-sm disabled:opacity-50 transition-colors"
                    >
                        {isSyncing ? `Syncing (${Math.round(progress)}%)` : 'Sync ALL Mappings'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {isSyncing && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Available Sets List - Replaced Card with Divs */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg h-[600px] overflow-hidden flex flex-col shadow-sm">
                    <div className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10">
                        <div className="text-xl font-semibold text-slate-200 flex justify-between items-center">
                            <span>Available Sets ({sets.length})</span>
                            {sets.length > 0 && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-100">
                                    {sets[0].releaseDate}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="overflow-y-auto p-0 flex-1">
                        {sets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No sets loaded. Click "Load Available Sets" to start.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-800/50 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="p-3">Symbol</th>
                                        <th className="p-3">Set Name</th>
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Cards</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {sets.map(set => (
                                        <tr key={set.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3">
                                                <img src={set.images.symbol} className="w-6 h-6 object-contain" alt="set" />
                                            </td>
                                            <td className="p-3 font-medium text-slate-200">
                                                {set.name}
                                                <div className="text-xs text-slate-500">{set.releaseDate}</div>
                                            </td>
                                            <td className="p-3 text-mono text-slate-400">{set.id}</td>
                                            <td className="p-3 text-slate-400">{set.printedTotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Operation Logs - Replaced Card with Divs */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg h-[600px] overflow-hidden flex flex-col shadow-sm">
                    <div className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10">
                        <div className="text-xl font-semibold text-slate-200">Sync Logs</div>
                    </div>
                    <div className="overflow-y-auto p-0 flex-1 font-mono text-sm">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                Logs will appear here during sync...
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/50">
                                {logs.map((log, i) => (
                                    <div key={i} className={`p-3 flex gap-3 ${log.status === 'error' ? 'bg-red-900/10 text-red-400' :
                                            log.status === 'success' ? 'bg-green-900/10 text-green-400' :
                                                log.status === 'retry' ? 'bg-yellow-900/10 text-yellow-400' :
                                                    'text-slate-400'
                                        }`}>
                                        <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                                            {log.status === 'success' && '✅'}
                                            {log.status === 'error' && '❌'}
                                            {log.status === 'pending' && '⏳'}
                                            {log.status === 'retry' && '🔄'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-300">{log.set}</div>
                                            <div>{log.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
