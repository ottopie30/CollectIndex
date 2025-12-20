import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''

// Map TCGdex Set IDs to Pokemon TCG API Set IDs
const SET_MAPPING: Record<string, string> = {
    'sv8pt5': 'sv8pt5', 'sv8': 'sv8', 'sv7': 'sv7',
    'sv6pt5': 'sv6pt5', 'sv6': 'sv6', 'sv5': 'sv5',
    'sv4pt5': 'sv4pt5', 'sv4': 'sv4', 'sv3pt5': 'sv3pt5',
    'sv3': 'sv3', 'sv2': 'sv2', 'sv1': 'sv1',
    'swsh12pt5': 'swsh12pt5'
}

export async function GET(request: NextRequest) {
    const tcgdexId = request.nextUrl.searchParams.get('id')

    if (!tcgdexId) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    try {
        // Parse TCGdex ID (e.g., "sv3pt5-1" or "sv3pt5-001")
        const parts = tcgdexId.split('-')
        // Handle cases where ID might have multiple parts? Usually Set-Id
        // We'll take everything before the LAST dash as Set, and AFTER last dash as Number
        const number = parts.pop()
        const setId = parts.join('-')

        if (!setId || !number) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
        }

        // Map to API Set ID
        const apiSetId = SET_MAPPING[setId] || setId

        // Query: exact match
        const query = `set.id:${apiSetId} number:${number}`
        const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(query)}&select=id,name,cardmarket,images`

        console.log(`[API Single] Fetching: ${url}`)

        const response = await fetch(url, {
            headers: { 'X-Api-Key': API_KEY }
        })

        if (!response.ok) {
            const text = await response.text()
            console.error(`[API Single] Error ${response.status}: ${text}`)

            // If 404/402/429, don't 500 the client, just return "not found" or error
            if (response.status === 404) return NextResponse.json({ found: false })

            return NextResponse.json({ found: false, error: `Upstream API ${response.status}` }, { status: 200 })
        }

        const data = await response.json()
        const card = data.data?.[0]

        if (!card) {
            console.log(`[API Single] No card found for query: ${query}`)
            // Try fuzzy fallback? "name" based? 
            // For now, keep it simple as requested
            return NextResponse.json({ found: false })
        }

        // Return simplified data
        return NextResponse.json({
            found: true,
            price: card.cardmarket?.prices?.trendPrice || 0,
            url: card.cardmarket?.url || '',
            image: card.images?.small || '',
            lastUpdated: card.cardmarket?.updatedAt
        })

    } catch (error: any) {
        console.error('Single Card Fetch CRITICAL Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
