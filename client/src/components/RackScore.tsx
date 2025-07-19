import type { WordScore } from "@/types"
import "./RackScore.css"

export interface RackScoreProps {
    rackScore: WordScore
}

function RackScore({ rackScore }: RackScoreProps) {
    const { baseScore, multiplier } = rackScore
    return (
        <div className="score rack-score">
            <div className="score-piece base-score">{baseScore}</div>
            <div className="score-piece multiplier">× {multiplier} =</div>
            <div className="score-piece total-score">{baseScore * multiplier}</div>
        </div>
    )
}

export default RackScore
