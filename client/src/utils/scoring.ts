import type { WordRack, WordScore } from "@/types"
import { sum } from "./math"

/**
 * Calculates the score for a single word rack.
 * @param rack - An array of Tile objects representing the word.
 * @param multipliers - A map of word length to score multiplier.
 * @param isValid - Whether the word is valid and should receive a score.
 * @returns A WordScore object containing the base score and the applied multiplier.
 */
export function calculateRackScore(
    rack: WordRack,
    multipliers: Record<number, number>,
    isValid: boolean,
): WordScore {
    const baseScore = isValid ? sum(rack.map((tile) => tile.value)) : 0
    const wordLength = rack.length
    const multiplier = multipliers[wordLength] ?? 1 // Default to 1 if no multiplier for this length

    return { baseScore, multiplier }
}
