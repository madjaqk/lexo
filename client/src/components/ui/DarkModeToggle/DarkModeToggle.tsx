import { useRef, useState } from "react"
import MoonIcon from "@/components/ui/icons/MoonIcon"
import SunIcon from "@/components/ui/icons/SunIcon"
import SystemIcon from "@/components/ui/icons/SystemIcon"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useTheme } from "@/hooks/useTheme"
import "./DarkModeToggle.css"
import ThemeMenu from "@/components/ui/ThemeMenu/ThemeMenu"

const themeIcons = {
    light: <SunIcon />,
    dark: <MoonIcon />,
    system: <SystemIcon />,
}

export default function DarkModeToggle() {
    const { theme, setTheme } = useTheme()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const toggleRef = useRef<HTMLDivElement>(null)

    useClickOutside(toggleRef, () => {
        if (isMenuOpen) {
            setIsMenuOpen(false)
        }
    })

    const handleToggleClick = () => {
        setIsMenuOpen((prev) => !prev)
    }

    return (
        <div className="dark-mode-toggle-wrapper" ref={toggleRef}>
            <button
                type="button"
                className="dark-mode-toggle"
                onClick={handleToggleClick}
                aria-label={`Change theme. Current theme: ${theme}`}
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
            >
                {themeIcons[theme]}
            </button>
            {isMenuOpen && <ThemeMenu onClose={() => setIsMenuOpen(false)} onThemeSelect={setTheme} />}
        </div>
    )
}
