import {type Collision, pointerWithin, rectIntersection } from "@dnd-kit/core"

/**
 * Custom collision detection strategy.
 * This strategy prioritizes collisions with sortable tiles over the general rack container.
 * If a dragged item intersects with any tiles, only those collisions are considered.
 * If there are no tile intersections, it then checks for intersections with the rack containers.
 * This prevents the "flickering" and "Maximum update depth" error that can occur when a
 * dragged item is on the boundary of a tile and the empty space of another rack.
 */
export default function customCollisionDetection(args: Parameters<typeof rectIntersection>[0]): Collision[] {
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
