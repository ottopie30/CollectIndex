/**
 * API Route: GET /api/data/macro
 * Returns macro economic data (BTC, Fear & Greed, Market Indices)
 */

import { NextResponse } from 'next/server'
import { getMacroScore } from '@/lib/data/macro'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes

export async function GET() {
    try {
        const macroData = await getMacroScore()

        return NextResponse.json({
            success: true,
            data: macroData,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error fetching macro data:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch macro data' },
            { status: 500 }
        )
    }
}
