import { act, type RenderHookResult, renderHook } from "@testing-library/react"
import type { PlayHistoryRecord } from "@/types"
import { LOCAL_STORAGE_KEY, usePlayHistory } from "./usePlayHistory"

const mockRecord: PlayHistoryRecord = {
    racks: [[{ id: "1", letter: "A", value: 1 }]],
    score: 100,
    targetScore: 90,
}

describe("usePlayHistory hook", () => {
    let hookResult: RenderHookResult<ReturnType<typeof usePlayHistory>, unknown>
    let usePlayHistoryHook: { current: ReturnType<typeof usePlayHistory> }

    const testDate = "2025-08-15"

    beforeEach(() => {
        // The `usehooks-ts` library writes to localStorage, so we need to clear it
        // before each test to ensure test isolation.
        window.localStorage.removeItem(LOCAL_STORAGE_KEY)

        hookResult = renderHook(() => usePlayHistory())
        usePlayHistoryHook = hookResult.result
    })

    it("should start with an empty history", () => {
        expect(usePlayHistoryHook.current.history).toEqual({})
    })

    it("should return null for a non-existent date", () => {
        expect(usePlayHistoryHook.current.getHistoryForDate(testDate)).toBeNull()
    })

    it("should save and retrieve a record for a date", () => {
        act(() => {
            usePlayHistoryHook.current.saveHistoryForDate(testDate, mockRecord)
        })

        // Using `expect.objectContaining` makes the test more robust.
        // It asserts that the object has at least these properties, but won't
        // fail if new, irrelevant properties are added in the future.
        expect(usePlayHistoryHook.current.getHistoryForDate(testDate)).toEqual(
            expect.objectContaining(mockRecord),
        )
        expect(usePlayHistoryHook.current.history).toEqual({
            [testDate]: expect.objectContaining(mockRecord),
        })
    })

    it("should overwrite an existing record for the same date", () => {
        const newRecord = { ...mockRecord, score: 999 }

        act(() => {
            usePlayHistoryHook.current.saveHistoryForDate(testDate, mockRecord)
        })
        act(() => {
            usePlayHistoryHook.current.saveHistoryForDate(testDate, newRecord)
        })

        expect(usePlayHistoryHook.current.getHistoryForDate(testDate)).toEqual(
            expect.objectContaining(newRecord),
        )
    })

    it("should not overwrite a record for a different date", () => {
        const otherDate = "2025-08-14"
        const otherRecord: PlayHistoryRecord = {
            racks: [[{ id: "1", letter: "B", value: 2 }]],
            score: 50,
            targetScore: 65,
        }

        act(() => usePlayHistoryHook.current.saveHistoryForDate(otherDate, otherRecord))
        act(() => usePlayHistoryHook.current.saveHistoryForDate(testDate, mockRecord))

        const expectedHistory = {
            [otherDate]: expect.objectContaining(otherRecord),
            [testDate]: expect.objectContaining(mockRecord),
        }

        expect(usePlayHistoryHook.current.history).toEqual(expect.objectContaining(expectedHistory))
    })

    it("should clear all history", () => {
        act(() => {
            usePlayHistoryHook.current.saveHistoryForDate(testDate, mockRecord)
        })

        expect(usePlayHistoryHook.current.history).not.toEqual({})

        act(() => {
            usePlayHistoryHook.current.clearAllHistory()
        })

        expect(usePlayHistoryHook.current.history).toEqual({})
        expect(usePlayHistoryHook.current.getHistoryForDate(testDate)).toBeNull()
    })

    it("should initialize with data from localStorage if it exists", () => {
        const initialHistory = { [testDate]: mockRecord }
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialHistory))

        // Have to call renderHook here so it will see the existing data in localStorage
        const { result } = renderHook(() => usePlayHistory())

        expect(result.current.history).toEqual(expect.objectContaining(initialHistory))
        expect(result.current.getHistoryForDate(testDate)).toEqual(
            expect.objectContaining(mockRecord),
        )
    })
})
