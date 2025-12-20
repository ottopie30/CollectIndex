
import { NextRequest, NextResponse } from 'next/server'
import { generateCardAnalysis } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { cardName, setName, price, trend, scores } = body

        if (!cardName || !scores) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        const result = await generateCardAnalysis(cardName, setName || 'Unknown Set', price, trend, scores)

        if (!result) {
            return NextResponse.json({
                summary: "L'analyse IA est temporairement indisponible.",
                analysis: {
                    context: "Service indisponible",
                    diagnosis: "Clé API manquante ou erreur service",
                    verdict: "Hold"
                },
                scores: { volatility: 50, growth: 50, scarcity: 50, sentiment: 50, macro: 50 }
            })
        }

        // Return the parsed Gemini response directly (already has summary, analysis, scores)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Analysis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
