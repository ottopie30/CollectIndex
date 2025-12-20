const API_KEY = process.env.POKEMON_TCG_API_KEY || ''
const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'

async function listSetCards() {
    const setId = 'sv3pt5' // 151
    console.log(`📋 Listing first 20 cards from Set: ${setId}...`)

    // Just get the set's cards without filtering by number
    const url = `${POKEMON_TCG_API}?q=set.id:${setId}&pageSize=20&select=id,name,number,rarity`

    console.log(`URL: ${url}`)

    try {
        const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } })

        if (!res.ok) {
            console.error(`Error ${res.status}: ${await res.text()}`)
            return
        }

        const data = await res.json()
        console.log(`Found ${data.totalCount} cards in set.`)

        console.log('\n--- First 20 Cards ---')
        data.data.forEach(c => {
            console.log(`[${c.number}] ${c.name} (ID: ${c.id})`)
        })

    } catch (e) {
        console.error('Crash:', e)
    }
}

listSetCards()
