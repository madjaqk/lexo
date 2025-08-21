import { renderHook } from "@testing-library/react"
import { useTernaryDarkMode } from "usehooks-ts"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useTheme } from "./useTheme"

// Mock the underlying hook from the library so we can control its output.
vi.mock("usehooks-ts", () => ({
    useTernaryDarkMode: vi.fn(),
}))

// Cast the mock to be controllable in our tests.
const mockedUseTernaryDarkMode = vi.mocked(useTernaryDarkMode)

describe("useTheme hook", () => {
    const useTernaryDarkModeMockReturnValue = {
        setTernaryDarkMode: vi.fn(),
        toggleTernaryDarkMode: vi.fn(),
    }

    beforeEach(() => {
        // Reset the mock before each test
        mockedUseTernaryDarkMode.mockClear()
    })

    afterEach(() => {
        // Clean up the DOM after each test
        delete document.documentElement.dataset.theme
    })

    it('should set data-theme to "dark" when isDarkMode is true', () => {
        mockedUseTernaryDarkMode.mockReturnValue({
            ...useTernaryDarkModeMockReturnValue,
            isDarkMode: true,
            ternaryDarkMode: "dark",
        })

        renderHook(() => useTheme())

        expect(document.documentElement.dataset.theme).toBe("dark")
    })

    it('should set data-theme to "light" when isDarkMode is false', () => {
        mockedUseTernaryDarkMode.mockReturnValue({
            ...useTernaryDarkModeMockReturnValue,
            isDarkMode: false,
            ternaryDarkMode: "light",
        })

        renderHook(() => useTheme())

        expect(document.documentElement.dataset.theme).toBe("light")
    })

    it('should set data-theme to "dark" when the theme is system and system prefers dark', () => {
        mockedUseTernaryDarkMode.mockReturnValue({
            ...useTernaryDarkModeMockReturnValue,
            isDarkMode: true, // Effective theme is dark
            ternaryDarkMode: "system",
        })

        renderHook(() => useTheme())

        expect(document.documentElement.dataset.theme).toBe("dark")
    })

    it("should update data-theme when isDarkMode changes", () => {
        mockedUseTernaryDarkMode.mockReturnValue({
            ...useTernaryDarkModeMockReturnValue,
            isDarkMode: true,
            ternaryDarkMode: "dark",
        })

        const { rerender } = renderHook(() => useTheme())
        expect(document.documentElement.dataset.theme).toBe("dark")

        // Simulate a theme change by updating the mock's return value
        mockedUseTernaryDarkMode.mockReturnValue({
            ...useTernaryDarkModeMockReturnValue,
            isDarkMode: false,
            ternaryDarkMode: "light",
        })

        rerender()

        expect(document.documentElement.dataset.theme).toBe("light")
    })
})
