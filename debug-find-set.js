const API_KEY = process.env.POKEMON_TCG_API_KEY || ''
const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/sets'

async function findSet() {
    console.log('🔍 Searching for set "151"...')

    // Search for sets named "151"
    const url = `${POKEMON_TCG_API}?q=name:"151"`

    try {
        const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } })
        const data = await res.json()

        console.log(`Found ${data.totalCount} sets.`)
        data.data.forEach(s => {
            console.log(`[${s.id}] ${s.name} (Released: ${s.releaseDate})`)
        })

    } catch (e) {
        console.error('Error:', e)
    }
}

findSet()
