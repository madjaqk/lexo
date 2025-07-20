import { useCallback, useEffect, useState } from "react"
import type { DailyPuzzle, GameRules, Tile, WordScore } from "@/types"
import { sum } from "@/utils/math"
import { isValidWord } from "@/utils/wordValidation"

/**
 * A custom hook to manage all scoring logic for the game.
 * It calculates the scores for the player's current racks and the target solution.
 * @param wordRacks The player's current arrangement of tiles in the racks.
 * @param puzzle The daily puzzle data, including the target solution.
 * @param gameRules The current game rules, including scoring multipliers.
 * @returns An object containing the player's rack scores, the target scores, the player's total score, and the target total score.
 */
export function useGameScoring(
    wordRacks: Tile[][],
    puzzle: DailyPuzzle,
    gameRules: GameRules,
) {
    const [rackScores, setRackScores] = useState<WordScore[]>([])
    const [targetScores, setTargetScores] = useState<WordScore[]>([])

    const scoreRack = useCallback(
        (rack: Tile[], requiredLength: number): WordScore => {
            const word = rack.map((t) => t.letter).join("")
            let baseScore = 0
            const multiplier = gameRules.multipliers[requiredLength] || 1
            if (isValidWord(word) && word.length === requiredLength) {
                baseScore = sum(rack.map((t) => t.value))
            }
            return { baseScore, multiplier }
        },
        [gameRules],
    )

    // Calculate player's current scores whenever racks change
    useEffect(() => {
        const newRackScores = wordRacks.map((rack, idx) => scoreRack(rack, idx + 3))
        setRackScores(newRackScores)
    }, [wordRacks, scoreRack])

    // Calculate target scores once
    useEffect(() => {
        setTargetScores(puzzle.targetSolution.map((rack, idx) => scoreRack(rack, idx + 3)))
    }, [puzzle.targetSolution, scoreRack])

    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))

    return { rackScores, targetScores, totalScore, targetScore }
}
