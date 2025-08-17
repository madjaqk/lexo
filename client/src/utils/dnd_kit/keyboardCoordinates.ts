import type { ClientRect, KeyboardCoordinateGetter } from "@dnd-kit/core"

function rectToXY(rect: ClientRect) {
    // dnd-kit is supposed to accept ClientRects from the custom keyboard coordinates getter, but I could only make it work by returning X and Y coordinates
    return { x: rect.left, y: rect.top }
}

/**
 * A custom keyboard coordinate getter for dnd-kit that provides more intuitive
 * grid-like navigation for the word racks.
 *
 * - ArrowLeft/ArrowRight: Moves the active tile within its current rack.
 * - ArrowUp/ArrowDown: Moves the active tile to the rack above or below.
 *
 * This implementation correctly handles moving to the end of a rack and prevents
 * tiles from "leaking" into other racks on horizontal movement.
 */

type KeyboardCoordinatesParameters = Parameters<KeyboardCoordinateGetter>

export function customKeyboardCoordinates(
    event: KeyboardEvent,
    { active: activeId, context }: KeyboardCoordinatesParameters[1],
){
    if (!activeId || !context.active || !context.collisionRect || !context.droppableRects) {
        return
    }

    const activeData = context.active.data.current
    if (activeData?.type !== "tile") {
        return
    }

    const { rackIndex: currentRackIndex } = activeData
    const droppableContainers = context.droppableContainers.getEnabled()
    const { collisionRect, droppableRects } = context

    // Get all tiles in the current rack and sort them by their index in the rack
    const currentRackTiles = droppableContainers
        .filter(
            (container) => container.data.current?.type === "tile" && container.data.current?.rackIndex === currentRackIndex,
        )
        .sort((tile1, tile2) => {
            const [rect1, rect2] = [droppableRects.get(tile1.id), droppableRects.get(tile2.id)]
            if (!rect1 || !rect2) {
                return 0
            }
            return rect1.left - rect2.left
        })

    switch (event.code) {
        case "ArrowRight": {
                let target = null
                // Walk list of current rack tiles, returning the first one to the right of the active tile (as defined by collisionRect)
                for (let i = 0; i < currentRackTiles.length; i++) {
                    const tile = currentRackTiles[i]
                    const rect = droppableRects.get(tile.id)
                    if (!rect) {
                        continue
                    }

                    if (rect.left > collisionRect.left) {
                        target = rect
                        break
                    }
                }

                 if (target) {
                    return rectToXY(target)
                 }

                 return

            }
        case "ArrowLeft": {
                let target = null
                // Walk list of current rack tiles right to left, returning the first one to the left of the active tile (as defined by collisionRect)
                for (let i = currentRackTiles.length - 1; i >= 0; i--) {
                    const tile = currentRackTiles[i]
                    const rect = droppableRects.get(tile.id)
                    if (!rect) { continue }

                    if (rect.left < collisionRect.left) {
                        target = rect
                        break
                    }
                }

                if (target) {
                    return rectToXY(target)
                }

                return
            }

        case "ArrowUp":
        case "ArrowDown": {
            const nextRackIndex =
                event.code === "ArrowDown" ? currentRackIndex + 1 : currentRackIndex - 1

            // Find any tile in that rack, or the end-of-rack placeholder drop target
            const target = droppableContainers.find(container => container.data.current?.rackIndex === nextRackIndex)

            if (target) {
                return { x: collisionRect.left, y: droppableRects.get(target.id)?.top || collisionRect.top}
            }
        }
    }
}
