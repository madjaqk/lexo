import { useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import "./Modal.css"
import "./ArchivesModal.css"
import type { PlayHistory } from "@/types"

interface ArchivesModalProps {
    isOpen: boolean
    onClose: () => void
    onDateSelect: (date: string) => void
    earliestDate: string
    currentDate: string
    history: PlayHistory | null
}

export default function ArchivesModal({
    isOpen,
    onClose,
    onDateSelect,
    earliestDate,
    currentDate,
    history,
}: ArchivesModalProps) {
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

    // Sort in reverse chronological order
    const sortedHistory = history
        ? Object.entries(history).sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        : []

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
                        min={earliestDate}
                        max={currentDate}
                    />
                </div>
                {sortedHistory.length > 0 && (
                    <div className="history-list-container">
                        <h3>Your History</h3>
                        <ul className="history-list">
                            {sortedHistory.map(([date, record]) => {
                                const difference = record.score - record.targetScore
                                let differenceSign: string
                                let differenceClass: string
                                let emoji: string

                                if (difference > 0) {
                                    differenceSign = "+"
                                    differenceClass = "positive"
                                    emoji = "✅"
                                } else if (difference < 0) {
                                    differenceSign = ""
                                    differenceClass = "negative"
                                    emoji = "❌"
                                } else {
                                    differenceSign = ""
                                    differenceClass = ""
                                    emoji = "↔️"
                                }

                                return (
                                    <li key={date}>
                                        <button
                                            type="button"
                                            className="history-item-button"
                                            onClick={() => {
                                                onDateSelect(date)
                                                onClose()
                                            }}
                                        >
                                            <span className="history-date">{date}</span>
                                            <span className="history-score">
                                                Score: {record.score}
                                            </span>
                                            <span
                                                className={`history-difference ${differenceClass}`}
                                            >
                                                {emoji} ({differenceSign}
                                                {difference})
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>,
        modalRoot,
    )
}
