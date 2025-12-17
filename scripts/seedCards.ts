/**
 * Seed script for Altum Analytics
 * 
 * This script fetches cards from popular Pokemon TCG sets
 * and inserts them into Supabase with pricing data.
 * 
 * Usage: npx tsx scripts/seedCards.ts
 */

// Sets to seed (most popular/valuable)
const SETS_TO_SEED = [
    'sv3pt5',     // 151 (très populaire)
    'sv1',        // Scarlet & Violet Base
    'swsh12pt5',  // Crown Zenith
    'cel25',      // Celebrations 25th
    'base1',      // Base Set (vintage)
]

// TCGdex API
const TCGDEX_API = 'https://api.tcgdex.net/v2/en'

interface TCGdexCard {
    id: string
    name: string
    image?: string
    rarity?: string
    set: { id: string; name: string }
    hp?: number
    types?: string[]
    illustrator?: string
    category?: string
}

async function fetchSetCards(setId: string): Promise<TCGdexCard[]> {
    console.log(`📦 Fetching set: ${setId}`)

    try {
        const response = await fetch(`${TCGDEX_API}/sets/${setId}`)
        if (!response.ok) {
            console.error(`❌ Failed to fetch set ${setId}: ${response.status}`)
            return []
        }

        const set = await response.json()
        const cardIds: string[] = set.cards?.map((c: { id: string }) => c.id) || []

        console.log(`   Found ${cardIds.length} cards`)

        // Fetch details for each card
        const cards: TCGdexCard[] = []

        for (let i = 0; i < cardIds.length; i++) {
            const cardId = cardIds[i]

            try {
                const cardResp = await fetch(`${TCGDEX_API}/cards/${cardId}`)
                if (cardResp.ok) {
                    const card = await cardResp.json()
                    cards.push(card)
                }

                // Progress indicator
                if ((i + 1) % 10 === 0) {
                    console.log(`   Progress: ${i + 1}/${cardIds.length}`)
                }

                // Rate limiting
                await new Promise(r => setTimeout(r, 50))
            } catch (err) {
                console.error(`   ⚠️ Failed to fetch card ${cardId}`)
            }
        }

        return cards
    } catch (error) {
        console.error(`❌ Error fetching set ${setId}:`, error)
        return []
    }
}

function extractPricing(card: TCGdexCard & {
    cardmarket?: { prices?: { trendPrice?: number; averageSellPrice?: number } }
    tcgplayer?: { prices?: { holofoil?: { market?: number }; normal?: { market?: number } } }
}): { priceEUR: number | null; priceUSD: number | null } {
    const priceEUR = card.cardmarket?.prices?.trendPrice
        || card.cardmarket?.prices?.averageSellPrice
        || null

    const priceUSD = card.tcgplayer?.prices?.holofoil?.market
        || card.tcgplayer?.prices?.normal?.market
        || null

    return { priceEUR, priceUSD }
}

async function main() {
    console.log('🚀 Starting Altum Analytics Seed Script')
    console.log('='.repeat(50))

    // Check for Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.log('⚠️  Supabase credentials not found in environment')
        console.log('   Running in preview mode (no database writes)')
        console.log('')
    }

    let totalCards = 0
    let totalWithPricing = 0

    for (const setId of SETS_TO_SEED) {
        const cards = await fetchSetCards(setId)

        let withPricing = 0
        for (const card of cards) {
            const { priceEUR, priceUSD } = extractPricing(card as TCGdexCard & {
                cardmarket?: { prices?: { trendPrice?: number; averageSellPrice?: number } }
                tcgplayer?: { prices?: { holofoil?: { market?: number }; normal?: { market?: number } } }
            })
            if (priceEUR || priceUSD) withPricing++
        }

        console.log(`✅ ${setId}: ${cards.length} cards, ${withPricing} with pricing`)
        totalCards += cards.length
        totalWithPricing += withPricing

        // If Supabase is configured, insert cards
        if (supabaseUrl && supabaseKey) {
            // Dynamic import to avoid loading Supabase if not needed
            try {
                const { createClient } = await import('@supabase/supabase-js')
                const supabase = createClient(supabaseUrl, supabaseKey)

                for (const card of cards) {
                    const { priceEUR, priceUSD } = extractPricing(card as TCGdexCard & {
                        cardmarket?: { prices?: { trendPrice?: number; averageSellPrice?: number } }
                        tcgplayer?: { prices?: { holofoil?: { market?: number }; normal?: { market?: number } } }
                    })

                    // Upsert card
                    await supabase.from('cards').upsert({
                        tcgdex_id: card.id,
                        name: card.name,
                        set_name: card.set?.name || 'Unknown',
                        set_id: card.set?.id || 'unknown',
                        rarity: card.rarity || null,
                        image_url: card.image ? `${card.image}/high.webp` : null,
                        hp: card.hp || null,
                        types: card.types || [],
                        illustrator: card.illustrator || null,
                        category: card.category || null,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'tcgdex_id' })

                    // Get card ID for price history
                    const { data: cardData } = await supabase
                        .from('cards')
                        .select('id')
                        .eq('tcgdex_id', card.id)
                        .single()

                    if (cardData?.id) {
                        // Insert price history
                        const priceRecords = []
                        if (priceEUR) {
                            priceRecords.push({
                                card_id: cardData.id,
                                price: priceEUR,
                                source: 'cardmarket',
                                listing_type: 'sold',
                                recorded_at: new Date().toISOString()
                            })
                        }
                        if (priceUSD) {
                            priceRecords.push({
                                card_id: cardData.id,
                                price: priceUSD,
                                source: 'tcgplayer',
                                listing_type: 'sold',
                                recorded_at: new Date().toISOString()
                            })
                        }

                        if (priceRecords.length > 0) {
                            await supabase.from('price_history').insert(priceRecords)
                        }
                    }
                }

                console.log(`   💾 Saved to Supabase`)
            } catch (err) {
                console.error(`   ❌ Supabase error:`, err)
            }
        }

        // Delay between sets
        await new Promise(r => setTimeout(r, 500))
    }

    console.log('')
    console.log('='.repeat(50))
    console.log(`📊 Summary:`)
    console.log(`   Total cards: ${totalCards}`)
    console.log(`   With pricing: ${totalWithPricing}`)
    console.log(`   Coverage: ${((totalWithPricing / totalCards) * 100).toFixed(1)}%`)
    console.log('')
    console.log('✨ Seed complete!')
}

main().catch(console.error)
