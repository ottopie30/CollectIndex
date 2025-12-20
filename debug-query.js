const API_KEY = process.env.POKEMON_TCG_API_KEY || ''
const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'

async function debugQueries() {
    const setId = 'sv3pt5' // 151
    const number = '6'     // Chaizard ex is usually 006 or 6

    const queries = [
        `set.id:${setId} number:${number}`,
        `set.id:${setId} number:00${number}`, // Try zero padding
        `set.id:${setId} number:0${number}`,
        `id:${setId}-${number}`,              // Try direct ID
        `name:"Charizard ex" set.id:${setId}` // Fallback to name
    ]

    console.log(`🔍 Debugging API Queries for ${setId} #${number}...`)

    for (const q of queries) {
        const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(q)}&select=id,name,number`
        try {
            console.log(`\nTesting: ${q}`)
            const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } })
            const data = await res.json()

            if (data.data && data.data.length > 0) {
                console.log(`✅ MATCH FOUND! -> ID: ${data.data[0].id} | Number: ${data.data[0].number}`)
            } else {
                console.log(`❌ No match.`)
            }
        } catch (e) {
            console.error(`💥 Error: ${e.message}`)
        }
    }
}

debugQueries()
