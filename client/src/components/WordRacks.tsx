import React, { type Dispatch, useEffect, useState, useCallback, type SetStateAction } from "react"
import { DndContext, DragOverlay, type DragOverEvent, type DragEndEvent, rectIntersection, type DragStartEvent, type UniqueIdentifier } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { WordRack } from "./WordRack"
import type { Tile, WordScore } from "@/types"
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

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over) {
            return
        }

        let fromRack = -1  // dnd-kit code calls this activeContainer
        let toRack = -1  // dnd-kit code calls this overContainer
        let oldIndex = -1  // dnd-kit code calls this activeIndex
        let newIndex = -1  // dnd-kit code calls this overIndex

        racks.forEach((rack, rackIdx) => {
            const idx = rack.findIndex(t => t.id === active.id)
            if (idx !== -1) {
                fromRack = rackIdx
                oldIndex = idx
            }
            const overIdx = rack.findIndex(t => t.id === over.id)
            if (overIdx !== -1) {
                toRack = rackIdx
                newIndex = overIdx
            }
        })

        if (toRack === -1 && over && typeof over.id === "string" && over.id.startsWith("rack-")) {
            toRack = Number.parseInt(over.id.split("-")[1], 10)
            newIndex = racks[toRack].length
            // console.log("toRack is a rack placeholder", toRack, newIndex)
        }

        if (fromRack === -1 || toRack === -1) {
            return
        }

        if (fromRack !== toRack && racks[toRack].length >= maxTiles) {
            return
        }


          setRacks(prevRacks => {
            const activeRackTiles = prevRacks[fromRack]

            const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height

            const modifier = isBelowOverItem ? 1 : 0
            newIndex += modifier

            return prevRacks.map((rack, idx) => {
              if (idx === fromRack && idx === toRack) {
                // Moving within the same rack
                const filtered = rack.filter(t => t.id !== active.id)
                const before = filtered.slice(0, newIndex)
                const after = filtered.slice(newIndex)
                return [...before, activeRackTiles[oldIndex], ...after]
              }
              if (idx === fromRack) {
                // Removing from the original rack
                return rack.filter(t => t.id !== active.id)
              }
              if (idx === toRack) {
                // Adding to the target rack
                const before = rack.slice(0, newIndex)
                const after = rack.slice(newIndex)
                return [...before, activeRackTiles[oldIndex], ...after]
              }
              return rack
            }
          )})

    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveTileId(null)
        // I _think_ all of the logic for updating the racks is handled in handleDragOver, so this function doesn't need to do anything except clear activeTileId.

        // const { active, over } = event
        // if (!over || active.id === over.id) {
        //     return
        // }

        // let fromRack = -1
        // let toRack = -1
        // let oldIndex = -1
        // let newIndex = -1

        // racks.forEach((rack, rackIdx) => {
        //     const idx = rack.findIndex(t => t.id === active.id)
        //     if (idx !== -1) {
        //         fromRack = rackIdx
        //         oldIndex = idx
        //     }
        //     const overIdx = rack.findIndex(t => t.id === over.id)
        //     if (overIdx !== -1) {
        //         toRack = rackIdx
        //         newIndex = overIdx
        //     }
        // })

        // if (toRack === -1 && over && typeof over.id === "string" && over.id.startsWith("rack-")) {
        //     toRack = Number.parseInt(over.id.split("-")[1], 10)
        //     newIndex = racks[toRack].length
        // }

        // if (fromRack === -1 || toRack === -1) {
        //     return
        // }

        // const tile = racks[fromRack][oldIndex]
        // const newRacks = racks.map((rack, idx) => {
        //     if (idx === fromRack && idx === toRack) {
        //         const filtered = rack.filter(t => t.id !== active.id)
        //         const before = filtered.slice(0, newIndex)
        //         const after = filtered.slice(newIndex)
        //         return [...before, tile, ...after]
        //     }
        //     if (idx === fromRack) {
        //         return rack.filter(t => t.id !== active.id)
        //     }
        //     if (idx === toRack) {
        //         const before = rack.slice(0, newIndex)
        //         const after = rack.slice(newIndex)
        //         return [...before, tile, ...after]
        //     }
        //     return rack
        // })

        // setRacks(newRacks)
    }

    let activeTile = null
    if (activeTileId) {
        for (let rack of racks) {
            const found = rack.find(t => t.id === activeTileId)
            if (found) {
                activeTile = found
                break
            }
        }
    }

    return (
        <DndContext
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="word-racks">
                {racks.map((rack, idx) => {
                    return (
                        <SortableContext
                            key={idx}
                            items={rack.map(t => t.id)}
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
                {activeTile
                    ? <div className="tile drag-preview">
                        <span className="tile-letter">{activeTile.letter}</span>
                        <span className="tile-value">{activeTile.value}</span>
                    </div>
                    : null
                }
            </DragOverlay>
        </DndContext>
    )
}
