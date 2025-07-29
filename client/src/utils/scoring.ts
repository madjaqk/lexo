import type { WordRack, WordScore } from "@/types"
import { sum } from "./math"

/**
 * Calculates the score for a single word rack.
 * @param rack - An array of Tile objects representing the word.
 * @param isValid - Whether the word is valid and should receive a score.
 * @returns A WordScore object containing the base score and the applied multiplier.
 */
export function calculateRackScore(
    rack: WordRack,
    multiplier: number,
    isValid: boolean,
): WordScore {
    const baseScore = isValid ? sum(rack.map((tile) => tile.value)) : 0
    return { baseScore, multiplier }
}
