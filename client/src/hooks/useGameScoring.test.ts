import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { isValidWord } from "@/services/wordValidation"
import type { DailyPuzzle, GameRules, WordRack } from "@/types"
import { useGameScoring } from "./useGameScoring"

// Mock the word validation service, as we are not testing the dictionary here.
vi.mock("@/services/wordValidation", () => ({
    isValidWord: vi.fn(),
}))

// Test Data based on your project's types and game rules.
const mockGameRules: GameRules = {
    timerSeconds: 300,
    multipliers: { 3: 6, 4: 5, 5: 4, 6: 3 },
}

const CAT_RACK: WordRack = [
    { id: "t1", letter: "C", value: 3 },
    { id: "t2", letter: "A", value: 1 },
    { id: "t3", letter: "T", value: 1 },
] // baseScore = 5

const BIRD_RACK: WordRack = [
    { id: "t4", letter: "B", value: 3 },
    { id: "t5", letter: "I", value: 1 },
    { id: "t6", letter: "R", value: 1 },
    { id: "t7", letter: "D", value: 1 },
] // baseScore = 6

const FAKE_RACK: WordRack = [
    { id: "t8", letter: "F", value: 4 },
    { id: "t9", letter: "A", value: 1 },
    { id: "t10", letter: "K", value: 6 },
] // baseScore = 11, word is FAK

const mockPuzzle: DailyPuzzle = {
    date: "2025-07-15",
    initialRacks: [], // Not used by the hook
    targetSolution: [CAT_RACK, BIRD_RACK], // Target score: (5*6) + (6*5) = 30 + 30 = 60
}

describe("useGameScoring", () => {
    beforeEach(() => {
        // Reset mocks before each test to ensure a clean state
        vi.mocked(isValidWord).mockClear()
    })

    it("should calculate target scores and total target score correctly", () => {
        const { result } = renderHook(() => useGameScoring([], mockPuzzle, mockGameRules))

        expect(result.current.targetScores).toEqual([
            { baseScore: 5, multiplier: 6 }, // CAT
            { baseScore: 6, multiplier: 5 }, // BIRD
        ])
        expect(result.current.targetScore).toBe(60)
    })

    it("should return a total score of 0 if player racks are empty", () => {
        const { result } = renderHook(() => useGameScoring([], mockPuzzle, mockGameRules))
        expect(result.current.totalScore).toBe(0)
        expect(result.current.rackScores).toEqual([])
    })

    it("should calculate player scores and total score for valid words", () => {
        vi.mocked(isValidWord).mockImplementation((word) =>
            ["CAT", "BIRD"].includes(word.toUpperCase()),
        )

        const playerRacks = [CAT_RACK, BIRD_RACK]
        const { result } = renderHook(() => useGameScoring(playerRacks, mockPuzzle, mockGameRules))

        expect(result.current.rackScores).toEqual([
            { baseScore: 5, multiplier: 6 }, // CAT
            { baseScore: 6, multiplier: 5 }, // BIRD
        ])
        expect(result.current.totalScore).toBe(60)
        expect(vi.mocked(isValidWord)).toHaveBeenCalledWith("CAT")
        expect(vi.mocked(isValidWord)).toHaveBeenCalledWith("BIRD")
    })

    it("should return a base score of 0 for words that are not valid", () => {
        vi.mocked(isValidWord).mockImplementation((word) => word.toUpperCase() === "BIRD") // 'CAT' is not valid

        const playerRacks = [CAT_RACK, BIRD_RACK]
        const { result } = renderHook(() => useGameScoring(playerRacks, mockPuzzle, mockGameRules))

        expect(result.current.rackScores).toEqual([
            { baseScore: 0, multiplier: 6 }, // CAT is invalid
            { baseScore: 6, multiplier: 5 }, // BIRD is valid
        ])
        expect(result.current.totalScore).toBe(30)
    })

    it("should return a base score of 0 for words with incorrect length for the rack", () => {
        vi.mocked(isValidWord).mockReturnValue(true) // Assume all words are valid dictionary words

        // FAKE_RACK has 3 tiles, but we place it in the 4-letter word slot (index 1)
        const playerRacks = [CAT_RACK, FAKE_RACK]
        const { result } = renderHook(() => useGameScoring(playerRacks, mockPuzzle, mockGameRules))

        expect(result.current.rackScores).toEqual([
            { baseScore: 5, multiplier: 6 }, // CAT is valid
            { baseScore: 0, multiplier: 5 }, // FAKE_RACK has wrong length for this slot
        ])
        expect(result.current.totalScore).toBe(30)

        // isValidWord should not have been called for 'FAK' because the length check fails first
        expect(vi.mocked(isValidWord)).toHaveBeenCalledWith("CAT")
        expect(vi.mocked(isValidWord)).not.toHaveBeenCalledWith("FAK")
    })

    it("should return a base score of 0 for a rack with no tiles", () => {
        const { result } = renderHook(() => useGameScoring([[]], mockPuzzle, mockGameRules))
        expect(result.current.rackScores).toEqual([{ baseScore: 0, multiplier: 6 }])
        expect(result.current.totalScore).toBe(0)
    })

    it("should use a multiplier of 1 for length not in multipliers map", () => {
        const playerRacks = [CAT_RACK]
        const newRules = { ...mockGameRules, multipliers: {} }
        const { result } = renderHook(() => useGameScoring(playerRacks, mockPuzzle, newRules))

        expect(result.current.rackScores).toEqual([
            { baseScore: 5, multiplier: 1 }, // CAT
        ])
        expect(result.current.totalScore).toBe(5)
    })
})
