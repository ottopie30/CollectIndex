import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POPULAR_CARD_MAPPINGS } from '@/lib/cardmarket-mappings'

// Supabase admin client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/cardmarket/mapping?tcgdexId=xxx
 * Returns the Cardmarket ID for a TCGdex card
 */
export async function GET(request: NextRequest) {
    const tcgdexId = request.nextUrl.searchParams.get('tcgdexId')

    if (!tcgdexId) {
        return NextResponse.json({ error: 'tcgdexId required' }, { status: 400 })
    }

    // 1. Check database first
    const { data: dbMapping, error } = await supabase
        .from('cardmarket_mapping')
        .select('*')
        .eq('tcgdex_id', tcgdexId)
        .single()

    if (dbMapping) {
        return NextResponse.json({
            found: true,
            source: 'database',
            mapping: dbMapping
        })
    }

    // 2. Check manual mappings
    const manualMapping = POPULAR_CARD_MAPPINGS[tcgdexId]
    if (manualMapping) {
        // Save to database for future use
        await saveMapping(tcgdexId, manualMapping.id)

        return NextResponse.json({
            found: true,
            source: 'manual',
            mapping: {
                tcgdex_id: tcgdexId,
                cardmarket_id: manualMapping.id,
                card_name: manualMapping.name,
                set_name: manualMapping.set
            }
        })
    }

    // 3. Not found
    return NextResponse.json({
        found: false,
        message: 'No Cardmarket mapping found for this card',
        tcgdexId
    })
}

/**
 * POST /api/cardmarket/mapping
 * Add a new mapping
 * Body: { tcgdexId, cardmarketId, cardName?, setName? }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tcgdexId, cardmarketId, cardName, setName } = body

        if (!tcgdexId || !cardmarketId) {
            return NextResponse.json(
                { error: 'tcgdexId and cardmarketId required' },
                { status: 400 }
            )
        }

        const [setCode] = tcgdexId.split('-')

        const { data, error } = await supabase
            .from('cardmarket_mapping')
            .upsert({
                tcgdex_id: tcgdexId,
                cardmarket_id: cardmarketId,
                card_name: cardName || null,
                set_name: setName || null,
                set_code: setCode,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tcgdex_id' })
            .select()
            .single()

        if (error) {
            console.error('Mapping insert error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            mapping: data
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to create mapping' },
            { status: 500 }
        )
    }
}

/**
 * Helper to save a mapping to database
 */
async function saveMapping(tcgdexId: string, cardmarketId: number) {
    const [setCode] = tcgdexId.split('-')

    // Try to get card name from TCGdex
    let cardName = ''
    let setName = ''

    try {
        const response = await fetch(`https://api.tcgdex.net/v2/en/cards/${tcgdexId}`)
        if (response.ok) {
            const card = await response.json()
            cardName = card.name || ''
            setName = card.set?.name || ''
        }
    } catch {
        // Ignore fetch errors
    }

    await supabase
        .from('cardmarket_mapping')
        .upsert({
            tcgdex_id: tcgdexId,
            cardmarket_id: cardmarketId,
            card_name: cardName,
            set_name: setName,
            set_code: setCode,
            updated_at: new Date().toISOString()
        }, { onConflict: 'tcgdex_id' })
}
