import { useEffect } from "react"
import { useLoaderData, useSearchParams, type LoaderFunctionArgs } from "react-router"
import Game from "./components/Game"
import { usePlayHistory, LOCAL_STORAGE_KEY } from "./hooks/usePlayHistory"
import { fetchDailyPuzzle, fetchGameConfig } from "./services/gameService"
import { loadWordList } from "./services/wordValidation"
import type { DailyPuzzle, GameConfig, PlayHistoryRecord } from "./types"
import "./App.css"
/**
 * We can cache the results of one-time fetches at the module level.
 * This prevents re-fetching on every navigation.
 */
let gameConfigCache: GameConfig | null = null;

/**
 * The loader function runs before the component renders.
 * It fetches all the necessary data for the main application view.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const dateFromUrl = url.searchParams.get("date")

    // `loadWordList` is idempotent (it won't re-fetch if already loaded),
    // so we can fire it off in parallel.
    const wordListPromise = loadWordList()

    // For now, game rules are global and can be cached.
    // If rules become puzzle-specific in the future, this logic would change.
    const configPromise = gameConfigCache ? Promise.resolve(gameConfigCache) : fetchGameConfig()

    const puzzlePromise = fetchDailyPuzzle(dateFromUrl || undefined)

    // Await all promises. This ensures all necessary data is loaded before rendering.
    const [puzzle, config] = await Promise.all([puzzlePromise, configPromise]);
    await wordListPromise; // Ensure word list is also ready.

    // Now that we have the puzzle, we know the correct date (either from the URL or "today").
    // We can now fetch the play history for that specific date from localStorage.
    // This logic is duplicated from the `usePlayHistory` hook, as hooks can't be used in loaders.
    const historyRaw = localStorage.getItem(LOCAL_STORAGE_KEY)
    const history = historyRaw ? JSON.parse(historyRaw) : {}
    const initialHistory = history[puzzle.date] || null

    if (!gameConfigCache) {
        gameConfigCache = config
    }

    return { puzzle, config, initialHistory }
}

function App() {
    // Data from the loader is provided here. We can safely cast the type
    // because the router would have rendered an error boundary if data was missing.
    const { puzzle, config, initialHistory } = useLoaderData() as {
        puzzle: DailyPuzzle;
        config: GameConfig;
        initialHistory: PlayHistoryRecord | null;
    }
    const [searchParams, setSearchParams] = useSearchParams()
    const { clearAllHistory } = usePlayHistory()

    /**
     * This function will be passed down to the Archives modal.
     * When a date is selected, it updates the URL search params,
     * which triggers React Router to re-run the loader and fetch the new puzzle.
     */
    function handleDateSelect(date: string) {
        setSearchParams({ date })
    }

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

    return (
        <main className="app-container">
            <h1>Tile Game</h1>
            <Game
                puzzle={puzzle}
                gameConfig={config}
                initialHistory={initialHistory}
                onDateSelect={handleDateSelect}
                maxTiles={7}
            />
        </main>
    )
}

export default App
