import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase admin client  
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Popular cards with their Cardmarket Product IDs
// These IDs are from Cardmarket URLs: cardmarket.com/.../idProduct=XXXX
const POPULAR_MAPPINGS: Record<string, { id: number; name: string; set: string }> = {
    // === Évolutions Prismatiques (sv8a) ===
    'sv8a-197': { id: 809099, name: 'Umbreon ex', set: 'Prismatic Evolutions' },
    'sv8a-203': { id: 809105, name: 'Pikachu ex', set: 'Prismatic Evolutions' },
    'sv8a-176': { id: 809078, name: 'Eevee', set: 'Prismatic Evolutions' },
    'sv8a-189': { id: 809091, name: 'Sylveon ex', set: 'Prismatic Evolutions' },

    // === Faille Paradoxe (sv4) ===
    'sv4-228': { id: 761282, name: 'Roaring Moon ex', set: 'Paradox Rift' },
    'sv4-230': { id: 761284, name: 'Iron Valiant ex', set: 'Paradox Rift' },

    // === Flammes Obsidiennes (sv3) ===
    'sv3-197': { id: 720614, name: 'Rayquaza ex', set: 'Obsidian Flames' },
    'sv3-212': { id: 720629, name: 'Charizard ex', set: 'Obsidian Flames' },

    // === 151 (sv3pt5) ===
    'sv3pt5-205': { id: 735991, name: 'Mew ex', set: 'Pokemon 151' },
    'sv3pt5-199': { id: 735985, name: 'Charizard ex', set: 'Pokemon 151' },
    'sv3pt5-172': { id: 735958, name: 'Alakazam ex', set: 'Pokemon 151' },

    // === Paldea Evolved (sv2) ===
    'sv2-258': { id: 683159, name: 'Iono', set: 'Paldea Evolved' },

    // === Crown Zenith (swsh12pt5) ===
    'swsh12pt5-GG70': { id: 686541, name: 'Charizard VSTAR', set: 'Crown Zenith' },

    // === Brilliant Stars (swsh9) ===
    'swsh9-174': { id: 601538, name: 'Charizard VSTAR', set: 'Brilliant Stars' },

    // === Base Set Classics (base1) ===
    'base1-4': { id: 271842, name: 'Charizard', set: 'Base Set' },
    'base1-15': { id: 271853, name: 'Venusaur', set: 'Base Set' },
    'base1-2': { id: 271840, name: 'Blastoise', set: 'Base Set' },
    'base1-58': { id: 271894, name: 'Pikachu', set: 'Base Set' },

    // === Lost Origin (swsh11) ===
    'swsh11-211': { id: 645871, name: 'Giratina VSTAR', set: 'Lost Origin' },

    // === Evolving Skies (swsh7) ===
    'swsh7-222': { id: 546082, name: 'Umbreon VMAX', set: 'Evolving Skies' },
    'swsh7-203': { id: 546063, name: 'Rayquaza VMAX', set: 'Evolving Skies' },
}

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
    // Optional: verify cron secret for protected access
    const authHeader = request.headers.get('authorization')
    const bypass = request.nextUrl.searchParams.get('force') === 'true'

    if (!bypass && authHeader !== `Bearer ${CRON_SECRET}`) {
        // Allow public access for initialization
    }

    console.log('🔧 Initializing popular card mappings...')

    const mappings = Object.entries(POPULAR_MAPPINGS).map(([tcgdexId, data]) => {
        const [setCode] = tcgdexId.split('-')
        return {
            tcgdex_id: tcgdexId,
            cardmarket_id: data.id,
            card_name: data.name,
            set_name: data.set,
            set_code: setCode,
            updated_at: new Date().toISOString()
        }
    })

    const { data, error } = await supabase
        .from('cardmarket_mapping')
        .upsert(mappings, { onConflict: 'tcgdex_id' })

    if (error) {
        console.error('❌ Failed to init mappings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Initialized ${mappings.length} mappings`)

    return NextResponse.json({
        success: true,
        initialized: mappings.length,
        cards: Object.keys(POPULAR_MAPPINGS)
    })
}
