import type { WordScore } from "@/types"
import { sum } from "@/utils/math"

export interface ScoreSummary {
    totalScore: number
    targetScore: number
    scoreDifference: number
    isOverTarget: boolean
}

export const TILE_COLORS = ["🟨", "🟩", "🟦", "🟪"]

export function calculateScoreSummary(
    rackScores: WordScore[],
    targetScores: WordScore[],
): ScoreSummary {
    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))
    const scoreDifference = Math.abs(totalScore - targetScore)
    const isOverTarget = totalScore >= targetScore

    return { totalScore, targetScore, scoreDifference, isOverTarget }
}

export function generateShareText(
    rackScores: WordScore[],
    scoreSummary: ScoreSummary,
    date: string,
): string {
    const { totalScore, targetScore, scoreDifference, isOverTarget } = scoreSummary

    const scoreLines = rackScores.map(
        (score, i) =>
            `${TILE_COLORS[i].repeat(i + 3)}${"⬜".repeat(3 - i)} ${score.baseScore} × ${score.multiplier} = ${score.baseScore * score.multiplier}`,
    )

    const summaryLine = `Total: ${totalScore} / ${targetScore} (${isOverTarget ? "🔥+" : "🧊-"}${scoreDifference})`

    return [
        `[Tile Game Name tk] — ${date}`,
        ...scoreLines,
        summaryLine,
        "Shareable/shortened URL tk",
    ].join("\n")
}

export function generateScoreReportText(scoreSummary: ScoreSummary): string {
    const { totalScore, scoreDifference, isOverTarget } = scoreSummary
    const comparison =
        totalScore === scoreSummary.targetScore
            ? "Great minds think alike."
            : isOverTarget
              ? "Nicely done!"
              : "Better luck next time!"
    return `Your score was ${scoreDifference} ${isOverTarget ? "over" : "under"} the target! ${comparison}`
}

/**
 * Generates a detailed summary string intended for screen readers.
 * @param summary The calculated score summary.
 * @param targetScores The array of target word scores.
 * @param targetWords The array of target word strings.
 * @returns A detailed, human-readable string for accessibility.
 */
export function generateSrSummaryText(
	summary: ScoreSummary,
	targetScores: WordScore[],
	targetWords: string[],
): string {
	const intro = `Game completed. Your final score was ${summary.totalScore}.`
	const solutionDetails = targetScores
		.map(
			(s, idx) =>
				`${targetWords[idx]} scored ${s.baseScore} times ${s.multiplier} equals ${s.baseScore * s.multiplier} points.`,
		)
		.join(" ")
	const outro = `...for a total of ${summary.targetScore} points.`
	return `${intro} The target solution was: ${solutionDetails} ${outro}`
}
