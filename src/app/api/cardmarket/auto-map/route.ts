import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchProductCatalog, EXPANSION_MAP, CardmarketProduct } from '@/lib/cardmarket-catalog'
import { fetchPriceGuide, CardmarketPriceGuide } from '@/lib/cardmarket'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MappingResult {
    tcgdex_id: string
    cardmarket_id: number
    card_name: string
    set_code: string
    price?: number
}

/**
 * GET /api/cardmarket/auto-map?expansion=sv8a&limit=100
 * 
 * Automatically maps cards from a specific expansion
 */
export async function GET(request: NextRequest) {
    const expansionCode = request.nextUrl.searchParams.get('expansion')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')
    const syncPrices = request.nextUrl.searchParams.get('prices') === 'true'

    if (!expansionCode) {
        // Return list of available expansions
        return NextResponse.json({
            message: 'Provide ?expansion=CODE to map cards',
            availableExpansions: EXPANSION_MAP
        })
    }

    console.log(`🔄 Auto-mapping expansion: ${expansionCode}`)
    const startTime = Date.now()

    try {
        // 1. Find Cardmarket expansion ID
        const cmExpansionId = Object.entries(EXPANSION_MAP)
            .find(([, code]) => code === expansionCode)?.[0]

        if (!cmExpansionId) {
            return NextResponse.json({
                error: `Unknown expansion: ${expansionCode}`,
                availableExpansions: EXPANSION_MAP
            }, { status: 400 })
        }

        // 2. Fetch product catalog
        const catalog = await fetchProductCatalog()
        console.log(`📦 Catalog loaded: ${catalog.size} products`)

        // 3. Get all products in this expansion
        const expansionProducts: CardmarketProduct[] = []
        for (const [, product] of catalog) {
            if (product.idExpansion === parseInt(cmExpansionId)) {
                expansionProducts.push(product)
            }
        }
        console.log(`🎴 Found ${expansionProducts.length} products in expansion ${expansionCode}`)

        // 4. Optionally fetch prices
        let priceGuide: Map<number, CardmarketPriceGuide> | null = null
        if (syncPrices) {
            priceGuide = await fetchPriceGuide()
            console.log(`💰 Loaded ${priceGuide.size} price entries`)
        }

        // 5. Create mappings
        const mappings: MappingResult[] = []

        for (const product of expansionProducts.slice(0, limit)) {
            // Parse card name (remove attack names in brackets)
            const baseName = product.name.split('[')[0].trim()

            // Try to extract card number from name if present
            // Most cards are just "Pokemon Name [Attack | Attack]"
            // We'll generate a sequential local ID

            const tcgdexId = `${expansionCode}-${product.idProduct}`

            const mapping: MappingResult = {
                tcgdex_id: tcgdexId,
                cardmarket_id: product.idProduct,
                card_name: baseName,
                set_code: expansionCode
            }

            // Add price if available
            if (priceGuide) {
                const price = priceGuide.get(product.idProduct)
                if (price?.trend) {
                    mapping.price = price.trend
                }
            }

            mappings.push(mapping)
        }

        // 6. Upsert to database
        const dbMappings = mappings.map(m => ({
            tcgdex_id: m.tcgdex_id,
            cardmarket_id: m.cardmarket_id,
            card_name: m.card_name,
            set_name: expansionCode,
            set_code: m.set_code,
            updated_at: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('cardmarket_mapping')
            .upsert(dbMappings, { onConflict: 'tcgdex_id' })

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        console.log(`✅ Mapped ${mappings.length} cards in ${duration}ms`)

        // Return sample with prices if available
        const sample = mappings.slice(0, 10).map(m => ({
            ...m,
            cardmarketUrl: `https://www.cardmarket.com/en/Pokemon/Products/Singles/${m.set_code}/${encodeURIComponent(m.card_name)}?idProduct=${m.cardmarket_id}`
        }))

        return NextResponse.json({
            success: true,
            expansion: expansionCode,
            cardmarketExpansionId: cmExpansionId,
            totalInExpansion: expansionProducts.length,
            mapped: mappings.length,
            duration: `${duration}ms`,
            sample
        })

    } catch (error: any) {
        console.error('❌ Auto-map failed:', error)
        return NextResponse.json(
            { error: error.message || 'Auto-map failed' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/cardmarket/auto-map
 * Body: { expansions: ["sv8a", "sv4", ...] }
 * 
 * Bulk map multiple expansions
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { expansions } = body

        if (!expansions || !Array.isArray(expansions)) {
            return NextResponse.json(
                { error: 'expansions array required' },
                { status: 400 }
            )
        }

        const results: Record<string, number> = {}

        for (const exp of expansions) {
            // Call the GET endpoint internally
            const url = new URL(request.url)
            url.searchParams.set('expansion', exp)
            url.searchParams.set('limit', '1000')
            url.searchParams.set('prices', 'true')

            const response = await GET(new NextRequest(url))
            const data = await response.json()

            results[exp] = data.mapped || 0
        }

        return NextResponse.json({
            success: true,
            results
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
