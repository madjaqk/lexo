import { fetchGameRules } from "@/services/gameService"
import type { GameRules } from "@/types"

let gameRules: GameRules | null = null

export async function loadGameRules(): Promise<void> {
    if (!gameRules) {
        gameRules = await fetchGameRules()
    }
}
