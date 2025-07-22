import {
    type Collision,
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    type UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import { type Dispatch, type SetStateAction, useCallback, useState } from "react"
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

    /**
     * Custom collision detection strategy.
     * This strategy prioritizes collisions with sortable tiles over the general rack container.
     * If a dragged item intersects with any tiles, only those collisions are considered.
     * If there are no tile intersections, it then checks for intersections with the rack containers.
     * This prevents the "flickering" and "Maximum update depth" error that can occur when a
     * dragged item is on the boundary of a tile and the empty space of another rack.
     */
    function customCollisionDetection(args: Parameters<typeof rectIntersection>[0]): Collision[] {
        const collisions = rectIntersection(args)

        // If the dragged item is still intersecting its own droppable, return only that collision.
        const selfCollision = collisions.find((collision) => collision.id === args.active.id)
        if (selfCollision) {
            return [selfCollision]
        }

        // If no self-collision, check for intersections with tiles first.
        const tileCollisions = collisions.filter(
            (collision) => collision.data?.droppableContainer?.data?.current?.type === "tile",
        )
        if (tileCollisions.length > 0) {
            return tileCollisions
        }

        // If no tile collisions, check for pointer intersection with rack containers.
        const rackContainers = args.droppableContainers.filter(
            (container) => container.data.current?.type === "rack",
        )
        return pointerWithin({ ...args, droppableContainers: rackContainers })
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveTileId(event.active.id)
    }

    const findRackIndexForTile = useCallback(
        (tileId: UniqueIdentifier): number => {
            return racks.findIndex((rack) => rack.some((tile) => tile.id === tileId))
        },
        [racks],
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
        if (typeof over.id === "string" && over.id.startsWith("rack-")) {
            toRackIndex = Number.parseInt(over.id.split("-")[1], 10)
        } else {
            toRackIndex = findRackIndexForTile(over.id)
        }

        // If we can't find the racks or are dragging within the same rack, let dnd-kit handle it.
        if (fromRackIndex === -1 || toRackIndex === -1 || fromRackIndex === toRackIndex) {
            return
        }

        // Prevent moving to a full rack.
        if (racks[toRackIndex].length >= maxTiles) {
            return
        }

        setRacks((prevRacks) => {
            const newRacks = prevRacks.map((r) => [...r])
            const fromRack = newRacks[fromRackIndex]
            const toRack = newRacks[toRackIndex]
            const activeIndex = fromRack.findIndex((t) => t.id === active.id)

            // If dropping on a tile, find its index. If on a rack container, append to the end.
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

        if (over && active.id !== over.id) {
            const fromRackIndex = findRackIndexForTile(active.id)
            const toRackIndex = findRackIndexForTile(over.id)

            // This handles the final state update for reordering within the same rack.
            // The between-rack move is handled by onDragOver for a live preview.
            if (fromRackIndex !== -1 && fromRackIndex === toRackIndex) {
                setRacks((prevRacks) => {
                    const newRacks = [...prevRacks]
                    const rackToReorder = newRacks[fromRackIndex]
                    const oldIndex = rackToReorder.findIndex((t) => t.id === active.id)
                    const newIndex = rackToReorder.findIndex((t) => t.id === over.id)

                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                        newRacks[fromRackIndex] = arrayMove(rackToReorder, oldIndex, newIndex)
                    }
                    return newRacks
                })
            }
        }

        setActiveTileId(null)
    }

    // Find the active tile object based on the activeTileId.
    // This is a simple calculation, so useMemo is not necessary, especially since
    // `racks` changes frequently during a drag operation.
    let activeTile: Tile | null = null
    if (activeTileId) {
        for (const rack of racks) {
            const tile = rack.find((t) => t.id === activeTileId)
            if (tile) {
                activeTile = tile
                break
            }
        }
    }

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(KeyboardSensor),
        useSensor(TouchSensor),
    )

    return (
        <DndContext
            collisionDetection={customCollisionDetection}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="word-racks">
                {racks.map((rack, idx) => (
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
