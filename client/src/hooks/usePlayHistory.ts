import { useCallback } from "react"
import { useLocalStorage } from "usehooks-ts"
import type { PlayHistory, PlayHistoryRecord } from "@/types"

export const LOCAL_STORAGE_KEY = "tile-game-history"

/**
 * A custom hook to manage the player's game history in localStorage.
 * @returns An object with the full history and functions to interact with it.
 */
export function usePlayHistory() {
    const [history, setHistory, removeHistory] = useLocalStorage<PlayHistory>(LOCAL_STORAGE_KEY, {})

    const getHistoryForDate = useCallback(
        (date: string): PlayHistoryRecord | null => {
            return history[date] || null
        },
        [history],
    )

    const saveHistoryForDate = useCallback(
        (date: string, record: PlayHistoryRecord) => {
            // usehooks-ts's setter function can take a callback to update the previous state
            setHistory((prevHistory) => ({
                ...prevHistory,
                [date]: record,
            }))
        },
        [setHistory],
    )

    const clearAllHistory = useCallback(() => {
        removeHistory()
    }, [removeHistory])

    return { history, getHistoryForDate, saveHistoryForDate, clearAllHistory }
}
