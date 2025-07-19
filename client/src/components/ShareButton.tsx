import type { WordScore } from "@/types"
import { sum } from "@/utils/math"
import "./ShareButton.css"

interface ShareButtonProps {
    rackScores: WordScore[];
    targetScores: WordScore[];
    date: string
}

export default function ShareButton({ rackScores, targetScores, date }: ShareButtonProps) {
    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))
    const scoreDifference = Math.abs(totalScore - targetScore);
    const isOverTarget = totalScore >= targetScore;

    const message = [
        `[Tile Game Name tk] — ${date}`,
    ]

    for (let i = 0; i < rackScores.length; i++) {
        const score = rackScores[i];
        message.push(`${"?".repeat(i + 3)} ${score.baseScore} × ${score.multiplier} = ${score.baseScore * score.multiplier}`);
    }

    message.push(`Total: ${totalScore} (${scoreDifference} ${isOverTarget ? "over" : "under"} the target of ${targetScore})`)
    message.push("Sharable/shortened URL tk")

    function copyToClipboard() {
        navigator.clipboard.writeText(message.join("\n"))
        console.log("Copied to clipboard:", message.join("\n"))
        alert("Copied to clipboard!") // TODO: Replace with a nicer UI notification
    }

    return (
        <button type="button" className="share-button" onClick={copyToClipboard}>
            Share
        </button>
    );
}
