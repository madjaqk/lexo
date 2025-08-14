import { useCallback, useEffect, useRef, useState } from "react"
import { useGameScoring } from "@/hooks/useGameScoring"
import { usePlayHistory } from "@/hooks/usePlayHistory"
import { useTimer } from "@/hooks/useTimer"
import ArchivesModal from "./ArchivesModal"
import type { DailyPuzzle, GameConfig, GameState, PlayHistoryRecord } from "@/types"
import "./Game.css"
import InstructionsModal from "./InstructionsModal"
import ScoreReport from "./ScoreReport"
import TimerBar from "./TimerBar"
import WordRacks from "./WordRacks"

export interface GameProps {
    puzzle: DailyPuzzle
    gameConfig: GameConfig
    initialHistory: PlayHistoryRecord | null
    onDateSelect: (date: string) => void
    maxTiles?: number
}

export default function Game(props: GameProps) {
    const { puzzle, gameConfig, initialHistory, onDateSelect, maxTiles = 8 } = props

    // If there's a history, the game is already finished.
    const [gameState, setGameState] = useState<GameState>(initialHistory ? "finished" : "pre-game")
    const [wordRacks, setWordRacks] = useState(initialHistory?.racks ?? puzzle.initialRacks)
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
    const [isArchivesOpen, setIsArchivesOpen] = useState(false)
    const [endTime, setEndTime] = useState<Date | null>(null)
    const gameBoardRef = useRef<HTMLDivElement>(null)
    const { history, saveHistoryForDate } = usePlayHistory()

    const { rackScores, targetScores, totalScore, targetScore } = useGameScoring(
        wordRacks,
        puzzle,
        gameConfig,
    )

    const startGame = useCallback(() => {
        setGameState("playing")
        setEndTime(new Date(Date.now() + gameConfig.timerSeconds * 1000))
    }, [gameConfig.timerSeconds])

    const endGame = useCallback(() => {
        setGameState("finished")
        setEndTime(null)
        saveHistoryForDate(puzzle.date, {
            racks: wordRacks,
            score: totalScore,
            targetScore: targetScore,
        })
    }, [puzzle.date, saveHistoryForDate, wordRacks, totalScore, targetScore])

    // Memoize modal handlers to ensure stable function references are passed as props.
    const openInstructions = useCallback(() => setIsInstructionsOpen(true), [])
    const closeInstructions = useCallback(() => setIsInstructionsOpen(false), [])
    const openArchives = useCallback(() => setIsArchivesOpen(true), [])
    const closeArchives = useCallback(() => setIsArchivesOpen(false), [])

    const timeRemainingMs = useTimer(endTime, endGame, gameConfig.timerSeconds * 1000)

    useEffect(() => {
        if (gameState === "playing" && gameBoardRef.current) {
            gameBoardRef.current.focus()
        }
    }, [gameState])

    // Show instructions for new players
    useEffect(() => {
        // Check if history is loaded and if it's empty
        if (history && Object.keys(history).length === 0) {
            setIsInstructionsOpen(true)
        }
    }, [history])

    useEffect(() => {
        if (initialHistory) {
            setWordRacks(initialHistory.racks)
            setGameState("finished")
        } else {
            setWordRacks(puzzle.initialRacks)
            setGameState("pre-game")
        }
    }, [initialHistory, puzzle.initialRacks])

    return (
        <div className="game">
            <div className="game-header">
                <p className="game-date">DATE: {puzzle.date}</p>
                <div className="header-buttons">
                    <button type="button" onClick={openInstructions}>
                        Instructions
                    </button>
                    {history && Object.keys(history).length > 0 && (
                        <button type="button" onClick={openArchives}>
                            Archives
                        </button>
                    )}
                </div>
            </div>
            {gameState === "pre-game" && (
                <div className="pre-game-container">
                    <button type="button" onClick={startGame}>
                        Start Game!
                    </button>
                </div>
            )}
            {gameState !== "pre-game" && (
                <div className="game-content-wrapper">
                    <div className="game-board" ref={gameBoardRef} tabIndex={-1}>
                        <TimerBar
                            timeRemainingMs={timeRemainingMs}
                            totalTimeMs={gameConfig.timerSeconds * 1000}
                        />
                        <div className="racks-column">
                            <WordRacks
                                racks={wordRacks}
                                setRacks={setWordRacks}
                                maxTiles={maxTiles}
                                rackScores={rackScores}
                                disabled={gameState !== "playing"}
                            />
                        </div>
                    </div>
                    <div className="total-score-row">
                        <div className="timer-spacer" />
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
            )}
            {gameState === "finished" && (
                <div className="game-board-finished">
                    <h2>Good job! Here was our answer:</h2>
                    <div className="game-board">
                        <div className="timer-spacer" />
                        <div className="racks-column">
                            <WordRacks
                                racks={puzzle.targetSolution}
                                rackScores={targetScores}
                                disabled={true}
                                setRacks={setWordRacks}
                            />
                        </div>
                    </div>
                    <div className="total-score-row">
                        <div className="timer-spacer" />
                        <div className="rack-score-spacer">
                            <ScoreReport
                                rackScores={rackScores}
                                targetScores={targetScores}
                                targetSolution={puzzle.targetSolution}
                                date={puzzle.date}
                            />
                        </div>
                        <div className="score total-score">TOTAL: {targetScore}</div>
                    </div>
                </div>
            )}
            <InstructionsModal isOpen={isInstructionsOpen} onClose={closeInstructions} />
            <ArchivesModal
                isOpen={isArchivesOpen}
                onClose={closeArchives}
                onDateSelect={onDateSelect}
                earliestDate={gameConfig.earliestDate}
                currentDate={gameConfig.currentDate}
                history={history}
            />
        </div>
    )
}
