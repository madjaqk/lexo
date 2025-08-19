import { useEffect, useRef } from "react"

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

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose()
            }
        }

        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
            document.addEventListener("mouseup", handleClickOutside)
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("mouseup", handleClickOutside)
        }
    }, [isOpen, onClose])

    return modalRef
}
