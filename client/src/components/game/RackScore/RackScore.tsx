import { useEffect, useRef, useState } from "react"
import type { WordRack, WordScore } from "@/types"
import "./RackScore.css"

export interface RackScoreProps {
    rackScore: WordScore
    rackIndex: number
    tiles: WordRack
}

function RackScore({ rackScore, rackIndex, tiles }: RackScoreProps) {
    const { baseScore, multiplier } = rackScore
    const [announcement, setAnnouncement] = useState("")
    const isInitialMount = useRef(true)

    // Announce when the validity of the rack changes.
    useEffect(() => {
        // Don't announce on the initial render of the component.
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        if (baseScore > 0) {
            const word = tiles.map((t) => t.letter).join("")
            setAnnouncement(`Rack ${rackIndex + 1} is now a valid word: ${word}.`)
        } else {
            setAnnouncement(`Rack ${rackIndex + 1} is now invalid.`)
        }
    }, [baseScore, tiles, rackIndex])

    return (
        <div className="score rack-score">
            <div className="score-piece base-score">{baseScore}</div>
            <div className="score-piece multiplier">× {multiplier} =</div>
            <div className="score-piece total-score">{baseScore * multiplier}</div>
            <output className="sr-only" aria-live="polite">
                {announcement}
            </output>
        </div>
    )
}

export default RackScore
