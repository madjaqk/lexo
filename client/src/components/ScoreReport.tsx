import type { WordRack, WordScore } from "@/types"
import { sum } from "@/utils/math"
import ShareButton from "./ShareButton"

export interface ScoreReportProps {
    rackScores: WordScore[]
    targetScores: WordScore[]
    targetSolution: WordRack[]
    date: string
}

export default function ScoreReport({
    rackScores,
    targetScores,
    targetSolution,
    date,
}: ScoreReportProps) {
    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))
    const scoreDifference = Math.abs(totalScore - targetScore)
    const isOverTarget = totalScore >= targetScore

    const targetWords = targetSolution.map((rack) => rack.map((tile) => tile.letter).join(""))

    return (
        <output aria-live="polite">
            <span className="sr-only">
                Game completed. Your final score was {totalScore}. The target solution was:
                {targetScores.map(
                    (s, idx) =>
                        `${targetWords[idx]} scored ${s.baseScore} times ${s.multiplier} equals ${s.baseScore * s.multiplier} points`,
                )}
                ...for a total of {targetScore} points.
            </span>
            Your score was {scoreDifference} {isOverTarget ? "over" : "under"} the target!{" "}
            {totalScore === targetScore
                ? "Great minds think alike."
                : isOverTarget
                  ? "Nicely done!"
                  : "Better luck next time!"}{" "}
            <ShareButton rackScores={rackScores} targetScores={targetScores} date={date} />
        </output>
    )
}
