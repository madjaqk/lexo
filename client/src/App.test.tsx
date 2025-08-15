import { render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePlayHistory } from "@/hooks/usePlayHistory"
import { fetchDailyPuzzle, fetchGameConfig } from "@/services/gameService"
import type { DailyPuzzle, GameConfig } from "@/types"
import App, { loader as appLoader } from "./App"
import ErrorPage from "./components/ErrorPage"

// Mock dependencies
vi.mock("@/services/gameService", () => ({
    fetchDailyPuzzle: vi.fn(),
    fetchGameConfig: vi.fn(),
}))
vi.mock("@/services/wordValidation", () => ({
    loadWordList: vi.fn().mockResolvedValue(new Set(["WORD"])),
}))
vi.mock("@/hooks/usePlayHistory", () => ({
    usePlayHistory: vi.fn(),
    LOCAL_STORAGE_KEY: "tile-game-history",
}))

// Mock data
const MOCK_CONFIG: GameConfig = {
    timerSeconds: 30,
    multipliers: { "3": 6, "4": 5 },
    earliestDate: "2025-01-01",
    currentDate: "2025-07-22",
}

const MOCK_PUZZLE: DailyPuzzle = {
    date: "2025-07-20",
    initialRacks: [[{ id: "t1", letter: "A", value: 1 }]],
    targetSolution: [[{ id: "t1", letter: "A", value: 1 }]],
}

describe("App Loader and Routing", () => {
    // Helper to create and render the router for a specific path
    const renderWithRouter = (initialPath: string) => {
        const router = createMemoryRouter(
            [
                {
                    path: "/",
                    element: <App />,
                    loader: appLoader,
                    hydrateFallbackElement: <p>Loading...</p>,
                    errorElement: <ErrorPage />,
                },
            ],
            {
                initialEntries: [initialPath],
            },
        )
        render(<RouterProvider router={router} />)
        return router
    }

    beforeEach(() => {
        // Set up default successful mocks
        vi.mocked(fetchGameConfig).mockResolvedValue(MOCK_CONFIG)
        vi.mocked(fetchDailyPuzzle).mockResolvedValue(MOCK_PUZZLE)
        vi.mocked(usePlayHistory).mockReturnValue({
            history: {},
            saveHistoryForDate: vi.fn(),
            getHistoryForDate: vi.fn(),
            clearAllHistory: vi.fn(),
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("should load the puzzle for a specific date from the URL", async () => {
        renderWithRouter("/?date=2025-07-20")

        // Wait for the loader to finish and the component to render
        expect(await screen.findByText("DATE: 2025-07-20")).toBeInTheDocument()
        expect(fetchDailyPuzzle).toHaveBeenCalledWith("2025-07-20")
    })

    it("should redirect to the root path when today's date is in the URL", async () => {
        const router = renderWithRouter(`/?date=${MOCK_CONFIG.currentDate}`)

        // The component should render the puzzle for the redirected date
        expect(await screen.findByText(`DATE: ${MOCK_PUZZLE.date}`)).toBeInTheDocument()
        // The router should have performed a client-side redirect, changing the path to "/"
        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/")
            expect(router.state.location.search).toBe("")
        })
    })

    it("should display the 404 error page when a puzzle is not found", async () => {
        vi.mocked(fetchDailyPuzzle).mockRejectedValue(new Response(null, { status: 404 }))
        renderWithRouter("/?date=2025-07-21")

        expect(await screen.findByRole("heading", { name: "Puzzle Not Found" })).toBeInTheDocument()
        expect(
            screen.getByText(/Sorry, we couldn't find a puzzle for that date/),
        ).toBeInTheDocument()
    })

    it("should display the 403 error page for a future date", async () => {
        vi.mocked(fetchDailyPuzzle).mockRejectedValue(new Response(null, { status: 403 }))
        renderWithRouter("/?date=2025-08-01")

        expect(await screen.findByRole("heading", { name: "No spoilers!" })).toBeInTheDocument()
    })

    it("should display the 422 error page for a malformed date", async () => {
        vi.mocked(fetchDailyPuzzle).mockRejectedValue(new Response(null, { status: 422 }))
        renderWithRouter("/?date=not-a-date")

        expect(
            await screen.findByRole("heading", { name: "Invalid Date Format" }),
        ).toBeInTheDocument()
        expect(screen.getByText(/The date in the URL is not valid/)).toBeInTheDocument()
    })
})
