import ReactDOM from "react-dom"
import { useModalCloseEvents } from "@/hooks/useModalCloseEvents"
import "./InstructionsModal.css"
import "@/components/ui/modals/Modal.css"
import walrus from "@/assets/gemini_walrus_transparent_trimmed.png"

interface InstructionsModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
    const modalRef = useModalCloseEvents({ isOpen, onClose })

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
                <button type="button" className="close-button" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <h2 id="instructions-heading" className="instructions-heading">
                    How to Play
                </h2>
                <div className="content">
                    <p>The goal is to arrange all 18 letter tiles into four valid English words.</p>
                    <ul>
                        <li>Each rack must contain exactly one word.</li>
                        <li>The words must be 3, 4, 5, and 6 letters long.</li>
                        <li>You have a limited time to solve the puzzle!</li>
                    </ul>
                    <p>Drag and drop tiles between the racks to form your words. Good luck!</p>
                </div>
                <img
                    src={walrus}
                    alt="A friendly mascot character for the game" // Describe the image for accessibility
                    className="logo-placeholder"
                />
            </div>
        </div>,
        modalRoot,
    )
}
