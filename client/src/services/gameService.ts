import type { DailyPuzzle, GameRules, PuzzleState } from "@/types"

const BASE_URL = "/api"

// Simulated API fetch for word list
export async function fetchWordList(): Promise<Set<string>> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  // Hardcoded sample word list (replace with API call later)
  const words = [
    "BEE",
    "SICK",
    "JERRY",
    "MOBILE",
    "CAT",
    "DOG",
    "HOUSE",
    "APPLE",
    "TABLE",
    "CHAIR",
    "PHONE",
    "MOUSE",
    "KEY",
    "BOARD",
    "SCREEN",
    "LAMP",
    "DESK",
    "BOOK",
    "CAB",
    "FACE",
    "DEAF",
    "MOE",
    "BILE",
    "BRICK",
    "JERSEY",
  ];
  return new Set(words.map(w => w.toUpperCase()));
}


export async function fetchGameRules(): Promise<GameRules> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  const rules = {
    "multipliers": {
      "3": 6,
      "4": 5,
      "5": 4,
      "6": 3
    },
    "timerSeconds": 300
  };
  return rules;
}

export async function fetchDailyPuzzle(date?: string): Promise<DailyPuzzle> {
    await new Promise(resolve => setTimeout(resolve, 100))
    const dailyPuzzle = {
        initialRacks: [
            [{ id: "2", letter: "E", value: 1 }, { id: "3", letter: "E", value: 1 }, { id: "1", letter: "B", value: 3 }],
            [{ id: "8", letter: "J", value: 8 }, { id: "5", letter: "I", value: 1 }, { id: "6", letter: "C", value: 3 }, { id: "7", letter: "K", value: 5 }],
            [{ id: "9", letter: "E", value: 1 }, { id: "10", letter: "R", value: 1 }, { id: "11", letter: "R", value: 1 }, { id: "12", letter: "Y", value: 4 }, { id: "4", letter: "S", value: 1 }, ],
            [{ id: "14", letter: "O", value: 1 }, { id: "13", letter: "M", value: 3 }, { id: "15", letter: "B", value: 3 }, { id: "16", letter: "I", value: 1 }, { id: "17", letter: "L", value: 1 }, { id: "18", letter: "E", value: 1 }]
        ],
        targetSolution: [
            [{ id: "1", letter: "B", value: 3 }, { id: "2", letter: "E", value: 1 }, { id: "3", letter: "E", value: 1 }],
            [{ id: "4", letter: "S", value: 1 }, { id: "5", letter: "I", value: 1 }, { id: "6", letter: "C", value: 3 }, { id: "7", letter: "K", value: 5 }],
            [{ id: "8", letter: "J", value: 8 }, { id: "9", letter: "E", value: 1 }, { id: "10", letter: "R", value: 1 }, { id: "11", letter: "R", value: 1 }, { id: "12", letter: "Y", value: 4 }],
            [{ id: "13", letter: "M", value: 3 }, { id: "14", letter: "O", value: 1 }, { id: "15", letter: "B", value: 3 }, { id: "16", letter: "I", value: 1 }, { id: "17", letter: "L", value: 1 }, { id: "18", letter: "E", value: 1 }]
        ],
        date: "2025-07-24"
    }
    return dailyPuzzle
}

// This is what the actual API calls will look like, but for now we're just using dummy functions
/*
export async function fetchGameRules(): Promise<GameRules> {
    const response = await fetch(`${BASE_URL}/config`);
    if (!response.ok) {
        throw new Error(`Failed to fetch game rules: ${response.status}`);
    }
    return response.json()
}

export async function fetchDailyPuzzle(date: string): Promise<PuzzleState> {
    const response = await fetch(`${BASE_URL}/puzzle/${date}`)

    if (!response.ok) {
        throw new Error(`Failed to fetch daily puzzle: ${response.status}`)
    }
    return response.json()
}
*/

// Add other API calls here (e.g., submitting a puzzle)

// Example usage
// fetchGameRules().then(rules => console.log(rules))
// fetchDailyPuzzle("2024-07-24").then(puzzle => console.log(puzzle))
