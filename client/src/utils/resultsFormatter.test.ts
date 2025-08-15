import type { WordScore } from "@/types"
import {
    calculateScoreSummary,
    generateScoreReportText,
    generateShareText,
    generateSrSummaryText,
    type ScoreSummary,
    TILE_COLORS,
} from "./resultsFormatter"

describe("shareableText utility", () => {
    // Mock data for a scenario where the player's score is higher than the target
    const playerScoresOver: WordScore[] = [
        { baseScore: 10, multiplier: 6 }, // 60
        { baseScore: 12, multiplier: 5 }, // 60
    ] // Total: 120
    const targetScores: WordScore[] = [
        { baseScore: 8, multiplier: 6 }, // 48
        { baseScore: 10, multiplier: 5 }, // 50
    ] // Total: 98

    // Mock data for a scenario where the player's score is lower than the target
    const playerScoresUnder: WordScore[] = [
        { baseScore: 5, multiplier: 6 }, // 30
        { baseScore: 8, multiplier: 5 }, // 40
    ] // Total: 70

    describe("calculateScoreSummary", () => {
        it("should correctly calculate scores when player is over target", () => {
            const summary = calculateScoreSummary(playerScoresOver, targetScores)
            expect(summary.totalScore).toBe(120)
            expect(summary.targetScore).toBe(98)
            expect(summary.scoreDifference).toBe(22)
            expect(summary.isOverTarget).toBe(true)
        })

        it("should correctly calculate scores when player is under target", () => {
            const summary = calculateScoreSummary(playerScoresUnder, targetScores)
            expect(summary.totalScore).toBe(70)
            expect(summary.targetScore).toBe(98)
            expect(summary.scoreDifference).toBe(28)
            expect(summary.isOverTarget).toBe(false)
        })

        it("should correctly calculate scores when scores are equal", () => {
            const summary = calculateScoreSummary(playerScoresOver, playerScoresOver)
            expect(summary.totalScore).toBe(120)
            expect(summary.targetScore).toBe(120)
            expect(summary.scoreDifference).toBe(0)
            expect(summary.isOverTarget).toBe(true) // >= is true
        })
    })

    describe("generateScoreReportText", () => {
        it('should generate "over target" message', () => {
            const summary: ScoreSummary = {
                totalScore: 120,
                targetScore: 98,
                scoreDifference: 22,
                isOverTarget: true,
            }
            const reportText = generateScoreReportText(summary)
            expect(reportText).toBe("Your score was 22 over the target! Nicely done!")
        })

        it('should generate "under target" message', () => {
            const summary: ScoreSummary = {
                totalScore: 70,
                targetScore: 98,
                scoreDifference: 28,
                isOverTarget: false,
            }
            const reportText = generateScoreReportText(summary)
            expect(reportText).toBe("Your score was 28 under the target! Better luck next time!")
        })

        it('should generate "equal scores" message', () => {
            const summary: ScoreSummary = {
                totalScore: 120,
                targetScore: 120,
                scoreDifference: 0,
                isOverTarget: true,
            }
            const reportText = generateScoreReportText(summary)
            expect(reportText).toBe("Your score was 0 over the target! Great minds think alike.")
        })
    })

    describe("generateShareText", () => {
        const playerScores: WordScore[] = [
            { baseScore: 5, multiplier: 6 }, // 30
            { baseScore: 8, multiplier: 5 }, // 40
            { baseScore: 10, multiplier: 4 }, // 40
            { baseScore: 15, multiplier: 3 }, // 45
        ] // Total: 155

        const summary: ScoreSummary = {
            totalScore: 155,
            targetScore: 123,
            scoreDifference: 22,
            isOverTarget: true,
        }
        const testDate = "2025-08-15"
        const shareText = generateShareText(playerScores, summary, testDate)
        const lines = shareText.split("\n")

        it("should start with the correct header line", () => {
            expect(lines[0]).toBe(`${import.meta.env.VITE_APP_NAME} — ${testDate}`)
        })

        it("should include the correct score for each rack", () => {
            playerScores.forEach((score, idx) => {
                const scoreLine = lines[idx + 1]
                const expectedScore = `${score.baseScore} × ${score.multiplier} = ${score.baseScore * score.multiplier}`
                expect(scoreLine).toContain(expectedScore)
            })
        })

        it("should include the correct emoji tiles for each rack", () => {
            TILE_COLORS.forEach((color, i) => {
                const scoreLine = lines[i + 1]
                expect(scoreLine).toContain(color.repeat(i + 3) + "⬜".repeat(3 - i))
            })

            // Last rack should have no white tiles
            expect(lines[lines.length - 1]).not.toContain("⬜")
        })

        it("should include the correct total", () => {
            expect(lines[5]).toContain(`${summary.totalScore} / ${summary.targetScore}`)
        })

        it("should include correct emoji when over target", () => {
            const summary = {
                totalScore: 155,
                targetScore: 123,
                scoreDifference: 22,
                isOverTarget: true,
            }
            const shareText = generateShareText(playerScoresOver, summary, "2025-07-15")

            const expectedText = "🔥+22"
            expect(shareText).toContain(expectedText)
        })

        it("should include correct emoji when under target", () => {
            const summary = {
                totalScore: 155,
                targetScore: 165,
                scoreDifference: 10,
                isOverTarget: false,
            }
            const shareText = generateShareText(playerScoresOver, summary, "2025-07-15")

            const expectedText = "🧊-10"
            expect(shareText).toContain(expectedText)
        })

        it("should include correct emoji when equal to target", () => {
            const summary = {
                totalScore: 155,
                targetScore: 155,
                scoreDifference: 0,
                isOverTarget: true,
            }
            const shareText = generateShareText(playerScoresOver, summary, "2025-07-15")

            const expectedText = "🔥+0"
            expect(shareText).toContain(expectedText)
        })

        it("should end with the correct footer line", () => {
            const expectedURL = new URL(import.meta.env.VITE_APP_URL)
            expectedURL.searchParams.set("date", testDate)
            expect(lines[lines.length - 1]).toBe(expectedURL.toString())
        })
    })

    describe("generateSrSummaryText", () => {
        it("should generate a correct summary for multiple target words", () => {
            const summary: ScoreSummary = {
                totalScore: 110,
                targetScore: 98,
                scoreDifference: 12,
                isOverTarget: true,
            }
            const targetScores: WordScore[] = [
                { baseScore: 8, multiplier: 6 }, // 48
                { baseScore: 10, multiplier: 5 }, // 50
            ]
            const targetWords = ["CAT", "BIRD"]

            const text = generateSrSummaryText(summary, targetScores, targetWords)

            const expected =
                "Game completed. Your final score was 110. The target solution was: CAT scored 8 times 6 equals 48 points. BIRD scored 10 times 5 equals 50 points. ...for a total of 98 points."
            expect(text).toBe(expected)
        })

        it("should generate a correct summary for a single target word", () => {
            const summary: ScoreSummary = {
                totalScore: 50,
                targetScore: 48,
                scoreDifference: 2,
                isOverTarget: true,
            }
            const targetScores: WordScore[] = [{ baseScore: 8, multiplier: 6 }] // 48
            const targetWords = ["CAT"]

            const text = generateSrSummaryText(summary, targetScores, targetWords)

            const expected =
                "Game completed. Your final score was 50. The target solution was: CAT scored 8 times 6 equals 48 points. ...for a total of 48 points."
            expect(text).toBe(expected)
        })

        it("should handle an empty array of target words gracefully", () => {
            const summary: ScoreSummary = {
                totalScore: 0,
                targetScore: 0,
                scoreDifference: 0,
                isOverTarget: true,
            }
            const text = generateSrSummaryText(summary, [], [])
            const expected =
                "Game completed. Your final score was 0. The target solution was:  ...for a total of 0 points."
            expect(text).toBe(expected)
        })
    })
})
