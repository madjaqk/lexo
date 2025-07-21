import { useCallback, useEffect, useRef, useState } from "react"

/**
 * A custom hook to manage a countdown timer using requestAnimationFrame.
 * @param endTime The timestamp when the timer should end. The hook is active when this is not null.
 * @param onEnd A callback function to execute when the timer reaches zero.
 * @param initialDurationMs The total duration of the timer, used to reset the display.
 * @returns The time remaining in milliseconds.
 */
export function useTimer(endTime: Date | null, onEnd: () => void, initialDurationMs: number) {
    const [timeRemainingMs, setTimeRemainingMs] = useState(initialDurationMs)
    const animationFrameId = useRef<number | null>(null)

    const clearFrame = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current)
            animationFrameId.current = null
        }
    }, [])

    useEffect(() => {
        if (endTime) {
            const animate = () => {
                const remaining = endTime.getTime() - Date.now()
                if (remaining <= 0) {
                    setTimeRemainingMs(0)
                    onEnd()
                } else {
                    setTimeRemainingMs(remaining)
                    animationFrameId.current = requestAnimationFrame(animate)
                }
            }
            clearFrame()
            animationFrameId.current = requestAnimationFrame(animate)
        } else {
            clearFrame()
        }
        return clearFrame
    }, [endTime, onEnd, clearFrame])

    return timeRemainingMs
}
