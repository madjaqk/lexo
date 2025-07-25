import { secondsToTimeString } from "@/utils/time"
import "./TimerBar.css"

export interface TimerBarProps {
    timeRemainingMs: number
    totalTimeMs: number
}

export default function TimerBar({ timeRemainingMs, totalTimeMs }: TimerBarProps) {
    const ratio = Math.max(timeRemainingMs / totalTimeMs, 0)
    const secondsRemaining = Math.ceil(timeRemainingMs / 1000)

    return (
        <div className="timer-bar-container" role="timer" aria-live="off">
            <div
                className="timer-fill"
                style={{ "--scale-ratio": ratio } as React.CSSProperties}
                role="progressbar"
                aria-valuenow={timeRemainingMs}
                aria-valuemin={0}
                aria-valuemax={totalTimeMs}
                aria-valuetext={`Time remaining: ${secondsToTimeString(secondsRemaining)}`}
            >
                <div className="timer-fill-color" style={{ opacity: ratio }} />
            </div>
            <span className="timer-bar-text" aria-hidden="true">
                {secondsToTimeString(secondsRemaining)}
            </span>
        </div>
    )
}
