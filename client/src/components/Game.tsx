import React, { useState, useEffect, useCallback, useRef } from "react"
import WordRacks from "./WordRacks"
import type { GameRules, Tile, WordScore, GameState, DailyPuzzle } from "@/types"
import { isValidWord } from "@/utils/wordValidation"
import { sum } from "@/utils/math"
import "./Game.css"
import ScoreReport from "./ScoreReport"
import TimerBar from "./TimerBar"
import { saveHistoryForDate } from "@/services/playHistory"


export interface GameProps {
    puzzle: DailyPuzzle
    gameRules: GameRules
    maxTiles?: number
}

export default function Game(props: GameProps) {
    const { puzzle, gameRules, maxTiles = 8 } = props

    const [gameState, setGameState] = useState<GameState>("pre-game")
    const [wordRacks, setWordRacks] = useState(puzzle.initialRacks)
    const [rackScores, setRackScores] = useState<WordScore[]>([])
    const [targetScores, setTargetScores] = useState<WordScore[]>([])
    const [endTime, setEndTime] = useState<Date | null>(null)
    const [timeRemainingMs, setTimeRemainingMs] = useState(gameRules.timerSeconds * 1000)

    const animationFrameId = useRef<number | null>(null)

    const scoreRack = useCallback((rack: Tile[], requiredLength: number): WordScore => {
        const word = rack.map((t) => t.letter).join("")
            let baseScore = 0
            const multiplier = gameRules.multipliers[requiredLength] || 1
            if (isValidWord(word) && word.length === requiredLength) {
                baseScore = sum(rack.map((t) => t.value))
            }
            return { baseScore, multiplier }
    }, [gameRules])


    useEffect(() => {
        setTargetScores(puzzle.targetSolution.map((rack, idx) => scoreRack(rack, idx + 3)))
    }, [puzzle.targetSolution, scoreRack])

    const clearAnimationFrameId = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current)
            animationFrameId.current = null
        }
    }, [])

    const startGame = useCallback(() => {
        setGameState("playing")
        setEndTime(new Date(Date.now() + gameRules.timerSeconds * 1000))
    }, [gameRules.timerSeconds])


    const totalScore = sum(rackScores.map((s) => s.baseScore * s.multiplier))
    const targetScore = sum(targetScores.map((s) => s.baseScore * s.multiplier))

    const endGame = useCallback(() => {
        setGameState("finished")
        setEndTime(null)
        clearAnimationFrameId()
        saveHistoryForDate(puzzle.date, {racks: wordRacks, score: totalScore, targetScore: targetScore})
    }, [clearAnimationFrameId, puzzle.date, wordRacks, totalScore, targetScore])




    // This block recalculates rack scores when the racks change
    useEffect(() => {

        // TODO: Should word validity/scoring be checked during drag events or only after the tile has been placed?  The block below checks during drag events; I'm not sure how to have this only trigger after the tile is placed given the state the Game component can access.
        const newRackScores = wordRacks.map((rack, idx) => scoreRack(rack, idx + 3))

        setRackScores(newRackScores)
    }, [wordRacks, scoreRack])


    useEffect(() => {
        if (gameState === "playing" && endTime) {
            function animate() {
                if (!endTime) {
                    return
                }
                const remaining = endTime.getTime() - Date.now()
                setTimeRemainingMs(Math.max(remaining, 0)) // Ensure timeRemainingMs doesn't go negative
                animationFrameId.current = requestAnimationFrame(animate)
                if (remaining <= 0) {
                    endGame()
                }
            }
            animationFrameId.current = requestAnimationFrame(animate)
        } else {
            clearAnimationFrameId()
        }
        return () => clearAnimationFrameId()
    }, [gameState, endTime, endGame, clearAnimationFrameId])


    return (
        <div className="game">
            <p>DATE: {puzzle.date}</p>
            {gameState === "pre-game" && <button type="button" onClick={startGame}>Start Game!</button>
            }
            {gameState !== "pre-game" &&
                <div className="game-board">
                    <TimerBar timeRemainingMs={timeRemainingMs} totalTimeMs={gameRules.timerSeconds * 1000} />
                    <div className="racks-column">
                        <WordRacks
                            racks={wordRacks}
                            setRacks={setWordRacks}
                            maxTiles={maxTiles}
                            rackScores={rackScores}
                            disabled={gameState !== "playing"}
                        />
                        <div className="total-score-row">
                            <div className="rack-score-spacer">{gameState === "playing" && rackScores.every((s) => s.baseScore > 0) && <button type="button" onClick={endGame}>Submit Answer</button>}</div>
                            <div className="score total-score">
                                TOTAL: {totalScore}
                            </div>
                        </div>
                    </div>
                </div>
            }
            {gameState === "finished" && (
                <div className="game-finished racks-column">
                    <h2>Good job!  Here was our answer:</h2>
                    <WordRacks
                        racks={puzzle.targetSolution}
                        rackScores={targetScores}
                        disabled={true}
                        setRacks={setWordRacks}
                    />
                    <div className="total-score-row">
                        <div className="rack-score-spacer"> <ScoreReport rackScores={rackScores} targetScores={targetScores} date={puzzle.date} /> </div>
                        <div className="score total-score">
                            TOTAL: {targetScore}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
