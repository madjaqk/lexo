import { useEffect } from "react"
import { useTernaryDarkMode } from "usehooks-ts"

/**
 * A hook to manage the application's color theme (light, dark, or system).
 * It wraps the `useTernaryDarkMode` hook from `usehooks-ts` and applies
 * the current theme to the document's root element via a `data-theme` attribute.
 */
export function useTheme() {
    const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode()

    useEffect(() => {
        // Set the data-theme attribute on the <html> element
        document.documentElement.dataset.theme = isDarkMode ? "dark" : "light"
    }, [isDarkMode])

    return {
        isDarkMode, // boolean: true if the effective theme is dark
        theme: ternaryDarkMode, // "light" | "dark" | "system"
        setTheme: setTernaryDarkMode, // function to cycle through themes
    }
}
