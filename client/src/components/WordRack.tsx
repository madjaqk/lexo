import { type UniqueIdentifier, useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Tile, WordScore } from "@/types"
import RackScore from "./RackScore"
import "./WordRack.css"

interface TileSortableProps {
    tile: Tile
    rackIndex: number
    isPlaceholder: boolean
}

function TileSortable({ tile, rackIndex, isPlaceholder }: TileSortableProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: tile.id,
        data: {
            type: "tile",
            rackIndex,
        },
    })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 2 : 1,
    }
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`tile ${isPlaceholder ? "placeholder-tile" : ""}`}
        >
            {!isPlaceholder && (
                <>
                    <span className="tile-letter">{tile.letter}</span>
                    <span className="tile-value">{tile.value}</span>
                </>
            )}
        </div>
    )
}

export interface WordRackProps {
    tiles: Tile[]
    rackIndex: number
    maxTiles?: number
    rackScore: WordScore
    activeTileId?: UniqueIdentifier | null
}

export function WordRack({
    tiles,
    rackIndex,
    maxTiles = 8,
    rackScore,
    activeTileId = null,
}: WordRackProps) {
    const { setNodeRef: setRackNodeRef } = useDroppable({
        id: `rack-${rackIndex}`,
        data: {
            type: "rack",
            rackIndex,
        },
    })

    return (
        <div className="word-rack-row">
            <div
                ref={setRackNodeRef}
                className={`word-rack ${rackScore.baseScore > 0 ? "valid" : "invalid"}`}
            >
                {tiles.map((tile) => (
                    <TileSortable
                        key={tile.id}
                        tile={tile}
                        rackIndex={rackIndex}
                        isPlaceholder={tile.id === activeTileId}
                    />
                ))}
                <div
                    className="drop-placeholder-visual"
                    style={{ display: tiles.length < maxTiles ? "block" : "none" }}
                />
                {tiles.length >= maxTiles && <div className="rack-full">Rack Full</div>}
            </div>
            <RackScore rackScore={rackScore} />
        </div>
    )
}
