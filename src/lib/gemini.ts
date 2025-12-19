
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set. AI features will be disabled.')
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

// Use the latest flash model available
const MODEL_NAME = 'gemini-3-flash-preview' // or 'gemini-2.0-flash-exp' if available to user

export async function generateCardAnalysis(cardName: string, price: number, trend: number, scores: any) {
    if (!genAI) return null

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json"
            }
        })

        const prompt = `
        Act as a professional Pokemon Card Market Analyst.
        Analyze the investment potential of this card based on the provided technical data.

        Card: ${cardName}
        Current Price: ${price}€
        30-Day Trend: ${trend > 0 ? '+' : ''}${trend}%
        
        Technical Scores (0-100):
        - Overall Speculation Score: ${scores.total}
        - Volatility: ${scores.volatility}
        - Scarcity: ${scores.scarcity}
        
        Task:
        Provide a JSON response with:
        1. "analysis": A nested object with:
            - "context": brief context (vintage/modern/etc)
            - "diagnosis": what the scores indicate
            - "verdict": Buy, Hold, or Sell verdict
        2. "scores": Evaluate and generate 5 dimension scores (0-100) based on your expert knowledge and the data:
            - "volatility": Stability (100 = Very Stable/Safe, 0 = Volatile)
            - "growth": Potential for growth (100 = High potential)
            - "scarcity": Supply constraints
            - "sentiment": Market desirability
            - "macro": Economic resilience

        Tone: Professional, direct, financial.
        Output Language: French.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        try {
            return JSON.parse(text)
        } catch (e) {
            console.error('Failed to parse Gemini JSON:', e)
            return null
        }
    } catch (error) {
        console.error('Gemini Analysis Failed:', error)
        return null
    }
}
