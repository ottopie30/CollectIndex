import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Sync Mappings via Pokemon TCG API
 * 
 * Instead of guessing names, we use the official Pokemon TCG API
 * which links TCGdex/Set IDs to Cardmarket URLs directly.
 * 
 * We iterate set by set to build the mapping database reliably.
 */

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Map TCGdex Set IDs to Pokemon TCG API Set IDs
// TODO: Expand this list or fetch dynamically
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
    'learning': 'cel25', // Celebrations (example of mapping diff)
    // Add more as needed...
}

export async function GET(request: NextRequest) {
    try {
        // Create client inside request to handle env var changes/errors gracefully
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
            throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

        const setId = request.nextUrl.searchParams.get('set')
        const mode = request.nextUrl.searchParams.get('mode')

        // Mode: List All Sets
        if (mode === 'list') {
            console.log('🔄 Fetching list of all sets...')
            const response = await fetch(`${POKEMON_TCG_API.replace('/cards', '/sets')}`, {
                headers: { 'X-Api-Key': API_KEY }
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(`Pokemon API error (${response.status}): ${text}`)
            }

            const data = await response.json()
            return NextResponse.json({
                success: true,
                sets: data.data || []
            })
        }

        if (!setId) {
            return NextResponse.json({
                message: 'Provide ?set=TCGDEX_SET_ID (e.g., sv3pt5)',
                supportedSets: Object.keys(SET_MAPPING)
            })
        }

        const apiSetId = SET_MAPPING[setId] || setId // Fallback to same ID
        console.log(`🔄 Mapping set ${setId} (API: ${apiSetId})...`)

        const mappings = []
        let page = 1
        let hasMore = true

        // Debug stats
        let totalFetched = 0
        let cardsWithCm = 0

        while (hasMore) {
            // Fetch from Pokemon TCG API with optimized payload (select only needed fields)
            // This prevents 504 Gateway Timeouts by reducing response size by ~90%
            const response = await fetch(`${POKEMON_TCG_API}?q=set.id:${apiSetId}&page=${page}&select=id,name,number,set,cardmarket,images`, {
                headers: { 'X-Api-Key': API_KEY }
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(`Pokemon API error (${response.status}) for set ${apiSetId}: ${text}`)
            }

            const data = await response.json()
            const cards = data.data || []

            if (cards.length === 0) {
                hasMore = false
                break
            }

            totalFetched += cards.length

            for (const card of cards) {
                // Extract Cardmarket ID from URL
                // URL format: https://www.cardmarket.com/en/Pokemon/Products/Singles/Set-Name/Card-Name?idProduct=12345
                const cmUrl = card.cardmarket?.url

                if (cmUrl) {
                    cardsWithCm++
                    const match = cmUrl.match(/idProduct=(\d+)/)
                    if (match && match[1]) {
                        const cmId = parseInt(match[1])

                        // Construct TCGdex ID (usually set-number)
                        // Note: We might need to adjust this depending on how TCGdex IDs are formatted in your DB
                        // Assuming format: "set-number" e.g., "sv3pt5-1"
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

            // Check if we reached the end
            if (cards.length < 250) { // Default page size
                hasMore = false
            } else {
                page++
            }
        }

        console.log(`📋 Found ${mappings.length} mappings for ${setId}`)

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
            mapped: mappings.length,
            debug: {
                totalFetched,
                cardsWithCm,
                apiSetId
            },
            sample: mappings.slice(0, 5)
        })

    } catch (error: any) {
        console.error('❌ Mapping failed:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
