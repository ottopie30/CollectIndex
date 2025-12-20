/**
 * Script to build TCGdex → Cardmarket ID mapping
 * 
 * Strategy: Match cards by name + set using fuzzy matching
 * 
 * This script fetches:
 * 1. All TCGdex cards (via their API)
 * 2. Cardmarket price guide (has idProduct but no names)
 * 
 * Since Cardmarket price guide doesn't include card names, we need
 * to use an alternative approach: scrape or manually map popular cards.
 * 
 * For now, this creates a mapping for the TOP cards by price.
 */

import { createClient } from '@supabase/supabase-js'

// Cardmarket category IDs for Pokemon TCG
const CATEGORY_SINGLES = 51  // Single cards
const CATEGORY_GRADED = 52   // Graded cards  
const CATEGORY_SEALED = 53   // Sealed products

interface PriceGuideEntry {
    idProduct: number
    idCategory: number
    avg: number | null
    low: number | null
    trend: number | null
}

interface MappingEntry {
    tcgdex_id: string
    cardmarket_id: number
    card_name: string
    set_name: string
    set_code: string
}

// Manual mappings for popular cards (Cardmarket Product IDs)
// You can find these by searching cards on Cardmarket and extracting the ID from URL
// Example: https://www.cardmarket.com/en/Pokemon/Products/Singles/.../CARD_NAME?idProduct=12345
const POPULAR_CARD_MAPPINGS: Record<string, number> = {
    // Évolutions Prismatiques (Prismatic Evolutions) - sv8a
    'sv8a-197': 809099,  // Noctali-ex (Umbreon ex SAR)
    'sv8a-203': 809105,  // Pikachu ex SAR

    // Faille Paradoxe (Paradox Rift) - sv4
    'sv4-228': 761282,   // Roaring Moon ex SAR
    'sv4-230': 761284,   // Iron Valiant ex SAR

    // Flammes Obsidiennes (Obsidian Flames) - sv3
    'sv3-197': 720614,   // Rayquaza ex SAR
    'sv3-212': 720629,   // Charizard ex SAR

    // Base Set classics
    'base1-4': 271842,   // Charizard (1st Edition Holo)
    'base1-15': 271853,  // Venusaur (1st Edition Holo)
    'base1-2': 271840,   // Blastoise (1st Edition Holo)

    // Crown Zenith - swsh12pt5
    'swsh12pt5-GG70': 686541,  // Charizard VSTAR Gold

    // Brilliant Stars - swsh9
    'swsh9-174': 601538,  // Charizard VSTAR Rainbow

    // Add more mappings as needed...
}

async function buildMappings(supabaseUrl: string, serviceKey: string) {
    const supabase = createClient(supabaseUrl, serviceKey)

    console.log('📋 Building TCGdex → Cardmarket mappings...')

    // 1. Get all known mappings
    const mappings: MappingEntry[] = []

    for (const [tcgdexId, cardmarketId] of Object.entries(POPULAR_CARD_MAPPINGS)) {
        // Extract set code from tcgdex_id (e.g., "sv8a-197" → "sv8a")
        const [setCode, cardNumber] = tcgdexId.split('-')

        mappings.push({
            tcgdex_id: tcgdexId,
            cardmarket_id: cardmarketId,
            card_name: '',  // Will be filled by TCGdex lookup
            set_name: '',
            set_code: setCode
        })
    }

    console.log(`📦 Found ${mappings.length} manual mappings`)

    // 2. Enrich with TCGdex data
    for (const mapping of mappings) {
        try {
            const response = await fetch(`https://api.tcgdex.net/v2/en/cards/${mapping.tcgdex_id}`)
            if (response.ok) {
                const card = await response.json()
                mapping.card_name = card.name
                mapping.set_name = card.set?.name || ''
                console.log(`  ✓ ${mapping.tcgdex_id}: ${mapping.card_name}`)
            }
        } catch (error) {
            console.error(`  ✗ Failed to fetch ${mapping.tcgdex_id}`)
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 100))
    }

    // 3. Insert into database
    console.log('\n💾 Saving to database...')

    const { data, error } = await supabase
        .from('cardmarket_mapping')
        .upsert(mappings.map(m => ({
            tcgdex_id: m.tcgdex_id,
            cardmarket_id: m.cardmarket_id,
            card_name: m.card_name,
            set_name: m.set_name,
            set_code: m.set_code,
            updated_at: new Date().toISOString()
        })), {
            onConflict: 'tcgdex_id'
        })

    if (error) {
        console.error('❌ Database error:', error)
        return
    }

    console.log(`✅ Saved ${mappings.length} mappings to database`)
}

// Export for use as API endpoint or script
export { buildMappings, POPULAR_CARD_MAPPINGS }

// CLI usage
if (require.main === module) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    buildMappings(supabaseUrl, serviceKey)
        .then(() => console.log('Done!'))
        .catch(console.error)
}
