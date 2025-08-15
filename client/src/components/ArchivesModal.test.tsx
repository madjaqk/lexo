import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PlayHistory } from "@/types"
import ArchivesModal from "./ArchivesModal"

describe("ArchivesModal", () => {
    const onClose = vi.fn()
    const onDateSelect = vi.fn()

    const mockHistory: PlayHistory = {
        "2025-07-20": { racks: [], score: 100, targetScore: 90 }, // +10
        "2025-07-18": { racks: [], score: 80, targetScore: 90 }, // -10
        "2025-07-19": { racks: [], score: 90, targetScore: 90 }, // 0
    }
    const earliestDate = "2025-07-01"
    const currentDate = "2025-07-21"

    beforeEach(() => {
        // The modal uses a portal, so we need to add the portal root to the DOM
        const modalRoot = document.createElement("div")
        modalRoot.id = "modal-root"
        document.body.appendChild(modalRoot)
    })

    afterEach(() => {
        // Clean up the portal root and mocks
        const modalRoot = document.getElementById("modal-root")
        if (modalRoot) {
            document.body.removeChild(modalRoot)
        }
        vi.clearAllMocks()
    })

    it("should not render when isOpen is false", () => {
        render(
            <ArchivesModal
                isOpen={false}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={null}
            />,
        )
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("should render correctly when isOpen is true", () => {
        render(
            <ArchivesModal
                isOpen={true}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={mockHistory}
            />,
        )

        expect(screen.getByRole("dialog", { name: "Past Puzzles" })).toBeInTheDocument()
        expect(screen.getByLabelText("Select a date:")).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Your History" })).toBeInTheDocument()
    })

    it("should render history items sorted by date descending", () => {
        render(
            <ArchivesModal
                isOpen={true}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={mockHistory}
            />,
        )

        const historyItems = screen.getAllByRole("button", { name: /Score:/ })
        expect(historyItems).toHaveLength(3)
        // Check that the dates are in the correct reverse chronological order
        expect(historyItems[0]).toHaveTextContent("2025-07-20")
        expect(historyItems[1]).toHaveTextContent("2025-07-19")
        expect(historyItems[2]).toHaveTextContent("2025-07-18")
    })

    it("should display correct score differences (positive, negative, zero)", () => {
        render(
            <ArchivesModal
                isOpen={true}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={mockHistory}
            />,
        )

        expect(screen.getByText(/✅ \(\+10\)/)).toBeInTheDocument()
        expect(screen.getByText(/❌ \(-10\)/)).toBeInTheDocument()
        expect(screen.getByText(/↔️ \(0\)/)).toBeInTheDocument()
    })

    it("should call onDateSelect and onClose when a history item is clicked", async () => {
        const user = userEvent.setup()
        render(
            <ArchivesModal
                isOpen={true}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={mockHistory}
            />,
        )

        const historyButton = screen.getByRole("button", { name: /2025-07-18/ })
        await user.click(historyButton)

        expect(onDateSelect).toHaveBeenCalledWith("2025-07-18")
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should call onDateSelect and onClose when the date picker value changes", async () => {
        const user = userEvent.setup()
        render(
            <ArchivesModal
                isOpen={true}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={mockHistory}
            />,
        )

        const dateInput = screen.getByLabelText("Select a date:")
        await user.type(dateInput, "2025-07-15")

        // userEvent.type triggers a change event after typing.
        expect(onDateSelect).toHaveBeenCalledWith("2025-07-15")
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should call onClose when the close button is clicked", async () => {
        const user = userEvent.setup()
        render(
            <ArchivesModal
                isOpen={true}
                onClose={onClose}
                onDateSelect={onDateSelect}
                earliestDate={earliestDate}
                currentDate={currentDate}
                history={null}
            />,
        )
        await user.click(screen.getByRole("button", { name: "Close" }))
        expect(onClose).toHaveBeenCalledTimes(1)
    })
})
