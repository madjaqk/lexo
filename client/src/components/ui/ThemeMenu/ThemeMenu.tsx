import type { TernaryDarkMode } from "usehooks-ts"
import MoonIcon from "@/components/ui/icons/MoonIcon"
import SunIcon from "@/components/ui/icons/SunIcon"
import SystemIcon from "@/components/ui/icons/SystemIcon"
import "./ThemeMenu.css"

interface ThemeMenuProps {
    onClose: () => void
    onThemeSelect: (theme: TernaryDarkMode) => void
}

export default function ThemeMenu({ onClose, onThemeSelect }: ThemeMenuProps) {
    function handleSelect(theme: TernaryDarkMode) {
        onThemeSelect(theme)
        onClose()
    }

    return (
        <div className="theme-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => handleSelect("light")}>
                <SunIcon />
                <span>Light</span>
            </button>
            <button type="button" role="menuitem" onClick={() => handleSelect("dark")}>
                <MoonIcon />
                <span>Dark</span>
            </button>
            <button type="button" role="menuitem" onClick={() => handleSelect("system")}>
                <SystemIcon />
                <span>System</span>
            </button>
        </div>
    )
}
