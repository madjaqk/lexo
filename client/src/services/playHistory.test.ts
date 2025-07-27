import {
    clearAllHistory,
    getHistoryForDate,
    LOCAL_STORAGE_KEY,
    type PlayHistoryRecord,
    saveHistoryForDate,
} from "./playHistory"

const mockHistoryRecord: PlayHistoryRecord = {
    racks: [[{ id: "1", letter: "A", value: 1 }]],
    score: 100,
    targetScore: 90,
}

describe("playHistory service", () => {
    let storage: Record<string, string> = {}
    const testDate = "2025-08-15"

    // Mock localStorage before each test
    beforeEach(() => {
        storage = {}
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(
            (key, value) => {storage[key] = value},
        )
        vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => storage[key] ?? null)
    })

    // Restore mocks after each test
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("getHistoryForDate", () => {
        it("should return null when localStorage is empty", () => {
            expect(getHistoryForDate(testDate)).toBeNull()
        })

        it("should return null if history exists but not for the given date", () => {
            const history = { "2025-07-14": mockHistoryRecord }
            storage[LOCAL_STORAGE_KEY] = JSON.stringify(history)
            expect(getHistoryForDate(testDate)).toBeNull()
        })

        it("should return the correct record when it exists for the given date", () => {
            const history = { [testDate]: mockHistoryRecord }
            storage[LOCAL_STORAGE_KEY] = JSON.stringify(history)
            expect(getHistoryForDate(testDate)).toEqual(mockHistoryRecord)
        })

        it("should return null and log an error if the data in localStorage is invalid JSON", () => {
            storage[LOCAL_STORAGE_KEY] = "this is not valid json"
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

            const record = getHistoryForDate(testDate)

            expect(record).toBeNull()
            expect(consoleErrorSpy).toHaveBeenCalled()

            consoleErrorSpy.mockRestore()
        })
    })

    describe("saveHistoryForDate", () => {
        it("should create a new history object if one does not exist", () => {
            saveHistoryForDate(testDate, mockHistoryRecord)

            const expectedHistory = { [testDate]: mockHistoryRecord }
            expect(JSON.parse(storage[LOCAL_STORAGE_KEY])).toEqual(expectedHistory)
        })

        it("should add a new entry to an existing history object", () => {
            const initialHistory = { "2025-07-14": mockHistoryRecord }
            storage[LOCAL_STORAGE_KEY] = JSON.stringify(initialHistory)

            const newRecord = { ...mockHistoryRecord, score: 110 }
            saveHistoryForDate(testDate, newRecord)

            const expectedHistory = { ...initialHistory, [testDate]: newRecord }
            expect(JSON.parse(storage[LOCAL_STORAGE_KEY])).toEqual(expectedHistory)
        })

        it("should overwrite an existing entry for the same date", () => {
            const initialHistory = { [testDate]: mockHistoryRecord }
            storage[LOCAL_STORAGE_KEY] = JSON.stringify(initialHistory)

            const updatedRecord = { ...mockHistoryRecord, score: 120 }
            saveHistoryForDate(testDate, updatedRecord)

            const expectedHistory = { [testDate]: updatedRecord }
            expect(JSON.parse(storage[LOCAL_STORAGE_KEY])).toEqual(expectedHistory)
        })

        it("should log an error but not fail if the data in localStorage is invalid JSON", () => {
            storage[LOCAL_STORAGE_KEY] = "this is not valid json"
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

            saveHistoryForDate(testDate, mockHistoryRecord)
            expect(JSON.parse(storage[LOCAL_STORAGE_KEY])).toEqual({ [testDate]: mockHistoryRecord })

            expect(consoleErrorSpy).toHaveBeenCalled()

            consoleErrorSpy.mockRestore()

        })
    })

    describe("clearAllHistory", () => {
        it("should call removeItem on localStorage with the correct key", () => {
            const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem")
            clearAllHistory()
            expect(removeItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY)
        })
    })
})
