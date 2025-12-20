import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Sync Mappings via Pokemon TCG API - Frontend Driven
 * 
 * Strategy:
 * - Frontend calls this API page by page (page=1, page=2...)
 * - This API fetches ONLY that page from Pokemon TCG API
 * - Returns `hasMore: true` if there are more pages
 * - Returns `mapped: N` count
 * 
 * This strategy guarantees NO TIMEOUTS on Vercel as each request is <1s.
 */

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Map TCGdex Set IDs to Pokemon TCG API Set IDs
const SET_MAPPING: Record<string, string> = {
    'sv8pt5': 'sv8pt5', // Prismatic Evolutions
    'sv8': 'sv8',       // Surging Sparks
    'sv7': 'sv7',       // Stellar Crown
    'sv6pt5': 'sv6pt5', // Shrouded Fable
    'sv6': 'sv6',       // Twilight Masquerade
    'sv5': 'sv5',       // Temporal Forces
    'sv4pt5': 'sv4pt5', // Paldean Fates
    'sv4': 'sv4',       // Paradox Rift
    'sv3pt5': 'sv3pt5', // 151
    'sv3': 'sv3',       // Obsidian Flames
    'sv2': 'sv2',       // Paldea Evolved
    'sv1': 'sv1',       // Scarlet & Violet
    'swsh12pt5': 'swsh12pt5', // Crown Zenith
    'swsh12': 'swsh12', // Silver Tempest
}

export async function GET(request: NextRequest) {
    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
            throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
        const setId = request.nextUrl.searchParams.get('set')
        const mode = request.nextUrl.searchParams.get('mode')
        const page = parseInt(request.nextUrl.searchParams.get('page') || '1')

        // Mode: List All Sets
        if (mode === 'list') {
            console.log('🔄 Fetching list of all sets...')
            try {
                const response = await fetch(`${POKEMON_TCG_API.replace('/cards', '/sets')}`, {
                    headers: { 'X-Api-Key': API_KEY },
                    signal: AbortSignal.timeout(5000)
                })

                if (!response.ok) throw new Error(`API ${response.status}`)
                const data = await response.json()
                return NextResponse.json({ success: true, sets: data.data || [] })
            } catch (e: any) {
                console.warn('⚠️ API Unreachable/Timeout, using local set list fallback', e.message)
                const localSets = Object.keys(SET_MAPPING).map(id => ({
                    id,
                    name: `Set ${id.toUpperCase()} (API Offline)`,
                    releaseDate: '2023-01-01',
                    printedTotal: '?',
                    images: { symbol: 'https://images.pokemontcg.io/sv3pt5/symbol.png', logo: '' }
                }))
                return NextResponse.json({ success: true, sets: localSets, warning: 'API Unreachable' })
            }
        }

        if (!setId) {
            return NextResponse.json({
                message: 'Provide ?set=TCGDEX_SET_ID (e.g., sv3pt5)',
                supportedSets: Object.keys(SET_MAPPING)
            })
        }

        const apiSetId = SET_MAPPING[setId] || setId
        const pageSize = 50 // Keep small for speed

        // Fetch ONE page from Pokemon TCG API
        console.log(`PAGE ${page}: Fetching ${apiSetId}...`)
        const response = await fetch(`${POKEMON_TCG_API}?q=set.id:${apiSetId}&page=${page}&pageSize=${pageSize}&select=id,name,number,set,cardmarket,images`, {
            headers: { 'X-Api-Key': API_KEY }
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Pokemon API error (${response.status}) for set ${apiSetId}: ${text}`)
        }

        const data = await response.json()
        const cards = data.data || []
        const totalCount = data.totalCount || 0
        const hasMore = (page * pageSize) < totalCount // Calculate if more pages exist

        const mappings = []

        for (const card of cards) {
            const cmUrl = card.cardmarket?.url
            if (cmUrl) {
                const match = cmUrl.match(/idProduct=(\d+)/)
                if (match && match[1]) {
                    const cmId = parseInt(match[1])
                    const localId = card.number
                    const tcgdexId = `${setId}-${localId}`

                    mappings.push({
                        tcgdex_id: tcgdexId,
                        cardmarket_id: cmId,
                        card_name: card.name,
                        set_code: setId,
                        set_name: card.set.name,
                        updated_at: new Date().toISOString()
                    })
                }
            }
        }

        // Batch upsert to Supabase
        if (mappings.length > 0) {
            const { error } = await supabase
                .from('cardmarket_mapping')
                .upsert(mappings, { onConflict: 'tcgdex_id' })

            if (error) throw error
        }

        return NextResponse.json({
            success: true,
            set: setId,
            page: page,
            mapped: mappings.length,
            hasMore: hasMore, // CRITICAL: Tells frontend to continue
            totalCount: totalCount,
            debug: { apiSetId, pageSize }
        })

    } catch (error: any) {
        console.error('❌ Mapping failed:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
