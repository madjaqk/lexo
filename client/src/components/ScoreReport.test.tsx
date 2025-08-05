import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { WordRack, WordScore } from "@/types"
import {
    calculateScoreSummary,
    generateScoreReportText,
    generateSrSummaryText,
    type ScoreSummary,
} from "@/utils/resultsFormatter"
import ScoreReport from "./ScoreReport"

// Mock child components and utility functions to isolate the ScoreReport component.
vi.mock("@/utils/resultsFormatter", () => ({
    calculateScoreSummary: vi.fn(),
    generateScoreReportText: vi.fn(),
    generateSrSummaryText: vi.fn(),
}))

vi.mock("./ShareButton", () => ({
    // The mock now destructures the props to avoid spreading unknown attributes to the DOM element.
    // We can pass specific props like `date` to a data attribute to make them verifiable in the test.
    default: (props: { rackScores: WordScore[]; targetScores: WordScore[]; date: string }) => (
        <button
            type="button"
            data-rack-scores={JSON.stringify(props.rackScores)}
            data-target-scores={JSON.stringify(props.targetScores)}
            data-date={props.date}
        >
            Mock Share
        </button>
    ),
}))

describe("ScoreReport", () => {
    const mockRackScores: WordScore[] = [{ baseScore: 10, multiplier: 6 }]
    const mockTargetScores: WordScore[] = [{ baseScore: 8, multiplier: 6 }]
    const mockTargetSolution: WordRack[] = [
        [
            { id: "t1", letter: "C", value: 3 },
            { id: "t2", letter: "A", value: 1 },
            { id: "t3", letter: "T", value: 1 },
        ],
    ]
    const mockDate = "2025-07-20"
    const mockSummary: ScoreSummary = {
        totalScore: 60,
        targetScore: 48,
        scoreDifference: 12,
        isOverTarget: true,
    }
    const mockReportText = "You beat the target by 12 points!"
    const mockSrText = "Mock screen reader summary text."

    beforeEach(() => {
        // Clear mock history before each test to ensure a clean slate.
        vi.clearAllMocks()

        // Configure the mocks to return specific values for this test
        vi.mocked(calculateScoreSummary).mockReturnValue(mockSummary)
        vi.mocked(generateScoreReportText).mockReturnValue(mockReportText)
        vi.mocked(generateSrSummaryText).mockReturnValue(mockSrText)

        render(
            <ScoreReport
                rackScores={mockRackScores}
                targetScores={mockTargetScores}
                targetSolution={mockTargetSolution}
                date={mockDate}
            />,
        )
    })

    it("should calculate the score summary based on the provided scores", () => {
        expect(calculateScoreSummary).toHaveBeenCalledWith(mockRackScores, mockTargetScores)
        expect(calculateScoreSummary).toHaveBeenCalledTimes(1)
    })

    it("should generate the report text based on the calculated summary", () => {
        expect(generateScoreReportText).toHaveBeenCalledWith(mockSummary)
        expect(generateScoreReportText).toHaveBeenCalledTimes(1)
    })

    it("should render the visible report text to the user", () => {
        expect(screen.getByText(mockReportText)).toBeInTheDocument()
    })

    it("should render the ShareButton and pass all necessary props to it", () => {
        const shareButton = screen.getByRole("button", { name: "Mock Share" })
        expect(shareButton).toBeInTheDocument()
        expect(shareButton).toHaveAttribute("data-rack-scores", JSON.stringify(mockRackScores))
        expect(shareButton).toHaveAttribute("data-target-scores", JSON.stringify(mockTargetScores))
        expect(shareButton).toHaveAttribute("data-date", mockDate)
    })

    it("should render a detailed, accessible summary for screen readers", () => {
        const targetWords = mockTargetSolution.map((rack) =>
            rack.map((tile) => tile.letter).join(""),
        )
        expect(generateSrSummaryText).toHaveBeenCalledWith(
            mockSummary,
            mockTargetScores,
            targetWords,
        )
        expect(screen.getByText(mockSrText)).toBeInTheDocument()
    })
})
