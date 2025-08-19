import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import InstructionsModal from "./InstructionsModal"

describe("InstructionsModal", () => {
    const onClose = vi.fn()

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
        render(<InstructionsModal isOpen={false} onClose={onClose} />)
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("should render when isOpen is true", () => {
        render(<InstructionsModal isOpen={true} onClose={onClose} />)
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("How to Play")).toBeInTheDocument()
        expect(screen.getByAltText(/mascot/i)).toBeInTheDocument()
    })

    it("should call onClose when the close button is clicked", async () => {
        const user = userEvent.setup()
        render(<InstructionsModal isOpen={true} onClose={onClose} />)

        const closeButton = screen.getByRole("button", { name: /close/i })
        await user.click(closeButton)

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should call onClose when the Escape key is pressed", async () => {
        const user = userEvent.setup()
        render(<InstructionsModal isOpen={true} onClose={onClose} />)

        // The modal must be focused or contain a focused element to receive keydown events.
        // We can just press Escape on the body.
        await user.keyboard("{Escape}")

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should call onClose when the backdrop is clicked", async () => {
        const user = userEvent.setup()
        render(<InstructionsModal isOpen={true} onClose={onClose} />)

        // In our implementation, clicking anywhere outside the modal content
        // (like the document body) should trigger the close handler.
        await user.click(document.body)

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should NOT call onClose when the modal content is clicked", async () => {
        const user = userEvent.setup()
        render(<InstructionsModal isOpen={true} onClose={onClose} />)

        const dialog = screen.getByRole("dialog")
        // A click on the modal content itself should not close it.
        await user.click(dialog)

        expect(onClose).not.toHaveBeenCalled()
    })
})
