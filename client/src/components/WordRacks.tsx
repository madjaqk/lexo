import {
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    type UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
} from "@dnd-kit/sortable"
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from "react"
import type { Tile, WordRack, WordScore } from "@/types"
import { WordRackComponent } from "./WordRackComponent"
import "./WordRacks.css"
import { customAnnouncements } from "@/utils/dnd_kit/announcements"
import customCollisionDetection from "@/utils/dnd_kit/collision"
import { customKeyboardCoordinates } from "@/utils/dnd_kit/keyboardCoordinates"
import { customInstructions } from "@/utils/dnd_kit/screenReaderInstructions"

export interface WordRacksProps {
    racks: WordRack[]
    setRacks: Dispatch<SetStateAction<WordRack[]>>
    maxTiles?: number
    rackScores: WordScore[]
    disabled?: boolean
}

export default function WordRacks(props: WordRacksProps) {
    const { racks, setRacks, maxTiles = 8, rackScores, disabled = false } = props
    const [activeTileId, setActiveTileId] = useState<UniqueIdentifier | null>(null)
    const [previewRacks, setPreviewRacks] = useState(racks)

    // Keep the preview state in sync with the official state from props.
    // This is important for when the puzzle is reset or loaded from history.
    useEffect(() => {
        setPreviewRacks(racks)
    }, [racks])

    function handleDragStart(event: DragStartEvent) {
        setActiveTileId(event.active.id)
    }

    const findRackIndexForTile = useCallback(
        (tileId: UniqueIdentifier): number => {
            return previewRacks.findIndex((rack) => rack.some((tile) => tile.id === tileId))
        },
        [previewRacks],
    )

    // onDragOver is responsible for the real-time preview of moving tiles between racks.
    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event

        if (!over || active.id === over.id) {
            return
        }

        const fromRackIndex = findRackIndexForTile(active.id)

        // The `over.id` can be a tile or a rack container.
        let toRackIndex: number
        let overRackPlaceholder = false
        if (typeof over.id === "string" && over.id.startsWith("rack-")) {
            toRackIndex = Number.parseInt(over.id.split("-")[1], 10)
            overRackPlaceholder = true
        } else {
            toRackIndex = findRackIndexForTile(over.id)
        }

        // Only handle moves between different racks in onDragOver.
        // Intra-rack sorting is handled by SortableContext's preview and finalized in onDragEnd.
        // However, SortableContext's preview doesn't handle adding to the very end of the rack (represented by the rack placeholder space) correctly.
        if (
            fromRackIndex === -1 ||
            toRackIndex === -1 ||
            (fromRackIndex === toRackIndex && !overRackPlaceholder)
        ) {
            return
        }

        setPreviewRacks((prevRacks) => {
            if (prevRacks[toRackIndex].length >= maxTiles) {
                return prevRacks // Abort update if the destination rack is full.
            }
            const newRacks = prevRacks.map((r) => [...r])
            const fromRack = newRacks[fromRackIndex]
            const toRack = newRacks[toRackIndex]
            const activeIndex = fromRack.findIndex((t) => t.id === active.id)
            if (activeIndex === -1) {
                return prevRacks
            }

            let overIndex = toRack.findIndex((t) => t.id === over.id)
            if (overIndex === -1) {
                overIndex = toRack.length
            }

            const [movedItem] = fromRack.splice(activeIndex, 1)
            toRack.splice(overIndex, 0, movedItem)
            return newRacks
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        let finalRacks = previewRacks

        if (over && active.id !== over.id) {
            const fromRackIndex = findRackIndexForTile(active.id)
            const toRackIndex = findRackIndexForTile(over.id)

            // Finalize the state for intra-rack sorting.
            if (fromRackIndex !== -1 && fromRackIndex === toRackIndex) {
                const rackToReorder = finalRacks[fromRackIndex]
                const oldIndex = rackToReorder.findIndex((t) => t.id === active.id)
                const newIndex = rackToReorder.findIndex((t) => t.id === over.id)

                if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderedRacks = [...finalRacks]
                    reorderedRacks[fromRackIndex] = arrayMove(rackToReorder, oldIndex, newIndex)
                    finalRacks = reorderedRacks
                }
            }
        }

        // Commit the final state to the official racks state.
        setRacks(finalRacks)
        setActiveTileId(null)
    }

    function handleDragCancel() {
        setPreviewRacks(racks)
        setActiveTileId(null)
    }

    // Find the active tile object based on the activeTileId.
    // This is a simple calculation, so useMemo is not necessary, especially since
    // `racks` changes frequently during a drag operation.
    let activeTile: Tile | null = null
    if (activeTileId) {
        for (const rack of previewRacks) {
            const tile = rack.find((t) => t.id === activeTileId)
            if (tile) {
                activeTile = tile
                break
            }
        }
    }

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: customKeyboardCoordinates,
        }),
        useSensor(TouchSensor),
    )

    return (
        <DndContext
            collisionDetection={customCollisionDetection}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            accessibility={{
                announcements: customAnnouncements,
                screenReaderInstructions: customInstructions,
            }}
        >
            <div className="word-racks">
                {previewRacks.map((rack, idx) => (
                    <SortableContext
                        // biome-ignore lint/suspicious/noArrayIndexKey: The racks are in a fixed order and won't change or have a rack added or removed.  (It's possible that the correct answer is still to changes racks from Array<WordRack> to Array<{ tiles: WordRack, wordLength: number }>.  I'm undecided. -- JDB 2025-07-19)
                        key={idx}
                        items={rack.map((t) => t.id)}
                        strategy={horizontalListSortingStrategy}
                        disabled={disabled}
                    >
                        <WordRackComponent
                            tiles={rack}
                            rackIndex={idx}
                            maxTiles={maxTiles}
                            activeTileId={activeTileId}
                            rackScore={rackScores[idx]}
                        />
                    </SortableContext>
                ))}
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
