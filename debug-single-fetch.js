// Native fetch used
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''
const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards'

async function testFetch() {
    // Simulate user clicking on "Charizard ex" (sv3pt5-6)
    const setId = 'sv3pt5'
    const number = '6'

    console.log(`Testing Fetch for ${setId}-${number} with Key: ${API_KEY ? 'Present' : 'MISSING'}`)

    const query = `set.id:${setId} number:${number}`
    const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(query)}&select=id,name,cardmarket,images`

    console.log(`URL: ${url}`)

    try {
        const response = await fetch(url, {
            headers: { 'X-Api-Key': API_KEY }
        })

        console.log(`Status: ${response.status} ${response.statusText}`)

        if (!response.ok) {
            const text = await response.text()
            console.error('Error Body:', text)
            return
        }

        const data = await response.json()
        console.log('Data found:', data.data?.length)
        if (data.data?.length > 0) {
            console.log('Card:', data.data[0].name)
            console.log('Price:', data.data[0].cardmarket?.prices?.trendPrice)
        } else {
            console.log('No cards found for query.')
        }

    } catch (e) {
        console.error('Fetch crashed:', e)
    }
}

testFetch()
