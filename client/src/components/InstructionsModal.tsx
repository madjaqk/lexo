import { useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import "./InstructionsModal.css"

interface InstructionsModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
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

        // Cleanup function to remove the event listener
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("mouseup", handleClickOutside)
        }
    }, [isOpen, onClose])

    if (!isOpen) {
        return null
    }

    const modalRoot = document.getElementById("modal-root")
    if (!modalRoot) {
        // This should not happen if the portal root is in index.html
        return null
    }

    return ReactDOM.createPortal(
        <div className="backdrop">
            <div
                ref={modalRef}
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="instructions-heading"
            >
                <button type="button" className="closeButton" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <h2 id="instructions-heading">How to Play</h2>
                <div className="logoPlaceholder" role="img" aria-label="Game Logo Placeholder" />
                <div className="content">
                    <p>The goal is to arrange all 18 letter tiles into four valid English words.</p>
                    <ul>
                        <li>Each rack must contain exactly one word.</li>
                        <li>The words must be 3, 4, 5, and 6 letters long.</li>
                        <li>You have a limited time to solve the puzzle!</li>
                    </ul>
                    <p>Drag and drop tiles between the racks to form your words. Good luck!</p>
                </div>
            </div>
        </div>,
        modalRoot,
    )
}
