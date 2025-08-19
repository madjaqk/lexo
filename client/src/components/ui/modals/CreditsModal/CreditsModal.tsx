import ReactDOM from "react-dom"
import { useModalCloseEvents } from "@/hooks/useModalCloseEvents"
import "./CreditsModal.css"
import "@/components/ui/modals/Modal.css"

interface CreditsModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
    const modalRef = useModalCloseEvents({ isOpen, onClose })

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
                aria-labelledby="credits-heading"
            >
                <button type="button" className="close-button" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <h2 id="credits-heading">About & Credits</h2>
                <div className="credits-content">
                    <p>
                        <strong>{import.meta.env.VITE_APP_NAME}</strong> was designed and developed
                        by{" "}
                        <a
                            href="https://jackbrounstein.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Jack Brounstein
                        </a>
                        .
                    </p>
                    <h3>Attributions</h3>
                    <ul>
                        <li>
                            Primary font is Nunito, used under the{" "}
                            <a
                                href="https://openfontlicense.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                SIL Open Font License
                            </a>
                            .
                        </li>
                        <li>"Share" icon from Google's Material Symbols.</li>
                        <li>Logo, favicon, and walrus art generated with Google Gemini.</li>
                    </ul>
                </div>
            </div>
        </div>,
        modalRoot,
    )
}
