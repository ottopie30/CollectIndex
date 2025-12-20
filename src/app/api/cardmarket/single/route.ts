import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''

// Map TCGdex Set IDs to Pokemon TCG API Set IDs
// Keeping this simple and local for now as requested
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

    // Parse TCGdex ID (e.g., "sv3pt5-1")
    // Assumes format: SET_ID-CARD_NUMBER
    const parts = tcgdexId.split('-')
    if (parts.length < 2) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const setId = parts[0]
    const number = parts[1]

    // Map to API Set ID
    const apiSetId = SET_MAPPING[setId] || setId

    try {
        // Fetch specific card from Pokemon API
        // Query: set.id:X AND number:Y
        const query = `set.id:${apiSetId} number:${number}`
        const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(query)}&select=id,name,cardmarket,images`

        const response = await fetch(url, {
            headers: { 'X-Api-Key': API_KEY }
        })

        if (!response.ok) {
            throw new Error(`Pokemon API Error: ${response.status}`)
        }

        const data = await response.json()
        const card = data.data?.[0]

        if (!card) {
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
        console.error('Single Card Fetch Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
