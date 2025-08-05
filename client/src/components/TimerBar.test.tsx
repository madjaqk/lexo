import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import TimerBar from "./TimerBar"

describe("TimerBar", () => {
    const totalTimeMs = 300_000 // 5 minutes

    it("should display the correct time and be full when time remaining equals total time", () => {
        render(<TimerBar timeRemainingMs={totalTimeMs} totalTimeMs={totalTimeMs} />)

        // Check the visible text that the user sees.
        expect(screen.getByText("5:00")).toBeInTheDocument()

        // Check the progress bar's ARIA attributes for accessibility.
        // This is a great way to ensure your component is accessible.
        const progressbar = screen.getByRole("progressbar")
        expect(progressbar).toHaveAttribute("aria-valuenow", String(totalTimeMs))
        expect(progressbar).toHaveAttribute("aria-valuemax", String(totalTimeMs))
        expect(progressbar).toHaveAttribute("aria-valuetext", "Time remaining: 5:00")

        // Check the CSS custom property that controls the size of the bar.
        expect(progressbar).toHaveStyle("--scale-ratio: 1")

        // Check the opacity of the visual fill element
        const visualFill = screen.getByTestId("timer-fill-visual")
        expect(visualFill).toHaveStyle("opacity: 1")
    })

    it("should display the correct time and progress at half time", () => {
        const timeRemainingMs = totalTimeMs / 2 // 2.5 minutes
        render(<TimerBar timeRemainingMs={timeRemainingMs} totalTimeMs={totalTimeMs} />)

        expect(screen.getByText("2:30")).toBeInTheDocument()

        const progressbar = screen.getByRole("progressbar")
        expect(progressbar).toHaveAttribute("aria-valuenow", String(timeRemainingMs))
        expect(progressbar).toHaveStyle("--scale-ratio: 0.5")

        const visualFill = screen.getByTestId("timer-fill-visual")
        expect(visualFill).toHaveStyle("opacity: .5")
    })

    it("should display 0:00 and be empty when time runs out", () => {
        render(<TimerBar timeRemainingMs={0} totalTimeMs={totalTimeMs} />)

        expect(screen.getByText("0:00")).toBeInTheDocument()

        const progressbar = screen.getByRole("progressbar")
        expect(progressbar).toHaveAttribute("aria-valuenow", "0")
        expect(progressbar).toHaveStyle("--scale-ratio: 0")

        const visualFill = screen.getByTestId("timer-fill-visual")
        expect(visualFill).toHaveStyle("opacity: 0")
    })

    it("should handle and clamp negative time remaining", () => {
        // This tests the edge case where the timer might overshoot.
        // With the fix, it should render as 0:00.
        const timeRemainingMs = -5000
        render(<TimerBar timeRemainingMs={timeRemainingMs} totalTimeMs={totalTimeMs} />)

        expect(screen.getByText("0:00")).toBeInTheDocument()

        const progressbar = screen.getByRole("progressbar")
        // The component's `aria-valuenow` still correctly receives the raw prop value.
        expect(progressbar).toHaveAttribute("aria-valuenow", String(timeRemainingMs))
        // The visual ratio is correctly clamped to 0.
        expect(progressbar).toHaveStyle("--scale-ratio: 0")

        const visualFill = screen.getByTestId("timer-fill-visual")
        expect(visualFill).toHaveStyle("opacity: 0")
    })
})
