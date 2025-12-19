
import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.pokemontcg.io/v2/cards'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id

    if (!id) {
        return NextResponse.json({ error: 'Card ID required' }, { status: 400 })
    }

    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            headers: {
                'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
            }
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Pokemon TCG API Error: ${response.status}` },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Proxy ID Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
