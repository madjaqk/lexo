import "./TimerBar.css"

export interface TimerBarProps {
    timeRemainingMs: number
    totalTimeMs: number
}

export default function TimerBar({ timeRemainingMs, totalTimeMs }: TimerBarProps) {
    const ratio = Math.max(timeRemainingMs / totalTimeMs, 0)

    const secondsRemaining = Math.ceil(timeRemainingMs / 1000)

    function secondsToTimeString(seconds: number): string {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    return (
        <div className="timer-bar-container">
            <div
                className="timer-fill"
                style={{"--scale-ratio": ratio } as React.CSSProperties}
            >
                <div className="timer-fill-color" style={{ opacity: ratio }} />
            </div>
            <span className="timer-bar-text">{secondsToTimeString(secondsRemaining)}</span>
        </div>
    )
}
