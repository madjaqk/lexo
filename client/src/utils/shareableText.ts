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
