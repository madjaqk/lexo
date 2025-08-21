import { type RefObject, useEffect } from "react"

type Event = MouseEvent | TouchEvent

/**
 * A hook that triggers a callback when a click or touch event occurs
 * outside of the referenced element.
 * @param ref A React ref attached to the element to monitor.
 * @param handler The callback function to execute on an outside click.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null>,
    handler: (event: Event) => void,
) {
    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref.current
            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node)) {
                return
            }
            handler(event)
        }

        document.addEventListener("mousedown", listener)
        document.addEventListener("touchstart", listener)

        return () => {
            document.removeEventListener("mousedown", listener)
            document.removeEventListener("touchstart", listener)
        }
    }, [ref, handler])
}
