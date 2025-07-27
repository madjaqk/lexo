import type { Tile } from "@/types"
import { calculateRackScore } from "./scoring"

describe("calculateRackScore", () => {
    const multipliers = {
        3: 6,
        4: 5,
        5: 4,
    }

    it("should correctly calculate the score for a valid word", () => {
        const rack: Tile[] = [
            { id: "1", letter: "C", value: 3 },
            { id: "2", letter: "A", value: 1 },
            { id: "3", letter: "T", value: 1 },
        ] // Base score = 5

        const score = calculateRackScore(rack, multipliers, true)

        expect(score.baseScore).toBe(5)
        expect(score.multiplier).toBe(6) // Multiplier for length 3
    })

    it("should return a base score of 0 for an invalid word", () => {
        const rack: Tile[] = [
            { id: "1", letter: "C", value: 3 },
            { id: "2", letter: "A", value: 1 },
            { id: "3", letter: "T", value: 1 },
        ]

        // Pass `false` for the `isValid` parameter
        const score = calculateRackScore(rack, multipliers, false)

        expect(score.baseScore).toBe(0)
        expect(score.multiplier).toBe(6) // Multiplier is still calculated based on length
    })

    it("should return a base score of 0 for an empty rack", () => {
        const rack: Tile[] = []
        const score = calculateRackScore(rack, multipliers, false)

        expect(score.baseScore).toBe(0)
        expect(score.multiplier).toBe(1) // Defaults to 1 for unhandled length
    })

    it("should use a multiplier of 1 if the word length is not in the multipliers map", () => {
        const rack: Tile[] = [
            { id: "1", letter: "A", value: 1 },
            { id: "2", letter: "B", value: 3 },
        ] // Length 2 is not in multipliers

        const score = calculateRackScore(rack, multipliers, true)

        expect(score.baseScore).toBe(4)
        expect(score.multiplier).toBe(1)
    })
})
