import { useEffect } from "react"
import { useLoaderData, useSearchParams, type LoaderFunctionArgs } from "react-router"
import Game from "./components/Game"
import { usePlayHistory } from "./hooks/usePlayHistory"
import { fetchDailyPuzzle, fetchGameRules } from "./services/gameService"
import { loadWordList } from "./services/wordValidation"
import type { DailyPuzzle, GameRules } from "./types"
import "./App.css"
/**
 * We can cache the results of one-time fetches at the module level.
 * This prevents re-fetching on every navigation.
 */
let gameRulesCache: GameRules | null = null;

/**
 * The loader function runs before the component renders.
 * It fetches all the necessary data for the main application view.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const date = url.searchParams.get("date")

    // `loadWordList` is idempotent (it won't re-fetch if already loaded),
    // so we can fire it off in parallel.
    const wordListPromise = loadWordList()

    // For now, game rules are global and can be cached.
    // If rules become puzzle-specific in the future, this logic would change.
    const rulesPromise = gameRulesCache ? Promise.resolve(gameRulesCache) : fetchGameRules()

    const puzzlePromise = fetchDailyPuzzle(date || undefined);

    // Await all promises. This ensures all necessary data is loaded before rendering.
    const [puzzle, rules] = await Promise.all([puzzlePromise, rulesPromise]);
    await wordListPromise; // Ensure word list is also ready.

    if (!gameRulesCache) {
        gameRulesCache = rules;
    }

    return { puzzle, rules };
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
