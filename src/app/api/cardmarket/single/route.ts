import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''

// Map TCGdex Set IDs to Pokemon TCG API Set IDs
const SET_MAPPING: Record<string, string> = {
    'sv8pt5': 'sv8pt5', 'sv8': 'sv8', 'sv7': 'sv7',
    'sv6pt5': 'sv6pt5', 'sv6': 'sv6', 'sv5': 'sv5',
    'sv4pt5': 'sv4pt5', 'sv4': 'sv4', 'sv3pt5': 'sv3pt5', // 151
    'sv3': 'sv3', 'sv2': 'sv2', 'sv1': 'sv1',
    'swsh12pt5': 'swsh12pt5'
}

export async function GET(request: NextRequest) {
    const tcgdexId = request.nextUrl.searchParams.get('id')

    if (!tcgdexId) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    try {
        const parts = tcgdexId.split('-')
        const number = parts.pop()
        const setId = parts.join('-')

        if (!setId || !number) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
        }

        const apiSetId = SET_MAPPING[setId] || setId

        // Strategy: Try multiple query formats in PARALLEL to ensure we find it
        // 1. Exact match (set.id:X number:Y)
        // 2. Zero padded match (set.id:X number:00Y) -> for '6' try '006'
        // 3. Simple padded match (set.id:X number:0Y) -> for '6' try '06'

        const queries = [`set.id:${apiSetId} number:${number}`]

        // Add padding variations if number is numeric
        if (!isNaN(parseInt(number))) {
            const numVal = parseInt(number)
            if (numVal < 100) queries.push(`set.id:${apiSetId} number:${number.padStart(3, '0')}`) // 006
            if (numVal < 10) queries.push(`set.id:${apiSetId} number:${number.padStart(2, '0')}`)  // 06
        }

        // Construct OR query for single efficient request
        // query = (set.id:X number:Y) OR (set.id:X number:00Y) ...
        const combinedQuery = queries.map(q => `(${q})`).join(' OR ')

        const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(combinedQuery)}&select=id,name,cardmarket,images`

        console.log(`[API Single] Fetching: ${url}`)

        const response = await fetch(url, {
            headers: { 'X-Api-Key': API_KEY }
        })

        if (!response.ok) {
            const text = await response.text()
            console.error(`[API Single] Error ${response.status}: ${text}`)
            if (response.status === 404) return NextResponse.json({ found: false })
            return NextResponse.json({ found: false, error: `Upstream API ${response.status}` }, { status: 200 })
        }

        const data = await response.json()
        const card = data.data?.[0]

        if (!card) {
            console.log(`[API Single] No card found for query: ${combinedQuery}`)
            return NextResponse.json({ found: false })
        }

        console.log(`[API Single] HIT! Found: ${card.name} (${card.id}) Price: ${card.cardmarket?.prices?.trendPrice}€`)

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
