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
                    <p>
                        The goal is to arrange all 18 letter tiles into four valid English words
                        within the time limit.
                    </p>
                    <ul>
                        <li>
                            Place one word in each rack, matching the required length (3, 4, 5, and
                            6 letters).
                        </li>
                        <li>Shorter words have higher score multipliers.  Use your best letters strategically!</li>
                        <li>Each word is scored as (letter values) × (rack multiplier).  Your total score is the sum of all four word scores.</li>
                    </ul>
                    <p>Aim for the highest total score possible. Good luck!</p>
                </div>
                <img
                    src={walrus}
                    alt="A friendly and sophisticated walrus"
                    className="logo-placeholder"
                />
            </div>
        </div>,
        modalRoot,
    )
}
