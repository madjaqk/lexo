import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import ThemeMenu from "./ThemeMenu"

// Mock the icon components to make testing easier, as we only care about the buttons.
vi.mock("@/components/ui/icons/SunIcon", () => ({
    default: () => <div>Sun Icon</div>,
}))
vi.mock("@/components/ui/icons/MoonIcon", () => ({
    default: () => <div>Moon Icon</div>,
}))
vi.mock("@/components/ui/icons/SystemIcon", () => ({
    default: () => <div>System Icon</div>,
}))

describe("ThemeMenu component", () => {
    it("should render all theme options correctly", () => {
        render(<ThemeMenu onClose={vi.fn()} onThemeSelect={vi.fn()} />)

        expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument()
        expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument()
        expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument()
    })

    it("should call onThemeSelect and onClose when the 'Light' option is clicked", async () => {
        const user = userEvent.setup()
        const handleClose = vi.fn()
        const handleThemeSelect = vi.fn()

        render(<ThemeMenu onClose={handleClose} onThemeSelect={handleThemeSelect} />)

        await user.click(screen.getByRole("menuitem", { name: /light/i }))

        expect(handleThemeSelect).toHaveBeenCalledWith("light")
        expect(handleThemeSelect).toHaveBeenCalledTimes(1)
        expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it("should call onThemeSelect and onClose when the 'Dark' option is clicked", async () => {
        const user = userEvent.setup()
        const handleClose = vi.fn()
        const handleThemeSelect = vi.fn()

        render(<ThemeMenu onClose={handleClose} onThemeSelect={handleThemeSelect} />)

        await user.click(screen.getByRole("menuitem", { name: /dark/i }))

        expect(handleThemeSelect).toHaveBeenCalledWith("dark")
        expect(handleThemeSelect).toHaveBeenCalledTimes(1)
        expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it("should call onThemeSelect and onClose when the 'System' option is clicked", async () => {
        const user = userEvent.setup()
        const handleClose = vi.fn()
        const handleThemeSelect = vi.fn()

        render(<ThemeMenu onClose={handleClose} onThemeSelect={handleThemeSelect} />)

        await user.click(screen.getByRole("menuitem", { name: /system/i }))

        expect(handleThemeSelect).toHaveBeenCalledWith("system")
        expect(handleThemeSelect).toHaveBeenCalledTimes(1)
        expect(handleClose).toHaveBeenCalledTimes(1)
    })
})
