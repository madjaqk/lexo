import type { WordScore } from "@/types"
import { sum } from "@/utils/math"
import ShareButton from "./ShareButton"

export interface ScoreReportProps {
    rackScores: WordScore[]
    targetScores: WordScore[]
    date: string
}

export default function ScoreReport({ rackScores, targetScores, date }: ScoreReportProps) {
    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))
    const scoreDifference = Math.abs(totalScore - targetScore)
    const isOverTarget = totalScore >= targetScore

    return (
        <>
            Your score was {scoreDifference} {isOverTarget ? "over" : "under"} the target!{" "}
            {totalScore === targetScore ? "Great minds think alike." : isOverTarget ? "Nicely done!" : "Better luck next time!"}{" "}
            <ShareButton rackScores={rackScores} targetScores={targetScores} date={date} />
        </>
    )
}
