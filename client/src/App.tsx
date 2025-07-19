import { useCallback, useEffect, useState } from "react"
import Game from "./components/Game"
import type { DailyPuzzle, GameRules } from "./types"
import "./App.css"
import { fetchDailyPuzzle, fetchGameRules } from "./services/gameService"
import { clearAllHistory, getHistoryForDate } from "./services/playHistory"
import { loadWordList } from "./utils/wordValidation"

function App() {
    const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzle | null>(null)
    const [gameRules, setGameRules] = useState<GameRules | null>(null)
    const [hasPlayed, setHasPlayed] = useState(false)

    const loadGameData = useCallback(async () => {
        try {
            const [puzzle, rules] = await Promise.all([
                fetchDailyPuzzle(),
                fetchGameRules(),
                loadWordList(),
            ])

            setDailyPuzzle(puzzle)
            setGameRules(rules)

            if (getHistoryForDate(puzzle.date)) {
                setHasPlayed(true)
            } else {
                setHasPlayed(false)
            }
        } catch (error) {
            console.error("Failed to load game data", error)
            // TODO: Render an error message to the user
        }
    }, [])

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("reset") === "true") {
            clearAllHistory()
            window.history.replaceState({}, document.title, window.location.pathname)
        }

        loadGameData()
    }, [loadGameData])

    function renderContent() {
        if (hasPlayed) {
            // Maybe TODO: Show the results from localStorage
            return <h2>You've already played today's puzzle. Come back tomorrow!</h2>
        }

        if (!dailyPuzzle || !gameRules) {
            return <p>Loading daily puzzle...</p>
        }

        return <Game puzzle={dailyPuzzle} gameRules={gameRules} maxTiles={7} />
    }

    return (
        <div>
            <h1>Tile Game</h1>
            {renderContent()}
        </div>
    )
}

export default App
