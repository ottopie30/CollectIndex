/**
 * API Route: GET /api/data/psa
 * Returns PSA population and scarcity data for cards
 * Query params: card=<name>&set=<setId>&rarity=<rarity>
 */

import { NextResponse } from 'next/server'
import { getScarcityScore } from '@/lib/data/psa'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // 24 hours (population data is stable)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const cardName = searchParams.get('card')
        const setId = searchParams.get('set') || 'unknown'
        const rarity = searchParams.get('rarity') || undefined
        const isVintage = searchParams.get('vintage') === 'true'

        if (!cardName) {
            return NextResponse.json(
                { success: false, error: 'Card name is required' },
                { status: 400 }
            )
        }

        const scarcity = await getScarcityScore(cardName, setId, rarity, isVintage)

        return NextResponse.json({
            success: true,
            data: scarcity,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error fetching PSA data:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch PSA data' },
            { status: 500 }
        )
    }
}
