import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { usePlayHistory } from "@/hooks/usePlayHistory"
import { fetchWordList } from "@/services/gameService"
import { loadWordList } from "@/services/wordValidation"
import type { DailyPuzzle, GameConfig, WordRack } from "@/types"
import Game from "./Game"

// Mock external dependencies
vi.mock("@/services/gameService", () => ({
    fetchWordList: vi.fn(),
}))

vi.mock("@/hooks/usePlayHistory", () => ({
    usePlayHistory: vi.fn(),
}))

// --- Test Data ---
const MOCK_RULES: GameConfig = {
    timerSeconds: 30,
    multipliers: { 3: 6, 4: 5 },
    earliestDate: "2025-01-01",
    currentDate: "2025-02-01",
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
const CAB_RACK: WordRack = [
    { id: "t1", letter: "C", value: 3 },
    { id: "t2", letter: "A", value: 1 },
    { id: "t4", letter: "B", value: 3 },
]
const DIRT_RACK: WordRack = [
    { id: "t7", letter: "D", value: 1 },
    { id: "t5", letter: "I", value: 1 },
    { id: "t6", letter: "R", value: 1 },
    { id: "t3", letter: "T", value: 1 },
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

const PARTIALLY_SOLVED_RACKS: WordRack[] = [
    CAT_RACK, // This rack is solved
    [
        // This rack is unsolved
        { id: "t4", letter: "B", value: 3 },
        { id: "t7", letter: "D", value: 1 },
        { id: "t5", letter: "I", value: 1 },
        { id: "t6", letter: "R", value: 1 },
    ],
]

const MOCK_PUZZLE: DailyPuzzle = {
    date: "2025-07-21",
    initialRacks: initialRacks,
    targetSolution: [CAB_RACK, DIRT_RACK],
}

const MOCK_SOLVED_PUZZLE: DailyPuzzle = {
    ...MOCK_PUZZLE,
    initialRacks: [CAT_RACK, BIRD_RACK], // Start with solved racks
}

const MOCK_PARTIALLY_SOLVED_PUZZLE: DailyPuzzle = {
    ...MOCK_PUZZLE,
    initialRacks: PARTIALLY_SOLVED_RACKS,
}

const MOCK_HISTORY_RECORD = {
    racks: [CAT_RACK, BIRD_RACK],
    score: 60,
    targetScore: 62,
}

describe("Game Component - Integration Tests", () => {
    // userEvent must be initialized within beforeEach, after fake timers are enabled.
    let user: ReturnType<typeof userEvent.setup>
    const saveHistoryForDate = vi.fn()
    const onDateSelect = vi.fn()
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect

    // This variable is used to define the upper-left corner of the dnd-kit drag preview, which
    // in turn is used to determine the collisionRect passed into the custom collision detection
    // and keyboard coordinate functions.  (Normally dnd-kit would do this automatically, but
    // jsdom doesn't actually generate any layout, so we have to manually track it.)  For
    // mouse-based tests, this will be the same as the pointer's current coordinates; for
    // keyboard tests, it will be the same as the "source" element being dragged.
    let dragPreviewOrigin = { x: 0, y: 0 }

    beforeAll(async () => {
        vi.mocked(fetchWordList).mockResolvedValue(new Set(["CAT", "BIRD", "CAB", "DIRT"]))
        await loadWordList()

        // Mock getBoundingClientRect to provide fake geometry for dnd-kit in jsdom.
        Element.prototype.getBoundingClientRect = function () {
            const el = this as HTMLElement
            const label = el.getAttribute("aria-label")

            // Handle the element inside DragOverlay, which has no label.
            // This is the key to providing a non-zero `collisionRect`.
            if (el.classList.contains("drag-preview")) {
                // The drag-preview's rect must be dynamic and follow the pointer.
                return {
                    width: 45,
                    height: 45,
                    x: dragPreviewOrigin.x,
                    y: dragPreviewOrigin.y,
                    top: dragPreviewOrigin.y,
                    left: dragPreviewOrigin.x,
                    right: dragPreviewOrigin.x + 45,
                    bottom: dragPreviewOrigin.y + 45,
                    toJSON: () => "",
                } as DOMRect
            }

            // For racks, return a large rectangle with a unique Y position.
            if (label?.startsWith("Word rack")) {
                const rackMatch = label.match(/Word rack (\d+)/)
                // The label is 1-based, so we subtract 1 for a 0-based index.
                const rackIndex = rackMatch ? Number.parseInt(rackMatch[1], 10) - 1 : -1
                return {
                    x: 0,
                    y: rackIndex * 100,
                    width: 500,
                    height: 50,
                    top: rackIndex * 100,
                    right: 500,
                    bottom: rackIndex * 100 + 50,
                    left: 0,
                    toJSON: () => "",
                } as DOMRect
            }

            // For tiles, use the rack and tile index to calculate a unique position.
            if (label?.startsWith("Tile")) {
                const rackMatch = label.match(/rack (\d+)/)
                const rackIndex = rackMatch ? Number.parseInt(rackMatch[1], 10) - 1 : -1
                const tileIndex = Number.parseInt(el.getAttribute("data-tile-index") || "-1", 10)

                return {
                    x: tileIndex * 50, // Tiles are laid out horizontally
                    y: rackIndex * 100,
                    width: 45,
                    height: 45,
                    top: rackIndex * 100,
                    right: tileIndex * 50 + 45,
                    bottom: rackIndex * 100 + 45,
                    left: tileIndex * 50,
                    toJSON: () => "",
                } as DOMRect
            }

            // For any other element, call the original jsdom implementation.
            return originalGetBoundingClientRect.call(this)
        }
    })

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true })

        vi.mocked(usePlayHistory).mockReturnValue({
            history: {},
            saveHistoryForDate,
            getHistoryForDate: () => null,
            clearAllHistory: () => null,
        })

        user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

        dragPreviewOrigin = { x: 0, y: 0 }

        // The modal uses a portal, so we need to add the portal root to the DOM
        // for tests that render the modal.
        const modalRoot = document.createElement("div")
        modalRoot.id = "modal-root"
        document.body.appendChild(modalRoot)
    })

    afterEach(() => {
        // Clean up mocks
        vi.clearAllMocks()
        vi.restoreAllMocks()
        vi.useRealTimers()

        // Clean up the portal root
        const modalRoot = document.getElementById("modal-root")
        if (modalRoot) {
            document.body.removeChild(modalRoot)
        }
    })

    afterAll(() => {
        // Restore the original implementation after all tests in this file have run.
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
    })

    // Helper function that uses our mocked geometry to perform a drag.
    async function drag(source: HTMLElement, target: HTMLElement) {
        const sourceRect = source.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        // We must use separate, awaited pointer calls. A single call with an array of
        // steps is not resilient to the re-renders that dnd-kit triggers mid-drag.

        // Update our stateful mock's coordinates and fire the event.
        dragPreviewOrigin = { x: sourceRect.x, y: sourceRect.y }
        await user.pointer({
            keys: "[MouseLeft>]",
            target: source,
            coords: dragPreviewOrigin,
        })

        // Update coordinates for the move and fire the event.
        // This logic makes the drop position explicit based on the target type.
        let targetX: number
        if (target.getAttribute("role") === "toolbar") {
            // Target is a rack, so we aim for the empty space at the end.
            // This ensures dragging a tile to another rack places it at the end.
            targetX = targetRect.x + targetRect.width - 10 // A small offset from the very edge
        } else {
            // Target is another tile, so we aim for its beginning to insert before it.
            targetX = targetRect.x + 5 // A small offset from the left edge
        }

        dragPreviewOrigin = { x: targetX, y: targetRect.y }
        await user.pointer({ target: target, coords: dragPreviewOrigin })

        // dnd-kit's PointerSensor attaches the 'up' listener to the document.
        // By firing the event on the body, we avoid stale element references.
        await user.pointer({ keys: "[/MouseLeft]", target: document.body })
    }

    // Helper function to simulate a full keyboard-based drag-and-drop action.
    async function keyboardDragByLabel(label: RegExp, moves: string[]) {
        // I had a lot of trouble getting these tests working, but this is the configuration that
        // did it.  As far as I can tell, using User Event's .keyboard won't work, it has to be
        // the lower-level fireEvent API.  Similarly, just wrapping everything in a single act
        // block failed, but wrapping each event individually didn't, and same with selecting the
        // source element rather than finding it once and saving the reference.  It's possible
        // that some of this was misdiagnosis, that some later changes I made fixed the
        // underlying problem that had required using fireEvent, but I am confident that the
        // current structure works and am hesitant to experiment now.--JDB 2025-08-17

        function source() {
            return screen.getByLabelText(label)
        }

        function dragPreviewOriginFromSource() {
            const sourceRect = source().getBoundingClientRect()
            return { x: sourceRect.x, y: sourceRect.y }
        }

        dragPreviewOrigin = dragPreviewOriginFromSource()
        await act(async () => fireEvent.focus(source()))
        await act(async () => fireEvent.keyDown(source(), { key: " ", code: "Space" }))
        await act(async () => fireEvent.keyUp(source(), { key: " ", code: "Space" }))
        dragPreviewOrigin = dragPreviewOriginFromSource()

        for (const move of moves) {
            await act(async () => fireEvent.keyDown(source(), { key: move, code: move }))
            await act(async () => fireEvent.keyUp(source(), { key: move, code: move }))
            dragPreviewOrigin = dragPreviewOriginFromSource()
        }

        await act(async () => fireEvent.keyDown(source(), { key: " ", code: "Space" }))
        await act(async () => fireEvent.keyUp(source(), { key: " ", code: "Space" }))
        // The move is complete, the drag preview shouldn't still be on screen, so this line
        // _probably_ isn't necessary?
        dragPreviewOrigin = dragPreviewOriginFromSource()
    }

    // Helper to get the text content of tiles in a specific rack.
    function getRackTiles(rackNumber: number) {
        const rack = screen.getByRole("toolbar", { name: `Word rack ${rackNumber}` })
        const tiles = within(rack).getAllByLabelText(/Tile .*/)
        return tiles.map((t) => t.textContent)
    }

    describe("State Transitions", () => {
        it('should start in the "pre-game" state and show the start button', () => {
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument()
            expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
            expect(
                screen.queryByRole("region", { name: /final score report/i }),
            ).not.toBeInTheDocument()
        })

        it('should transition to the "playing" state when the start button is clicked', async () => {
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            await user.click(screen.getByRole("button", { name: /start game/i }))

            expect(screen.queryByRole("button", { name: /start game/i })).not.toBeInTheDocument()
            expect(screen.getByRole("progressbar")).toBeInTheDocument()
            // The submit button should not be visible yet because the racks are unsolved
            expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument()
        })

        it('should transition to the "finished" state when a valid answer is submitted', async () => {
            // We use a puzzle that is already solved to test the submission logic
            render(
                <Game
                    puzzle={MOCK_SOLVED_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

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

        it('should transition to the "finished" state if a user gives up', async () => {
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            // Start the game
            await user.click(screen.getByRole("button", { name: /start game/i }))

            // The "Give up?" button should be visible
            const giveUpButton = screen.getByRole("button", { name: /give up\?/i })
            expect(giveUpButton).toBeInTheDocument()

            // Click the "Give up?" button
            await user.click(giveUpButton)

            // Assert we are in the "finished" state
            expect(screen.queryByRole("button", { name: /give up\?/i })).not.toBeInTheDocument()
            expect(screen.getByRole("region", { name: /final score report/i })).toBeInTheDocument()
            expect(saveHistoryForDate).toHaveBeenCalledWith(MOCK_PUZZLE.date, expect.any(Object))
        })

        it('should transition to the "finished" state when the timer runs out', async () => {
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            await user.click(screen.getByRole("button", { name: /start game/i }))

            // The game is now playing
            expect(screen.getByRole("progressbar")).toBeInTheDocument()

            // Advance the timer to the end
            await act(async () => {
                // `act` ensures all state updates from timers are processed
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
                    gameConfig={MOCK_RULES}
                    initialHistory={MOCK_HISTORY_RECORD}
                    onDateSelect={onDateSelect}
                />,
            )

            expect(screen.queryByRole("button", { name: /start game/i })).not.toBeInTheDocument()
            expect(screen.getByRole("region", { name: /final score report/i })).toBeInTheDocument()
        })
    })

    describe("Happy Path", () => {
        it("should allow a user to start, solve, and submit a puzzle", async () => {
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            // 1. Start the game
            await user.click(screen.getByRole("button", { name: /start game/i }))

            // Give Up? button should be visible, submit button should not be
            expect(screen.getByRole("button", { name: /give up\?/i })).toBeInTheDocument()
            expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument()

            // Initial state: R1:[A,B,C], R2:[D,I,R,T]

            // Move T to Rack 1 -> R1:[A,B,C,T], R2:[D,I,R]
            await drag(
                screen.getByLabelText(/Tile T/i),
                screen.getByRole("toolbar", { name: /word rack 1/i }),
            )

            // Move B to the start of Rack 2 -> R1: [A,C,T], R2:[B,D,I,R]
            await drag(screen.getByLabelText(/Tile B/i), screen.getByLabelText(/Tile D/i))

            // Reorder Rack 1 to "CAT" (Move C before A) -> R1:[C,A,T]
            await drag(screen.getByLabelText(/Tile C/i), screen.getByLabelText(/Tile A/i))

            // Reorder Rack 2 to "BIRD" (Move D to end) -> R2:[B,I,R,D]
            await drag(
                screen.getByLabelText(/Tile D/i),
                screen.getByRole("toolbar", { name: /word rack 2/i }),
            )

            // 3. Assert that the submit button is now visible and the Give Up? button is not
            expect(screen.queryByRole("button", { name: /give up\?/i })).not.toBeInTheDocument()
            const submitButton = screen.getByRole("button", { name: /submit answer/i })
            expect(submitButton).toBeInTheDocument()

            // 4. Submit the answer and verify the final state
            await user.click(submitButton)

            expect(screen.getByRole("region", { name: /final score report/i })).toBeInTheDocument()

            // CAT (base 5 * mult 6) + BIRD (base 6 * mult 5) = 30 + 30 = 60. Target is CAB (base 7 * mult 6) + DIRT (base 4 * mult 5) = 42 + 20 = 62.
            const scoreText = screen.getByText(/your score was 2 under the target/i)
            expect(scoreText).toBeInTheDocument()

            expect(saveHistoryForDate).toHaveBeenCalledTimes(1)
            expect(saveHistoryForDate).toHaveBeenCalledWith(MOCK_PUZZLE.date, expect.any(Object))
        })
    })

    describe("Instructions Modal", () => {
        it("should automatically show the instructions modal for a new player", () => {
            // Mock usePlayHistory to return an empty history object
            vi.mocked(usePlayHistory).mockReturnValue({
                history: {},
                saveHistoryForDate,
                getHistoryForDate: () => null,
                clearAllHistory: () => null,
            })

            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            expect(screen.getByRole("dialog", { name: /how to play/i })).toBeInTheDocument()
        })

        it("should NOT automatically show the instructions modal for a returning player", () => {
            // The default mock from beforeEach already simulates a returning player
            vi.mocked(usePlayHistory).mockReturnValue({
                history: { "2025-01-01": MOCK_HISTORY_RECORD }, // Non-empty history
                saveHistoryForDate,
                getHistoryForDate: () => null,
                clearAllHistory: () => null,
            })
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })

        it("should allow a user to manually open and close the instructions modal", async () => {
            // Define the history object once to ensure a stable reference across re-renders.
            const mockHistory = { "2025-01-01": MOCK_HISTORY_RECORD }
            vi.mocked(usePlayHistory).mockReturnValue({
                history: mockHistory,
                saveHistoryForDate,
                getHistoryForDate: () => null,
                clearAllHistory: () => null,
            })

            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            // Modal should not be visible initially for a returning player
            expect(screen.queryByRole("dialog", { name: /how to play/i })).not.toBeInTheDocument()

            await user.click(document.body)

            // Manually open the modal
            await user.click(screen.getByRole("button", { name: /instructions/i }))
            const dialog = await screen.findByRole("dialog", { name: /how to play/i })
            expect(dialog).toBeInTheDocument()

            // Manually close the modal by clicking the close button
            await user.click(within(dialog).getByRole("button", { name: /close/i }))
            expect(screen.queryByRole("dialog", { name: /how to play/i })).not.toBeInTheDocument()
        })
    })

    describe("Archives Modal", () => {
        it("should NOT show the Archives button if the user has no play history", () => {
            // The default mock from beforeEach has an empty history object.
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            expect(screen.queryByRole("button", { name: /archives/i })).not.toBeInTheDocument()
        })

        it("should show the Archives button if the user has play history", () => {
            vi.mocked(usePlayHistory).mockReturnValue({
                history: { "2025-01-15": MOCK_HISTORY_RECORD },
                saveHistoryForDate,
                getHistoryForDate: () => null,
                clearAllHistory: () => null,
            })

            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            expect(screen.getByRole("button", { name: /archives/i })).toBeInTheDocument()
        })

        it("should open the Archives modal when the button is clicked", async () => {
            vi.mocked(usePlayHistory).mockReturnValue({
                history: { "2025-01-15": MOCK_HISTORY_RECORD },
                saveHistoryForDate,
                getHistoryForDate: () => null,
                clearAllHistory: () => null,
            })
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            await user.click(screen.getByRole("button", { name: /archives/i }))
            expect(await screen.findByRole("dialog", { name: /past puzzles/i })).toBeInTheDocument()
        })
    })

    describe("Keyboard Navigation", () => {
        beforeEach(async () => {
            // Start the game before each keyboard test
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            await user.click(screen.getByRole("button", { name: /start game/i }))
        })

        it("should move a tile to the right within the same rack", async () => {
            const initialRack1 = getRackTiles(1) // ["A1", "B3", "C3"]

            await keyboardDragByLabel(/Tile B/i, ["ArrowRight"])

            const finalRack1 = getRackTiles(1)
            // Expected: ["A1", "C3", "B3"]
            expect(finalRack1).toEqual([initialRack1[0], initialRack1[2], initialRack1[1]])
        })

        it("should move a tile to the left within the same rack", async () => {
            const initialRack1 = getRackTiles(1) // ["A1", "B3", "C3"]

            await keyboardDragByLabel(/Tile C/i, ["ArrowLeft"])

            const finalRack1 = getRackTiles(1)
            // Expected: ["A1", "C3", "B3"]
            expect(finalRack1).toEqual([initialRack1[0], initialRack1[2], initialRack1[1]])
        })

        it("should move a tile down to the next rack", async () => {
            await keyboardDragByLabel(/Tile A/i, ["ArrowDown"])

            // Assert tile A is no longer in rack 1
            expect(getRackTiles(1)).not.toContain("A1")
            // Assert tile A is now in rack 2, at the beginning
            expect(getRackTiles(2)).toEqual(["A1", "D1", "I1", "R1", "T1"])
        })

        it("should move a tile up to the previous rack", async () => {
            await keyboardDragByLabel(/Tile D/i, ["ArrowUp"])

            // Assert tile D is no longer in rack 2
            expect(getRackTiles(2)).not.toContain("D1")
            // Assert tile D is now in rack 1, at the beginning
            expect(getRackTiles(1)).toEqual(["D1", "A1", "B3", "C3"])
        })

        it("should not move a tile past the right edge of a rack", async () => {
            const initialRack1 = getRackTiles(1)

            await keyboardDragByLabel(/Tile C/i, ["ArrowRight"])

            // The rack should be unchanged
            expect(getRackTiles(1)).toEqual(initialRack1)
        })

        it("should move a tile up or down to the end of the rack if not enough tiles in destination", async () => {
            await keyboardDragByLabel(/Tile T/i, ["ArrowUp"])

            // Assert tile T is no longer in rack 2
            expect(getRackTiles(2)).not.toContain("T1")
            // Assert tile T is now in rack 1, at the end
            expect(getRackTiles(1)).toEqual(["A1", "B3", "C3", "T1"])

            await keyboardDragByLabel(/Tile T/i, ["ArrowDown"])

            // Assert tile T is no longer in rack 1
            expect(getRackTiles(1)).not.toContain("T1")
            // Assert tile T is now in rack 2, at the end
            expect(getRackTiles(2)).toEqual(["D1", "I1", "R1", "T1"])
        })

        it("should handle a complex sequence of moves", async () => {
            await keyboardDragByLabel(/Tile B/i, ["ArrowRight", "ArrowDown"])

            // After ArrowRight, preview is [A, C, B]
            // After ArrowDown, B moves to rack 2 at visual index 2
            expect(getRackTiles(1)).toEqual(["A1", "C3"])
            expect(getRackTiles(2)).toEqual(["D1", "I1", "B3", "R1", "T1"])
        })
    })

    describe("Other", () => {
        // Helper to get the text content of tiles in a specific rack.
        function getRackTiles(rackNumber: number) {
            const rack = screen.getByRole("toolbar", { name: `Word rack ${rackNumber}` })
            const tiles = within(rack).getAllByLabelText(/Tile .*/)
            return tiles.map((t) => t.textContent)
        }

        it("should display the give up button for a completely unsolved board", async () => {
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            await user.click(screen.getByRole("button", { name: /start game/i }))
            expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: /give up\?/i })).toBeInTheDocument()
        })

        it("should display the give up button for a partially solved board", async () => {
            render(
                <Game
                    puzzle={MOCK_PARTIALLY_SOLVED_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )

            await user.click(screen.getByRole("button", { name: /start game/i }))
            expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: /give up\?/i })).toBeInTheDocument()
        })

        it("should prevent dragging a tile to a full rack", async () => {
            // Use the standard puzzle but override the maxTiles prop.
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                    maxTiles={5}
                />,
            )
            await user.click(screen.getByRole("button", { name: /start game/i }))

            // 1. Drag one tile from rack 1 to rack 2. Rack 2 will now have 5 tiles (the max).
            await drag(
                screen.getByLabelText(/Tile C/),
                screen.getByRole("toolbar", { name: /word rack 2/i }),
            )
            expect(getRackTiles(2)).toHaveLength(5)

            // 2. Attempt to drag a second tile from rack 1 to the now-full rack 2.
            await drag(
                screen.getByLabelText(/Tile B/),
                screen.getByRole("toolbar", { name: /word rack 2/i }),
            )

            // 3. Assert that the racks have not changed because the second drag was prevented.
            expect(getRackTiles(1)).toEqual(["A1", "B3"])
            expect(getRackTiles(2)).toEqual(["D1", "I1", "R1", "T1", "C3"])
        })

        it("should cancel a drag and revert racks on Escape key press", async () => {
            // NOTE: Something about this test—and specifically the line `await user.pointer({
            // keys: "[MouseLeft>]", target: sourceTile, coords: sourceRect })`—seems to pollute
            // the global testing environment, so that tests that run after this that rely on
            // user.click fail.  As far as I can tell, it's not about the user-event state itself
            // (as the user is replaced each test), but rather that this test generates some
            // event listener that isn't being properly cleaned up (possibly `stopPropagation` on
            // `click` events, but it seems like other tests using dnd-kit also leave a
            // `stopPropagation` listener on `click` without interfering with other tests, so
            // maybe that's a red herring).  In any case, the tests pass as long as this is the
            // last test in the file; change that at your peril.--JDB 2025-08-11
            render(
                <Game
                    puzzle={MOCK_PUZZLE}
                    gameConfig={MOCK_RULES}
                    initialHistory={null}
                    onDateSelect={onDateSelect}
                />,
            )
            await user.click(screen.getByRole("button", { name: /start game/i }))

            const initialRack1State = getRackTiles(1)

            // Manually perform a drag-and-cancel action
            const sourceTile = screen.getByLabelText(/Tile C/)
            const targetRack = screen.getByRole("toolbar", { name: /word rack 2/i })
            const sourceRect = sourceTile.getBoundingClientRect()
            const targetRect = targetRack.getBoundingClientRect()

            await user.pointer({ keys: "[MouseLeft>]", target: sourceTile, coords: sourceRect })
            await user.pointer({ target: targetRack, coords: targetRect })
            await user.keyboard("{Escape}")

            // Assert that the rack has reverted to its initial state
            expect(getRackTiles(1)).toEqual(initialRack1State)

            // Clean up the user-event pointer state by releasing the mouse button.
            await user.pointer({ keys: "[/MouseLeft]" })
        })
    })
})
