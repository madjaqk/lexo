import type { WordRack, WordScore } from "@/types"
import { calculateScoreSummary, generateScoreReportText } from "@/utils/shareableText"
import ShareButton from "./ShareButton"
import "./ScoreReport.css"

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
    const scoreSummary = calculateScoreSummary(rackScores, targetScores)
    const reportText = generateScoreReportText(scoreSummary)
    const targetWords = targetSolution.map((rack) => rack.map((tile) => tile.letter).join(""))

    return (
        <output className="score-report" aria-live="polite">
            <span className="sr-only">
                Game completed. Your final score was {scoreSummary.totalScore}. The target solution was:
                {targetScores.map(
                    (s, idx) =>
                        `${targetWords[idx]} scored ${s.baseScore} times ${s.multiplier} equals ${s.baseScore * s.multiplier} points`,
                )}
                ...for a total of {scoreSummary.targetScore} points.
            </span>
            {reportText}{" "}
            <ShareButton rackScores={rackScores} targetScores={targetScores} date={date} />
        </output>
    )
}
