
import { NextRequest, NextResponse } from 'next/server'
import { generateCardAnalysis } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { cardName, price, trend, scores } = body

        if (!cardName || !scores) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        const analysis = await generateCardAnalysis(cardName, price, trend, scores)

        if (!analysis) {
            return NextResponse.json({
                analysis: "L'analyse IA est temporairement indisponible (Clé API manquante ou erreur service)."
            })
        }

        return NextResponse.json({ analysis })
    } catch (error) {
        console.error('Analysis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
