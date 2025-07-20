import { useCallback, useState } from "react"
import { useGameScoring } from "@/hooks/useGameScoring"
import { useTimer } from "@/hooks/useTimer"
import { saveHistoryForDate } from "@/services/playHistory"
import type { DailyPuzzle, GameRules, GameState } from "@/types"
import "./Game.css"
import ScoreReport from "./ScoreReport"
import TimerBar from "./TimerBar"
import WordRacks from "./WordRacks"

export interface GameProps {
    puzzle: DailyPuzzle
    gameRules: GameRules
    maxTiles?: number
}

export default function Game(props: GameProps) {
    const { puzzle, gameRules, maxTiles = 8 } = props

    const [gameState, setGameState] = useState<GameState>("pre-game")
    const [wordRacks, setWordRacks] = useState(puzzle.initialRacks)
    const [endTime, setEndTime] = useState<Date | null>(null)

    const { rackScores, targetScores, totalScore, targetScore } = useGameScoring(
        wordRacks,
        puzzle,
        gameRules,
    )

    const startGame = useCallback(() => {
        setGameState("playing")
        setEndTime(new Date(Date.now() + gameRules.timerSeconds * 1000))
    }, [gameRules.timerSeconds])

    const endGame = useCallback(() => {
        setGameState("finished")
        setEndTime(null)
        saveHistoryForDate(puzzle.date, {
            racks: wordRacks,
            score: totalScore,
            targetScore: targetScore,
        })
    }, [puzzle.date, wordRacks, totalScore, targetScore])

    const timeRemainingMs = useTimer(endTime, endGame, gameRules.timerSeconds * 1000)

    return (
        <div className="game">
            <p>DATE: {puzzle.date}</p>
            {gameState === "pre-game" && (
                <button type="button" onClick={startGame}>
                    Start Game!
                </button>
            )}
            {gameState !== "pre-game" && (
                <div className="game-board">
                    <TimerBar
                        timeRemainingMs={timeRemainingMs}
                        totalTimeMs={gameRules.timerSeconds * 1000}
                    />
                    <div className="racks-column">
                        <WordRacks
                            racks={wordRacks}
                            setRacks={setWordRacks}
                            maxTiles={maxTiles}
                            rackScores={rackScores}
                            disabled={gameState !== "playing"}
                        />
                        <div className="total-score-row">
                            <div className="rack-score-spacer">
                                {gameState === "playing" &&
                                    rackScores.every((s) => s.baseScore > 0) && (
                                        <button type="button" onClick={endGame}>
                                            Submit Answer
                                        </button>
                                    )}
                            </div>
                            <div className="score total-score">TOTAL: {totalScore}</div>
                        </div>
                    </div>
                </div>
            )}
            {gameState === "finished" && (
                <div className="game-finished racks-column">
                    <h2>Good job! Here was our answer:</h2>
                    <WordRacks
                        racks={puzzle.targetSolution}
                        rackScores={targetScores}
                        disabled={true}
                        setRacks={setWordRacks}
                    />
                    <div className="total-score-row">
                        <div className="rack-score-spacer">
                            {" "}
                            <ScoreReport
                                rackScores={rackScores}
                                targetScores={targetScores}
                                date={puzzle.date}
                            />{" "}
                        </div>
                        <div className="score total-score">TOTAL: {targetScore}</div>
                    </div>
                </div>
            )}
        </div>
    )
}
