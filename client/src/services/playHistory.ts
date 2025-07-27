import type { WordRack } from "@/types"

export const LOCAL_STORAGE_KEY = "tile-game-history"

export interface PlayHistoryRecord {
    racks: WordRack[]
    score: number
    targetScore: number
}

export interface PlayHistory {
    [date: string]: PlayHistoryRecord
}

export function getHistoryForDate(date: string): PlayHistoryRecord | null {
    const historyStr = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!historyStr) {
        return null
    }

    try {
        const history: PlayHistory = JSON.parse(historyStr)
        return history[date] || null
    } catch (e) {
        console.error("Failed to parse play history", e)
        return null
    }
}

export function saveHistoryForDate(date: string, record: PlayHistoryRecord): void {
    const historyStr = localStorage.getItem(LOCAL_STORAGE_KEY)
    let history: PlayHistory = {}

    if (historyStr) {
        try {
            history = JSON.parse(historyStr)
        } catch (e) {
            console.error("Failed to parse existing play history", e)
        }
    }

    history[date] = record
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history))
}

export function clearAllHistory(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
}
