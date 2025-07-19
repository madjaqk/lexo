export interface Tile {
    id: string
    letter: string
    value: number
}

export type WordRack = Tile[]

export interface WordScore {
    baseScore: number
    multiplier: number
}

export interface PuzzleState {
    wordRacks: WordRack[] // Four racks, each with some tiles
}

export interface DailyPuzzle {
    initialRacks: WordRack[]
    targetSolution: WordRack[]
    date: string // ISO date string
}

export interface GameRules {
    timerSeconds: number
    multipliers: { [length: number]: number }
}

export type GameState = "pre-game" | "playing" | "finished"
