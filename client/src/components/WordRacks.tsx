import {
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    rectIntersection,
    type UniqueIdentifier,
    useSensor,
    useSensors,
    PointerSensor,
    MouseSensor,
    KeyboardSensor,
    TouchSensor
} from "@dnd-kit/core"
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
} from "@dnd-kit/sortable"
import { type Dispatch, type SetStateAction, useState } from "react"
import type { Tile, WordScore } from "@/types"
import { WordRack } from "./WordRack"
import "./WordRacks.css"

export interface WordRacksProps {
    racks: Tile[][]
    setRacks: Dispatch<SetStateAction<Tile[][]>>
    maxTiles?: number
    rackScores: WordScore[]
    disabled?: boolean
}

export default function WordRacks(props: WordRacksProps) {
    const { racks, setRacks, maxTiles = 8, rackScores, disabled = false } = props
    const [activeTileId, setActiveTileId] = useState<UniqueIdentifier | null>(null)

    function handleDragStart(event: DragStartEvent) {
        setActiveTileId(event.active.id)
    }

    function findRackIndexForTile(tileId: UniqueIdentifier, currentRacks: Tile[][]): number {
        return currentRacks.findIndex((rack) => rack.some((tile) => tile.id === tileId))
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) { return }

        const fromRackIndex = findRackIndexForTile(active.id, racks)
        let toRackIndex = findRackIndexForTile(over.id, racks)

        // Handle dropping on an empty rack's droppable area
        if (toRackIndex === -1 && typeof over.id === "string" && over.id.startsWith("rack-")) {
            toRackIndex = Number.parseInt(over.id.split("-")[1], 10)
        }

        // If dragging within the same rack, do nothing. SortableContext handles the visual preview.
        if (fromRackIndex === -1 || toRackIndex === -1 || fromRackIndex === toRackIndex) { return }

        // Handle moving a tile to a different rack
        if (racks[toRackIndex].length >= maxTiles) { return }

        setRacks((prevRacks) => {
            const newRacks = prevRacks.map((r) => [...r]) // Deep copy
            const activeRack = newRacks[fromRackIndex]
            const overRack = newRacks[toRackIndex]
            const activeIndex = activeRack.findIndex((t) => t.id === active.id)
            let overIndex = overRack.findIndex((t) => t.id === over.id)

            if (activeIndex === -1) { return prevRacks // Should not happen
}

            // If dropping on the droppable area, add to the end
            if (overIndex === -1) {
                overIndex = overRack.length
            }

            const [movedItem] = newRacks[fromRackIndex].splice(activeIndex, 1)
            newRacks[toRackIndex].splice(overIndex, 0, movedItem)

            return newRacks
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const fromRackIndex = findRackIndexForTile(active.id, racks)
            const toRackIndex = findRackIndexForTile(over.id, racks)

            // This handles the final state update for reordering within the same rack
            if (fromRackIndex !== -1 && fromRackIndex === toRackIndex) {
                setRacks((prevRacks) => {
                    const newRacks = [...prevRacks]
                    const rackToReorder = newRacks[fromRackIndex]
                    const oldIndex = rackToReorder.findIndex((t) => t.id === active.id)
                    const newIndex = rackToReorder.findIndex((t) => t.id === over.id)

                    if (oldIndex !== -1 && newIndex !== -1) {
                        newRacks[fromRackIndex] = arrayMove(rackToReorder, oldIndex, newIndex)
                    }
                    return newRacks
                })
            }
        }

        setActiveTileId(null)
    }

    let activeTile = null

    if (activeTileId) {
        for (const rack of racks) {
            const found = rack.find((t) => t.id === activeTileId)
            if (found) {
                activeTile = found
                break
            }
        }
    }

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(KeyboardSensor),
        useSensor(TouchSensor)
    )

    return (
        <DndContext
            collisionDetection={rectIntersection}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="word-racks">
                {racks.map((rack, idx) => {
                    return (
                        <SortableContext
                            // biome-ignore lint/suspicious/noArrayIndexKey: The racks are in a fixed order and won't change or have a rack added or removed.  (It's possible that the correct answer is still to changes racks from Array<Array<Tile>> to Array<{ tiles: Tile[], wordLength: number }>.  I'm undecided. -- JDB 2025-07-19)
                            key={idx}
                            items={rack.map((t) => t.id)}
                            strategy={horizontalListSortingStrategy}
                            disabled={disabled}
                        >
                            <WordRack
                                tiles={rack}
                                rackIndex={idx}
                                maxTiles={maxTiles}
                                activeTileId={activeTileId}
                                rackScore={rackScores[idx]}
                            />
                        </SortableContext>
                    )
                })}
            </div>
            <DragOverlay>
                {activeTile ? (
                    <div className="tile drag-preview">
                        <span className="tile-letter">{activeTile.letter}</span>
                        <span className="tile-value">{activeTile.value}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
