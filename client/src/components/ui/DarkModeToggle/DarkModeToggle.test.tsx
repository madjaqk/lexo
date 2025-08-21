import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useTheme } from "@/hooks/useTheme"
import DarkModeToggle from "./DarkModeToggle"

// Mock the theme hook so we can control its return values
vi.mock("@/hooks/useTheme")
const mockedUseTheme = vi.mocked(useTheme)

// Mock the icon components to make them easily identifiable in tests
vi.mock("@/components/ui/icons/SunIcon", () => ({
    default: () => <div data-testid="sun-icon" />,
}))
vi.mock("@/components/ui/icons/MoonIcon", () => ({
    default: () => <div data-testid="moon-icon" />,
}))
vi.mock("@/components/ui/icons/SystemIcon", () => ({
    default: () => <div data-testid="system-icon" />,
}))

describe("DarkModeToggle component", () => {
    let setThemeMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        setThemeMock = vi.fn()
        // Reset mocks before each test
        mockedUseTheme.mockClear()
        setThemeMock.mockClear()
    })

    it("should display the sun icon when the theme is light", () => {
        mockedUseTheme.mockReturnValue({
            theme: "light",
            setTheme: setThemeMock,
            isDarkMode: false,
        })
        render(<DarkModeToggle />)
        expect(screen.getByTestId("sun-icon")).toBeInTheDocument()
    })

    it("should display the moon icon when the theme is dark", () => {
        mockedUseTheme.mockReturnValue({
            theme: "dark",
            setTheme: setThemeMock,
            isDarkMode: true,
        })
        render(<DarkModeToggle />)
        expect(screen.getByTestId("moon-icon")).toBeInTheDocument()
    })

    it("should display the system icon when the theme is system", () => {
        mockedUseTheme.mockReturnValue({
            theme: "system",
            setTheme: setThemeMock,
            isDarkMode: false, // can be either
        })
        render(<DarkModeToggle />)
        expect(screen.getByTestId("system-icon")).toBeInTheDocument()
    })

    it("should open the theme menu when the toggle button is clicked", async () => {
        const user = userEvent.setup()
        mockedUseTheme.mockReturnValue({
            theme: "light",
            setTheme: setThemeMock,
            isDarkMode: false,
        })
        render(<DarkModeToggle />)

        // Menu should be closed initially
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
        const toggleButton = screen.getByRole("button", { name: /change theme/i })
        expect(toggleButton).toHaveAttribute("aria-expanded", "false")

        // Click to open
        await user.click(toggleButton)

        // Menu should now be open
        expect(screen.getByRole("menu")).toBeInTheDocument()
        expect(toggleButton).toHaveAttribute("aria-expanded", "true")
    })

    it("should close the theme menu when clicking outside", async () => {
        const user = userEvent.setup()
        mockedUseTheme.mockReturnValue({
            theme: "light",
            setTheme: setThemeMock,
            isDarkMode: false,
        })
        // We need a container to click "outside"
        render(
            <div>
                <div data-testid="outside-element">Outside</div>
                <DarkModeToggle />
            </div>,
        )

        // Open the menu first
        await user.click(screen.getByRole("button", { name: /change theme/i }))
        expect(screen.getByRole("menu")).toBeInTheDocument()

        // Click outside
        await user.click(screen.getByTestId("outside-element"))

        // Menu should be closed
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })

    it("should call setTheme and close the menu when an option is selected", async () => {
        const user = userEvent.setup()
        mockedUseTheme.mockReturnValue({ theme: "light", setTheme: setThemeMock, isDarkMode: false })
        render(<DarkModeToggle />)

        await user.click(screen.getByRole("button", { name: /change theme/i }))
        await user.click(screen.getByRole("menuitem", { name: /dark/i }))

        expect(setThemeMock).toHaveBeenCalledWith("dark")
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
})
