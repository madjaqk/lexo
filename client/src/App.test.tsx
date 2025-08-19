import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePlayHistory } from "@/hooks/usePlayHistory"
import { fetchDailyPuzzle, fetchGameConfig } from "@/services/gameService"
import type { DailyPuzzle, GameConfig } from "@/types"
import App, { loader as appLoader } from "./App"
import ErrorPage from "./components/ui/shared/ErrorPage/ErrorPage"

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
    let user: ReturnType<typeof userEvent.setup>

    // Helper to create and render the router for a specific path
    const renderWithRouter = (initialPath: string) => {
        const router = createMemoryRouter(
            [
                {
                    path: "/",
                    element: <App />,
                    loader: appLoader,
                    hydrateFallbackElement: <p>Loading...</p>, // Using a simple fallback for tests
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
        user = userEvent.setup()

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

    it("should display the 500 error page and a retry button for a server error", async () => {
        vi.mocked(fetchDailyPuzzle).mockRejectedValue(new Response(null, { status: 500 }))
        renderWithRouter("/")

        expect(
            await screen.findByRole("heading", { name: "Server Error: 500" }),
        ).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument()
    })

    it("should display a generic error page and a retry button for a network error", async () => {
        const networkError = new Error("Network request failed")
        vi.mocked(fetchDailyPuzzle).mockRejectedValue(networkError)
        renderWithRouter("/")

        expect(
            await screen.findByRole("heading", { name: "An error occurred!" }),
        ).toBeInTheDocument()
        expect(screen.getByText(networkError.message)).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument()
    })

    it("should successfully reload the data when the 'Try Again' button is clicked", async () => {
        // To test the intermediate loading state, we need to control the resolution
        // of the second API call manually.
        let resolveSecondCall: (value: DailyPuzzle) => void
        const secondCallPromise = new Promise<DailyPuzzle>((resolve) => {
            resolveSecondCall = resolve
        })

        vi.mocked(fetchDailyPuzzle)
            .mockRejectedValueOnce(new Response(null, { status: 500 }))
            .mockImplementationOnce(() => secondCallPromise)

        renderWithRouter("/")

        // 1. Verify the error page is shown initially.
        const tryAgainButton = await screen.findByRole("button", { name: "Try Again" })
        expect(tryAgainButton).toBeInTheDocument()

        // 2. Click the retry button.
        await user.click(tryAgainButton)

        // 3. Verify the button enters its loading state while the promise is pending.
        expect(screen.getByRole("button", { name: "Retrying..." })).toBeDisabled()

        // 4. Now, resolve the promise and wait for the UI to update.
        await act(async () => {
            resolveSecondCall(MOCK_PUZZLE)
        })

        // 5. Verify that the app successfully loads the puzzle data after the retry.
        expect(await screen.findByText(`DATE: ${MOCK_PUZZLE.date}`)).toBeInTheDocument()
        expect(fetchDailyPuzzle).toHaveBeenCalledTimes(2)
    })
})
