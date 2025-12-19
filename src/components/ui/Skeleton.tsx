interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular' | 'card'
    width?: string | number
    height?: string | number
    count?: number
}

export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    count = 1
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-white/10 rounded'

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
        card: 'rounded-2xl'
    }

    const style = {
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'text' ? '16px' : variant === 'circular' ? '40px' : '200px')
    }

    if (count > 1) {
        return (
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                        style={style}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    )
}

// Preset skeletons for common use cases
export function CardSkeleton() {
    return (
        <div className="glass rounded-2xl p-6 space-y-4">
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
            <div className="flex gap-2 mt-4">
                <Skeleton variant="rectangular" height={32} width={80} />
                <Skeleton variant="rectangular" height={32} width={80} />
            </div>
        </div>
    )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} variant="text" width={i === 0 ? '30%' : '20%'} />
            ))}
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton variant="text" width="300px" height={32} />
                <Skeleton variant="text" width="200px" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass rounded-2xl p-6 space-y-3">
                        <Skeleton variant="text" width="50%" />
                        <Skeleton variant="text" width="70%" height={32} />
                        <Skeleton variant="text" width="40%" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CardSkeleton />
                </div>
                <div>
                    <CardSkeleton />
                </div>
            </div>
        </div>
    )
}
