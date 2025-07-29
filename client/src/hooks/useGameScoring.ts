import { useMemo } from "react"
import { isValidWord } from "@/services/wordValidation"
import type { DailyPuzzle, GameRules, WordRack } from "@/types"
import { sum } from "@/utils/math"
import { calculateRackScore } from "@/utils/scoring"

/**
 * A custom hook to manage scoring logic for the game.
 * It calculates the scores for the player's current racks and the target solution.
 * @param wordRacks The player's current arrangement of tiles in the racks.
 * @param puzzle The daily puzzle data, including the target solution.
 * @param gameRules The current game rules, including scoring multipliers.
 * @returns An object containing the player's rack scores, the target scores, the player's total score, and the target total score.
 */
export function useGameScoring(wordRacks: WordRack[], puzzle: DailyPuzzle, gameRules: GameRules) {
    const { multipliers } = gameRules

    const rackScores = useMemo(() => {
        return wordRacks.map((rack, idx) => {
            const word = rack.map((tile) => tile.letter).join("")
            const requiredLength = idx + 3
            const isValid = word.length === requiredLength && isValidWord(word)
            const multiplier = multipliers[requiredLength] ?? 1
            return calculateRackScore(rack, multiplier, isValid)
        })
    }, [wordRacks, multipliers])

    const targetScores = useMemo(
        () =>
            puzzle.targetSolution.map((rack, idx) => {
                const multiplier = multipliers[idx + 3] ?? 1
                return calculateRackScore(rack, multiplier, true)
            }),
        [puzzle.targetSolution, multipliers],
    )

    const totalScore = useMemo(
        () => sum(rackScores.map((s) => s.baseScore * s.multiplier)),
        [rackScores],
    )
    const targetScore = useMemo(
        () => sum(targetScores.map((s) => s.baseScore * s.multiplier)),
        [targetScores],
    )

    return { rackScores, targetScores, totalScore, targetScore }
}
