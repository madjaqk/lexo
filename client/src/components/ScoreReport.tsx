import type { WordRack, WordScore } from "@/types"
import {
	calculateScoreSummary,
	generateScoreReportText,
	generateSrSummaryText,
} from "@/utils/resultsFormatter"
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
    const srSummaryText = generateSrSummaryText(scoreSummary, targetScores, targetWords)

    return (
        <section className="score-report" aria-labelledby="score-report-heading">
            <h3 id="score-report-heading" className="sr-only">
                Final Score Report
            </h3>
            <span className="sr-only">{srSummaryText}</span>{" "}
            <span>{reportText}</span>
            <ShareButton rackScores={rackScores} targetScores={targetScores} date={date} />
        </section>
    )
}
