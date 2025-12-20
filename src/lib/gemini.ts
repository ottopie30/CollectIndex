
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set. AI features will be disabled.')
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

// Use gemini-2.0-flash-exp for best performance
const MODEL_NAME = 'gemini-2.0-flash-exp'

export async function generateCardAnalysis(cardName: string, setName: string, price: number, trend: number, scores: any) {
    if (!genAI) return null

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.0,
            }
        })

        const prompt = `
        Act as a professional Pokemon Card Market Analyst.
        Analyze the investment potential of this card based on the provided technical data.

        Card: ${cardName}
        Set: ${setName}
        Current Price: ${price.toFixed(2)}€
        30-Day Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%
        
        Technical Scores (0-100):
        - Overall Speculation Score: ${scores.total}
        - Volatility: ${scores.volatility}
        - Scarcity: ${scores.scarcity}
        
        Task:
        Provide a JSON response with:
        1. "summary": A concise 2-3 sentence analysis explaining why this card is or isn't a good investment right now. Be specific and mention the set (${setName}) and key factors.
        2. "analysis": A nested object with:
            - "context": brief context about the set and card era
            - "diagnosis": what the scores indicate
            - "verdict": Buy, Hold, or Sell verdict
        3. "scores": Evaluate and generate 5 dimension scores (0-100) based on your expert knowledge and the data:
            - "volatility": Stability (100 = Very Stable/Safe, 0 = Volatile)
            - "growth": Potential for growth (100 = High potential)
            - "scarcity": Supply constraints
            - "sentiment": Market desirability
            - "macro": Economic resilience

        Tone: Professional, direct, financial.
        Output Language: French.
        `

        console.log('📤 Calling Gemini with:', { cardName, setName, price, trend })

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log('📥 Gemini response received, length:', text.length)

        try {
            const parsed = JSON.parse(text)
            console.log('✅ Gemini JSON parsed successfully')
            return parsed
        } catch (e) {
            console.error('❌ Failed to parse Gemini JSON:', e, 'Raw text:', text.substring(0, 500))
            return null
        }
    } catch (error: any) {
        console.error('❌ Gemini Analysis Failed:', error?.message || error)
        return null
    }
}
