import { useCallback, useEffect, useState } from "react"
import Game from "./components/Game"
import { usePlayHistory } from "./hooks/usePlayHistory"
import { fetchDailyPuzzle, fetchGameRules } from "./services/gameService"
import { loadWordList } from "./services/wordValidation"
import type { DailyPuzzle, GameRules } from "./types"
import "./App.css"

type SessionStatus = "loading" | "ready"

function App() {
    const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzle | null>(null)
    const [gameRules, setGameRules] = useState<GameRules | null>(null)
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading")
    const { clearAllHistory, getHistoryForDate } = usePlayHistory()

    const loadGameData = useCallback(async () => {
        try {
            const [puzzle, rules] = await Promise.all([
                fetchDailyPuzzle(),
                fetchGameRules(),
                loadWordList(),
            ])

            setDailyPuzzle(puzzle)
            setGameRules(rules)
            setSessionStatus("ready")
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
    }, [loadGameData, clearAllHistory])

    function renderContent() {
        if (sessionStatus === "loading" || !dailyPuzzle || !gameRules) {
            return <p>Loading daily puzzle...</p>
        }

        const initialHistory = getHistoryForDate(dailyPuzzle.date)

        return (
            <Game
                puzzle={dailyPuzzle}
                gameRules={gameRules}
                initialHistory={initialHistory}
                maxTiles={7}
            />
        )
    }

    return (
        <main className="app-container">
            <h1>Tile Game</h1>
            {renderContent()}
        </main>
    )
}

export default App
