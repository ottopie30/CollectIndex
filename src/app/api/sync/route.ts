import { NextRequest, NextResponse } from 'next/server'

// Force dynamic to prevent static generation
export const dynamic = 'force-dynamic'

// Default sets to sync
const DEFAULT_SETS = [
    'sv3pt5',     // 151
    'sv1',        // Scarlet & Violet Base
    'swsh12pt5',  // Crown Zenith
]

export async function POST(request: NextRequest) {
    try {
        // Check for API key (simple auth)
        const authHeader = request.headers.get('Authorization')
        const expectedKey = process.env.SYNC_API_KEY

        if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get sets from body or use defaults
        const body = await request.json().catch(() => ({}))
        const sets = body.sets || DEFAULT_SETS

        console.log(`Starting sync for sets: ${sets.join(', ')}`)

        // Dynamic import to avoid build-time supabase initialization
        const { ingestSets } = await import('@/lib/services/cardIngestionService')
        const result = await ingestSets(sets)

        return NextResponse.json({
            success: true,
            message: 'Sync completed',
            stats: {
                totalCards: result.totalSuccess,
                failed: result.totalFailed,
                withPricing: result.totalWithPricing,
                sets: result.setResults
            }
        })

    } catch (error) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: 'Sync failed', details: String(error) },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Altum Analytics Sync API',
        usage: 'POST /api/sync with optional { sets: ["set1", "set2"] }',
        defaultSets: DEFAULT_SETS
    })
}
