import { useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import "./Modal.css"
import "./ArchivesModal.css"

interface ArchivesModalProps {
    isOpen: boolean
    onClose: () => void
    onDateSelect: (date: string) => void
}

export default function ArchivesModal({ isOpen, onClose, onDateSelect }: ArchivesModalProps) {
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

    function handleDateChange(event: React.ChangeEvent<HTMLInputElement>) {
        const newDate = event.target.value
        if (newDate) {
            onDateSelect(newDate)
            onClose()
        }
    }

    if (!isOpen) {
        return null
    }

    const modalRoot = document.getElementById("modal-root")
    if (!modalRoot) {
        return null
    }

    return ReactDOM.createPortal(
        <div className="backdrop">
            <div
                ref={modalRef}
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="archives-heading"
            >
                <button type="button" className="close-button" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <h2 id="archives-heading">Past Puzzles</h2>
                <div className="date-picker-container">
                    <label htmlFor="date-picker-input">Select a date:</label>
                    <input
                        id="date-picker-input"
                        type="date"
                        onChange={handleDateChange}
                    />
                </div>
            </div>
        </div>,
        modalRoot,
    )
}
