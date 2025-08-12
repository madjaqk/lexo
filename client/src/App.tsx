import { useEffect } from "react"
import { useLoaderData, useSearchParams } from "react-router"
import Game from "./components/Game"
import { usePlayHistory } from "./hooks/usePlayHistory"
import { fetchDailyPuzzle, fetchGameRules } from "./services/gameService"
import { loadWordList } from "./services/wordValidation"
import type { DailyPuzzle, GameRules } from "./types"
import "./App.css"
/**
 * The loader function runs before the component renders.
 * It fetches all the necessary data for the main application view.
 * For now, it only fetches the puzzle for the current day.
 */
export async function loader() {
    // Fetch all initial data in parallel for performance.
    // If any of these promises reject, React Router will catch it and render the nearest `errorElement`.
    const [puzzle, rules] = await Promise.all([
        fetchDailyPuzzle(),
        fetchGameRules(),
        loadWordList(),
    ])

    return { puzzle, rules }
}

function App() {
    // Data from the loader is provided here. We can safely cast the type
    // because the router would have rendered an error boundary if data was missing.
    const { puzzle, rules } = useLoaderData() as { puzzle: DailyPuzzle; rules: GameRules }
    const [searchParams, setSearchParams] = useSearchParams()
    const { clearAllHistory, getHistoryForDate } = usePlayHistory()

    useEffect(() => {
        // This effect runs on mount to handle the one-time `reset` parameter.
        if (searchParams.get("reset") === "true") {
            clearAllHistory()
            // Use setSearchParams to remove the 'reset' param from the URL without a page reload.
            const newParams = new URLSearchParams(searchParams)
            newParams.delete("reset")
            setSearchParams(newParams, { replace: true })
        }
    }, [searchParams, setSearchParams, clearAllHistory])

    const initialHistory = getHistoryForDate(puzzle.date)

    return (
        <main className="app-container">
            <h1>Tile Game</h1>
            <Game puzzle={puzzle} gameRules={rules} initialHistory={initialHistory} maxTiles={7} />
        </main>
    )
}

export default App
