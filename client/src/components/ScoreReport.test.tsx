import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

    // Use afterEach for robust mock cleanup. This restores original implementations.
    afterEach(() => {
        vi.restoreAllMocks()
    })

    // Helper function to set up common mocks to avoid repetition.
    const setupMocks = () => {
        vi.mocked(calculateScoreSummary).mockReturnValue(mockSummary)
        vi.mocked(generateScoreReportText).mockReturnValue(mockReportText)
        vi.mocked(generateSrSummaryText).mockReturnValue(mockSrText)
    }

    describe("when it is the current date", () => {
        beforeEach(() => {
            setupMocks()
            render(
                <ScoreReport
                    rackScores={mockRackScores}
                    targetScores={mockTargetScores}
                    targetSolution={mockTargetSolution}
                    date={mockDate}
                    currentDate={mockDate} // Dates match
                />,
            )
        })

        it("should render the ShareButton and pass all necessary props to it", () => {
            const shareButton = screen.getByRole("button", { name: "Mock Share" })
            expect(shareButton).toBeInTheDocument()
            expect(shareButton).toHaveAttribute("data-rack-scores", JSON.stringify(mockRackScores))
            expect(shareButton).toHaveAttribute(
                "data-target-scores",
                JSON.stringify(mockTargetScores),
            )
            expect(shareButton).toHaveAttribute("data-date", mockDate)
        })

        it("should render the visible report text to the user", () => {
            expect(screen.getByText(mockReportText)).toBeInTheDocument()
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

    describe("when it is not the current date", () => {
        beforeEach(() => {
            setupMocks()
            render(
                <ScoreReport
                    rackScores={mockRackScores}
                    targetScores={mockTargetScores}
                    targetSolution={mockTargetSolution}
                    date={mockDate}
                    currentDate="2025-08-01" // Dates do NOT match
                />,
            )
        })

        it("should NOT render the ShareButton", () => {
            expect(screen.queryByRole("button", { name: "Mock Share" })).not.toBeInTheDocument()
        })

        it("should still render the report text", () => {
            expect(screen.getByText(mockReportText)).toBeInTheDocument()
        })
    })
})
