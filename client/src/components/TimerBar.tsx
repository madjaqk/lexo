import "./TimerBar.css"

export interface TimerBarProps {
    timeRemainingMs: number
    totalTimeMs: number
}

export default function TimerBar({ timeRemainingMs, totalTimeMs }: TimerBarProps) {
    const ratio = (timeRemainingMs / totalTimeMs)

    const secondsRemaining = Math.ceil(timeRemainingMs / 1000)

    function secondsToTimeString(seconds: number): string {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    return (
        <div className="timer-bar-container">
            <div className="timer-background-red" style={{ transform: `scaleX(${ratio})`}}>
                <div className="timer-fill-green" style={{ opacity: ratio }} />
            </div>
            <span className="timer-bar-text">
                {secondsToTimeString(secondsRemaining)}
            </span>
        </div>
    )
}
