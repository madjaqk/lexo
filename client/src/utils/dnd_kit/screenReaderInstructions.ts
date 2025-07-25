import type { ScreenReaderInstructions } from "@dnd-kit/core"

export const customInstructions: ScreenReaderInstructions = {
    draggable: `
        To pick up a tile, press space or enter.
        Use the arrow keys to move the tile within a rack or between racks.
        Press space or enter again to drop the tile in its new position, or press escape to cancel.
    `
}
