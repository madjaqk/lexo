import { act } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePlayHistory } from "@/hooks/usePlayHistory"
import { fetchWordList } from "@/services/gameService"
import { loadWordList } from "@/services/wordValidation"
import type { DailyPuzzle, GameRules, WordRack } from "@/types"
import Game from "./Game"

// globalThis.jest = vi

// Mock external dependencies
vi.mock("@/services/gameService", () => ({
	fetchWordList: vi.fn(),
}))

vi.mock("@/hooks/usePlayHistory", () => ({
	usePlayHistory: vi.fn(),
}))

// --- Test Data ---
const MOCK_RULES: GameRules = {
	timerSeconds: 30,
	multipliers: { 3: 6, 4: 5 },
}

const CAT_RACK: WordRack = [
	{ id: "t1", letter: "C", value: 3 },
	{ id: "t2", letter: "A", value: 1 },
	{ id: "t3", letter: "T", value: 1 },
]
const BIRD_RACK: WordRack = [
	{ id: "t4", letter: "B", value: 3 },
	{ id: "t5", letter: "I", value: 1 },
	{ id: "t6", letter: "R", value: 1 },
	{ id: "t7", letter: "D", value: 1 },
]

const initialRacks = [
    [
        { id: "t2", letter: "A", value: 1 },
        { id: "t4", letter: "B", value: 3 },
        { id: "t1", letter: "C", value: 3 },
    ],
    [
        { id: "t7", letter: "D", value: 1 },
        { id: "t5", letter: "I", value: 1 },
        { id: "t6", letter: "R", value: 1 },
        { id: "t3", letter: "T", value: 1 },

    ],
]

const MOCK_PUZZLE: DailyPuzzle = {
	date: "2025-07-21",
	initialRacks: initialRacks,
	targetSolution: [CAT_RACK, BIRD_RACK],
}

const MOCK_SOLVED_PUZZLE: DailyPuzzle = {
	...MOCK_PUZZLE,
	initialRacks: [CAT_RACK, BIRD_RACK], // Start with solved racks
}

const MOCK_HISTORY_RECORD = {
	racks: [CAT_RACK, BIRD_RACK],
	score: 60,
	targetScore: 60,
}

describe("Game Component - Integration Tests", () => {
	// userEvent must be initialized within beforeEach, after fake timers are enabled.
	let user: ReturnType<typeof userEvent.setup>
	const saveHistoryForDate = vi.fn()

	beforeAll(async () => {
		vi.mocked(fetchWordList).mockResolvedValue(new Set(["CAT", "BIRD"]))
		await loadWordList()
	})

	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true})

		user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

		vi.mocked(usePlayHistory).mockReturnValue({
			history: {},
			saveHistoryForDate,
			getHistoryForDate: () => null,
            clearAllHistory: () => null,
		})
	})

	afterEach(() => {
		// Clean up mocks
		vi.clearAllMocks()
		vi.useRealTimers()
	})

	describe("State Transitions", () => {
		it('should start in the "pre-game" state and show the start button', () => {
			render(<Game puzzle={MOCK_PUZZLE} gameRules={MOCK_RULES} initialHistory={null} />)

			expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument()
			expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
			expect(screen.queryByRole("region", { name: /final score report/i })).not.toBeInTheDocument()
		})

		it('should transition to the "playing" state when the start button is clicked', async () => {
			render(<Game puzzle={MOCK_PUZZLE} gameRules={MOCK_RULES} initialHistory={null} />)

			await user.click(screen.getByRole("button", { name: /start game/i }))

			expect(screen.queryByRole("button", { name: /start game/i })).not.toBeInTheDocument()
			expect(screen.getByRole("progressbar")).toBeInTheDocument()
			// The submit button should not be visible yet because the racks are unsolved
			expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument()
		})

		it('should transition to the "finished" state when a valid answer is submitted', async () => {
			// We use a puzzle that is already solved to test the submission logic
			render(<Game puzzle={MOCK_SOLVED_PUZZLE} gameRules={MOCK_RULES} initialHistory={null} />)

			// Start the game
			await user.click(screen.getByRole("button", { name: /start game/i }))

			// Because the racks are pre-filled and valid, the submit button should be visible
			const submitButton = screen.getByRole("button", { name: /submit answer/i })
			expect(submitButton).toBeInTheDocument()

			// Submit the answer
			await user.click(submitButton)

			// Assert we are in the "finished" state
			expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument()
			expect(screen.getByRole("region", { name: /final score report/i })).toBeInTheDocument()
			expect(saveHistoryForDate).toHaveBeenCalledWith(MOCK_PUZZLE.date, expect.any(Object))
		})

		it('should transition to the "finished" state when the timer runs out', async () => {
			render(<Game puzzle={MOCK_PUZZLE} gameRules={MOCK_RULES} initialHistory={null} />)

			await user.click(screen.getByRole("button", { name: /start game/i }))

			// The game is now playing
			expect(screen.getByRole("progressbar")).toBeInTheDocument()

			// Advance the timer to the end
			await act(async () => {
				await vi.advanceTimersByTimeAsync(MOCK_RULES.timerSeconds * 1000)
			})

			// Assert the game has automatically ended
			expect(screen.getByRole("region", { name: /final score report/i })).toBeInTheDocument()
			expect(saveHistoryForDate).toHaveBeenCalled()
		})

		it('should start directly in the "finished" state if there is initial history', () => {
			render(
				<Game
					puzzle={MOCK_PUZZLE}
					gameRules={MOCK_RULES}
					initialHistory={MOCK_HISTORY_RECORD}
				/>,
			)

			expect(screen.queryByRole("button", { name: /start game/i })).not.toBeInTheDocument()
			expect(screen.getByRole("region", { name: /final score report/i })).toBeInTheDocument()
		})
	})
})
