import type { PlayHistory } from "@/types"
import "./GameHeader.css"

interface GameHeaderProps {
    date: string
    history: PlayHistory | null
    onOpenInstructions: () => void
    onOpenArchives: () => void
}

export default function GameHeader({
    date,
    history,
    onOpenInstructions,
    onOpenArchives,
}: GameHeaderProps) {
    return (
        <header className="game-header">
            <p className="game-date">DATE: {date}</p>
            <div className="header-buttons">
                <button type="button" onClick={onOpenInstructions}>
                    Instructions
                </button>
                {history && Object.keys(history).length > 0 && (
                    <button type="button" onClick={onOpenArchives}>
                        Archives
                    </button>
                )}
            </div>
        </header>
    )
}
