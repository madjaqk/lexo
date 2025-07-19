import type { WordScore } from "@/types"
import ShareButton from "./ShareButton"
import { sum } from "@/utils/math"

export interface ScoreReportProps {
    rackScores: WordScore[];
    targetScores: WordScore[];
    date: string;
}

export default function ScoreReport({ rackScores, targetScores, date }: ScoreReportProps) {
    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))
    const scoreDifference = Math.abs(totalScore - targetScore);
    const isOverTarget = totalScore >= targetScore;

    return (
        <>Your score was {scoreDifference} {isOverTarget ? "over": "under"} the target! {isOverTarget ? "Nicely done!" : "Better luck next time!"}  <ShareButton rackScores={rackScores} targetScores={targetScores} date={date} /></>
    );
}
