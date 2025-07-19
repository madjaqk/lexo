import { fetchWordList } from "@/services/gameService";

// Usage example:
let wordSet: Set<string> = new Set();

export async function loadWordList(): Promise<void> {
  if (wordSet.size > 0) { return }
  wordSet = await fetchWordList();
}

export function isValidWord(word: string): boolean {
  return wordSet.has(word.toUpperCase());
}
