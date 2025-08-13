import type { DailyPuzzle, GameRules } from "@/types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

export async function fetchWordList(): Promise<Set<string>> {
    const response = await fetch("/words-full.txt")
    if (!response.ok) {
        throw response
    }
    const text = await response.text()
    // Split by newline, trim whitespace, convert to uppercase, and filter out empty lines
    const words = text
        .split("\n")
        .map((w) => w.trim().toUpperCase())
        .filter(Boolean)
    return new Set(words)
}

export async function fetchGameRules(): Promise<GameRules> {
    const response = await fetch(`${BASE_URL}/config`)
    if (!response.ok) {
        throw response
    }
    return response.json()
}

export async function fetchDailyPuzzle(date?: string): Promise<DailyPuzzle> {
    const url = date ? `${BASE_URL}/puzzle/${date}` : `${BASE_URL}/puzzle/today`
    const response = await fetch(url)

    if (!response.ok) {
        throw response
    }
    return response.json()
}
