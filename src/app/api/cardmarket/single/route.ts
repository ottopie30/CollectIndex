import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''

const SET_MAPPING: Record<string, string> = {
    'sv8pt5': 'sv8pt5', 'sv8': 'sv8', 'sv7': 'sv7',
    'sv6pt5': 'sv6pt5', 'sv6': 'sv6', 'sv5': 'sv5',
    'sv4pt5': 'sv4pt5', 'sv4': 'sv4', 'sv3pt5': 'sv3pt5',
    'sv3': 'sv3', 'sv2': 'sv2', 'sv1': 'sv1',
    'swsh12pt5': 'swsh12pt5'
}

export async function GET(request: NextRequest) {
    const tcgdexId = request.nextUrl.searchParams.get('id')
    if (!tcgdexId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    try {
        const parts = tcgdexId.split('-')
        const number = parts.pop()
        const setId = parts.join('-')
        const apiSetId = SET_MAPPING[setId] || setId

        // FALLBACK CHAIN STRATEGY
        // 1. Try Direct ID Match (Most Reliable if IDs align)
        // 2. Try Exact Query (set.id + number)
        // 3. Try Padded Query (set.id + padded number)

        let foundCard = null

        // ATTEMPT 1: Search by ID (e.g. "sv3pt5-6")
        try {
            const idUrl = `${POKEMON_TCG_API}/${apiSetId}-${number}?select=id,name,cardmarket,images`
            console.log(`[API Single] Attempt 1 (ID): ${idUrl}`)
            const res = await fetch(idUrl, { headers: { 'X-Api-Key': API_KEY } })
            if (res.ok) {
                const data = await res.json()
                foundCard = data.data
                console.log(`[API Single] ✅ Match by ID!`)
            }
        } catch (e) { /* ignore */ }

        // ATTEMPT 2 & 3: Search by Query (Shotgun)
        if (!foundCard) {
            const queries = [`set.id:${apiSetId} number:${number}`]
            if (!isNaN(parseInt(number))) {
                queries.push(`set.id:${apiSetId} number:${number.padStart(3, '0')}`)
            }
            const combinedQuery = queries.map(q => `(${q})`).join(' OR ')
            const queryUrl = `${POKEMON_TCG_API}?q=${encodeURIComponent(combinedQuery)}&select=id,name,cardmarket,images`

            console.log(`[API Single] Attempt 2 (Query): ${queryUrl}`)
            const res = await fetch(queryUrl, { headers: { 'X-Api-Key': API_KEY } })
            if (res.ok) {
                const data = await res.json()
                if (data.data && data.data.length > 0) {
                    foundCard = data.data[0]
                    console.log(`[API Single] ✅ Match by Query!`)
                }
            }
        }

        if (!foundCard) {
            console.log(`[API Single] ❌ No card found after all attempts.`)
            return NextResponse.json({ found: false })
        }

        return NextResponse.json({
            found: true,
            price: foundCard.cardmarket?.prices?.trendPrice || 0,
            url: foundCard.cardmarket?.url || '',
            image: foundCard.images?.small || '',
            lastUpdated: foundCard.cardmarket?.updatedAt
        })

    } catch (error: any) {
        console.error('Single Card Fetch Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
