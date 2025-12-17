'use client'

interface PriceDataPoint {
    time: string
    value: number
}

interface PriceChartProps {
    data: PriceDataPoint[]
    height?: number
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl">
                <p className="text-white/40">Aucune donnée disponible</p>
            </div>
        )
    }

    // Calculate stats
    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const isPositive = lastValue >= firstValue

    // Normalize values to 0-100 scale for chart
    const normalizedData = values.map(v => ((v - minValue) / range) * 100)

    // Create SVG path
    const pathPoints = normalizedData.map((v, i) => {
        const x = (i / (normalizedData.length - 1)) * 100
        const y = 100 - v // Invert Y axis
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')

    // Create area fill path
    const areaPath = `${pathPoints} L 100 100 L 0 100 Z`

    return (
        <div className="relative" style={{ height }}>
            {/* Legend */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-white/70">Prix</span>
                </div>
            </div>

            {/* Price labels */}
            <div className="absolute right-2 top-2 text-xs text-white/40">€{maxValue.toFixed(2)}</div>
            <div className="absolute right-2 bottom-2 text-xs text-white/40">€{minValue.toFixed(2)}</div>

            {/* SVG Chart */}
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full rounded-xl bg-white/5"
            >
                {/* Grid lines */}
                <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.2">
                    <line x1="0" y1="25" x2="100" y2="25" />
                    <line x1="0" y1="50" x2="100" y2="50" />
                    <line x1="0" y1="75" x2="100" y2="75" />
                    <line x1="25" y1="0" x2="25" y2="100" />
                    <line x1="50" y1="0" x2="50" y2="100" />
                    <line x1="75" y1="0" x2="75" y2="100" />
                </g>

                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`gradient-${isPositive}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'} />
                        <stop offset="100%" stopColor={isPositive ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'} />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill={`url(#gradient-${isPositive})`}
                    className="transition-all duration-500"
                />

                {/* Line */}
                <path
                    d={pathPoints}
                    fill="none"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500"
                />
            </svg>

            {/* Time labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-white/40 -mb-5">
                <span>{data[0]?.time}</span>
                <span>{data[Math.floor(data.length / 2)]?.time}</span>
                <span>{data[data.length - 1]?.time}</span>
            </div>
        </div>
    )
}
