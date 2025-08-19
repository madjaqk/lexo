import "./Footer.css"

interface FooterProps {
    onOpenCredits: () => void
}

export default function FooterComponent({ onOpenCredits }: FooterProps) {
    return (
        <footer className="app-footer">
            <p>
                © {new Date().getFullYear()}{" "}
                <a href="https://jackbrounstein.com" target="_blank" rel="noopener noreferrer">
                    Jack Brounstein
                </a>
            </p>
            <button type="button" className="footer-link" onClick={onOpenCredits}>
                About & Credits
            </button>
        </footer>
    )
}
