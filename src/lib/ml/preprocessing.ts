/**
 * ML Preprocessing Utilities
 */

// Normalize data using MinMax scaling
export function normalizeData(data: number[]): { normalized: number[], min: number, max: number } {
    const min = Math.min(...data)
    const max = Math.max(...data)

    // Avoid division by zero
    if (min === max) {
        return { normalized: data.map(() => 0.5), min, max }
    }

    const normalized = data.map(val => (val - min) / (max - min))
    return { normalized, min, max }
}

// Denormalize data back to original scale
export function denormalizeData(data: number[], min: number, max: number): number[] {
    return data.map(val => val * (max - min) + min)
}

// Create sequences for LSTM (sliding window)
// Input: [1,2,3,4,5], window=3
// Output: X=[[1,2,3], [2,3,4]], y=[4, 5]
export function createSequences(data: number[], windowSize: number): { inputs: number[][], labels: number[] } {
    const inputs: number[][] = []
    const labels: number[] = []

    for (let i = 0; i <= data.length - windowSize - 1; i++) {
        const sequence = data.slice(i, i + windowSize)
        const label = data[i + windowSize]
        inputs.push(sequence)
        labels.push(label)
    }

    return { inputs, labels }
}
