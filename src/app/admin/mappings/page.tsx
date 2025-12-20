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
    const [useFastMode, setUseFastMode] = useState(false) // New Toggle
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

    // Helper to sync a single set (Frontend Loop)
    const syncSet = async (set: SetInfo, retryCount = 0): Promise<{ success: boolean, data?: any, error?: string }> => {
        // Fast Mode is simple one-shot
        if (useFastMode) {
            try {
                const endpoint = `/api/cardmarket/auto-map?expansion=${set.id}&prices=true`
                const res = await fetch(endpoint)
                const data = await res.json()

                if (data.success) return { success: true, data }

                if (data.error?.includes('Unknown expansion')) {
                    return { success: false, error: 'Set ID not in catalog map yet (Skipped)' }
                }
                throw new Error(data.error || 'Unknown error')
            } catch (e: any) {
                return { success: false, error: e.message }
            }
        }

        // Precise Mode: Frontend-Driven Loop (Page by Page)
        let page = 1
        let hasMore = true
        let totalMapped = 0

        try {
            while (hasMore) {
                // Update log to show we are working
                setLogs(prev => {
                    const next = [...prev]
                    if (next[0]?.set === set.name) {
                        next[0] = {
                            ...next[0],
                            message: `Syncing Page ${page}... (Mapped: ${totalMapped})`,
                            status: 'pending'
                        }
                    }
                    return next
                })

                const endpoint = `/api/cardmarket/sync-mappings?set=${set.id}&page=${page}`
                const res = await fetch(endpoint)

                if (!res.ok) {
                    // If 504, it might be a transient glitch on this page, throw to retry locally if needed
                    if (res.status === 504) throw new Error(`Gateway Timeout on Page ${page}`)
                    const text = await res.text()
                    throw new Error(`API Error (${res.status}): ${text.slice(0, 50)}...`)
                }

                const data = await res.json()

                if (!data.success) {
                    throw new Error(data.error || 'Unknown API error')
                }

                totalMapped += (data.mapped || 0)
                hasMore = data.hasMore

                if (hasMore) {
                    page++
                    // Small delay to be nice to the API/Server
                    await new Promise(r => setTimeout(r, 200))
                }
            }

            return { success: true, data: { mapped: totalMapped } }

        } catch (e: any) {
            if (retryCount < 2) {
                return { success: false, error: e.message } // will trigger global retry
            }
            return { success: false, error: e.message }
        }
    }

    // Sync all sets one by one
    const syncAll = async () => {
        if (!confirm(`Start Bulk Mapping? Mode: ${useFastMode ? 'FAST (Catalog)' : 'PRECISE (API)'}`)) return

        setIsSyncing(true)
        setLogs([])
        setProgress(0)

        const total = sets.length
        let completed = 0

        for (const set of sets) {
            setLogs(prev => [{ set: set.name, status: 'pending', message: 'Starting...' }, ...prev])

            let attempt = 0
            let result: { success: boolean, data?: any, error?: string } | undefined

            while (attempt < 3) {
                if (attempt > 0) {
                    setLogs(prev => {
                        const next = [...prev]
                        next[0] = { ...next[0], status: 'retry', message: `Retrying (${attempt}/3)...` }
                        return next
                    })
                    await new Promise(r => setTimeout(r, 2000 * attempt))
                }

                result = await syncSet(set, attempt)
                if (result.success) break
                // Don't retry fast mode errors (usually logic errors, not network)
                if (useFastMode) break
                attempt++
            }

            if (result?.success) {
                setLogs(prev => {
                    const next = [...prev]
                    next[0] = {
                        set: set.name,
                        status: 'success',
                        message: `Mapped ${result?.data.mapped} cards`,
                        details: result?.data
                    }
                    return next
                })
            } else {
                setLogs(prev => {
                    const next = [...prev]
                    next[0] = {
                        set: set.name,
                        status: 'error',
                        message: result?.error || 'Failed'
                    }
                    return next
                })
            }

            completed++
            setProgress((completed / total) * 100)
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
                <div className="flex gap-4 items-center">
                    <div className="flex items-center space-x-2 mr-4 bg-slate-900 p-2 rounded border border-slate-800">
                        <input
                            type="checkbox"
                            id="fastMode"
                            checked={useFastMode}
                            onChange={(e) => setUseFastMode(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="fastMode" className="text-sm font-medium cursor-pointer select-none">
                            ⚡ Fast Mode (Catalog)
                        </label>
                    </div>

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
