import type { Announcements } from "@dnd-kit/core";

export const customAnnouncements: Announcements = {
    onDragStart({ active }) {
        return `Picked up tile ${active.data.current?.letter}`;
    },
    onDragOver({ active, over }) {
        if (over) {
            const overType = over.data.current?.type;
            if (overType === "tile") {
                return `Tile ${active.data.current?.letter} was moved over tile ${over.data.current?.letter}.`;
            }
            // If over a rack, it's an empty space
            if (overType === "rack") {
                return `Tile ${active.data.current?.letter} was moved over an empty space in another rack.`;
            }
        }
        return `Tile ${active.data.current?.letter} is no longer over a droppable area.`;
    },
    onDragEnd({ active }) {
        return `Tile ${active.data.current?.letter} was dropped.`;
    },
    onDragCancel({ active }) {
        return `Dragging was cancelled. Tile ${active.data.current?.letter} was returned to its original position.`;
    },
};
