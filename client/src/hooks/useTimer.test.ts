import { act, renderHook } from "@testing-library/react"
import { useTimer } from "./useTimer"

describe("useTimer hook", () => {
    // This tells Vitest to replace global time-related functions
    // with fakes that we can control.
    beforeEach(() => {
        vi.useFakeTimers()
    })

    // This restores the real timers after each test, which is a good practice
    // to prevent tests from interfering with each other.
    afterEach(() => {
        vi.useRealTimers()
    })

    it("should return the initial duration when the timer is not active", () => {
        const onEnd = vi.fn()
        const { result } = renderHook(() => useTimer(null, onEnd, 5000))

        expect(result.current).toBe(5000)
    })

    it("should count down when the timer is active", () => {
        const onEnd = vi.fn()
        const initialDuration = 5000
        const endTime = new Date(Date.now() + initialDuration)

        const { result } = renderHook(() => useTimer(endTime, onEnd, initialDuration))

        // The initial value should be very close to the total duration
        expect(result.current).toBeCloseTo(initialDuration)

        // Let's advance the clock by 2 seconds
        act(() => {
            vi.advanceTimersByTime(2000)
        })

        // The remaining time should now be around 3 seconds
        expect(result.current).toBeCloseTo(3000)
        expect(onEnd).not.toHaveBeenCalled()
    })

    it("should call the onEnd callback when the timer finishes", () => {
        const onEnd = vi.fn()
        const initialDuration = 3000
        const endTime = new Date(Date.now() + initialDuration)

        renderHook(() => useTimer(endTime, onEnd, initialDuration))

        // Advance the clock just past the end of the timer
        act(() => {
            vi.advanceTimersByTime(3500)
        })

        // The onEnd callback should have been called exactly once
        expect(onEnd).toHaveBeenCalledTimes(1)
    })

    it("should stop the timer and clean up when the endTime is set to null", () => {
        const onEnd = vi.fn()
        const initialDuration = 5000

        // Explicitly define the props type to allow for `null`.
        type TimerProps = { endTime: Date | null }

        const { result, rerender } = renderHook<ReturnType<typeof useTimer>, TimerProps>(
            ({ endTime }) => useTimer(endTime, onEnd, initialDuration),
            {
                initialProps: { endTime: new Date(Date.now() + initialDuration) },
            },
        )

        // Stop the timer by rerendering the hook with a null endTime
        rerender({ endTime: null })

        // Advance the clock again
        act(() => {
            vi.advanceTimersByTime(2000)
        })

        // The time remaining should NOT have changed from its initial value,
        // because the timer was stopped.
        expect(result.current).toBeCloseTo(5000)
        expect(onEnd).not.toHaveBeenCalled()
    })
})
