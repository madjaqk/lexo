import { useEffect, useRef } from "react"
import { useClickOutside } from "./useClickOutside"

interface UseModalCloseEventsProps {
    isOpen: boolean
    onClose: () => void
}

/**
 * A custom hook to handle common modal closing logic.
 * It adds event listeners to close the modal on 'Escape' key press
 * or when a click occurs outside the modal content.
 *
 * @param isOpen - Whether the modal is currently open.
 * @param onClose - The function to call to close the modal.
 * @returns A ref that should be attached to the modal's main content element.
 */
export function useModalCloseEvents({ isOpen, onClose }: UseModalCloseEventsProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    // Use the dedicated hook for click outside logic.
    // The handler will be called on every outside click, so we must check
    // if the modal is open before calling onClose.
    useClickOutside(modalRef, () => {
        if (isOpen) {
            onClose()
        }
    })

    // This effect handles the 'Escape' key press.
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose()
            }
        }

        // Only add the listener if the modal is open.
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, onClose])

    return modalRef
}
