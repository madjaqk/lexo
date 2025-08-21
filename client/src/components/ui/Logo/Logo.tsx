import "./Logo.css"

export default function Logo() {
    const appName = import.meta.env.VITE_APP_NAME || "Game Name tk"
    const firstLetter = appName.charAt(0)
    const restOfName = appName.substring(1)
    return (
        <h1 className="logo">
            <span className="logo-tile">{firstLetter}</span>
            <span className="logo-text">{restOfName}</span>
        </h1>
    )
}
