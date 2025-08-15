# Daily Word Game Development Project

## Project Overview
Create a daily word puzzle game where players arrange 18 letter tiles into four words (3, 4, 5, and 6 letters) within a time limit. The game features daily puzzles, scoring, and shareable results similar to Wordle.

## Core Game Mechanics

### Puzzle Structure
- Players receive exactly 18 letter tiles with point values (Scrabble-style scoring)
- Must arrange tiles into exactly four words: one 3-letter, one 4-letter, one 5-letter, and one 6-letter word
- 5-minute time limit (configurable)
- All puzzles are guaranteed to be solvable

### Scoring System
- Each letter tile has a point value
- Word scores are calculated as: (sum of letter values) × (length multiplier)
- **IMPORTANT**: Implement configurable multipliers AND letter point values in a separate config file for easy experimentation
- Default option 1: 3-letter = 3×, 4-letter = 4×, 5-letter = 5×, 6-letter = 6×
- Default option 2: 3-letter = 6×, 4-letter = 5×, 5-letter = 4×, 6-letter = 3× (reversed)
- Letter point values should be easily configurable (e.g., A=1, B=3, C=3, etc.)
- Total score is sum of all four word scores

### Puzzle Generation
- Server selects 4 valid words from a curated "common words" list
- A script generates puzzles ahead of time and stores them in a persistent database
- It extracts exactly 18 tiles from these words to ensure winnability
- Server's solution becomes the "target score" that players try to beat

### Word Validation
- Use a comprehensive word list (assume provided) for validation - should include plurals, verb forms, no proper nouns
- Separate smaller "common words" list for puzzle generation
- Words only count if placed in the correct length position

## Technical Requirements

### Frontend (React/Next.js)
- Drag-and-drop tile interface
- Four word "racks" with visual length indicators
- Real-time word validation and scoring display (client-side)
- Timer display
- Responsive design for mobile/desktop

### Backend
- Python (FastAPI) with an SQLite database
- RESTful API for serving puzzle data and game configuration
- Puzzles generated and stored in a persistent database
- Play limiting remains client-side via localStorage

### User Experience
- Visual feedback for valid/invalid words
- Tiles can be moved between racks during play
- Score calculation updates in real-time
- Prevent multiple plays per day per user

## Daily Puzzle Features

### Play Limiting
- Remains client-side via `localStorage`
- Prevents multiple plays of the same day's puzzle
- Allows access to previous days' puzzles (via API calls for past dates)

### Shareable Results
Generate spoiler-free summary in this format:
```
[Game Name] - [Date]
??? 4 x3 = 12
???? 6 x4 = 24
????? 14 x5 = 70
?????? 16 x6 = 96
TOTAL: 202 (14 over target!)
[Game URL]
```
- Show only scores, not actual words
- Compare to server's target score (avoid "par" terminology)
- Use question marks to represent letter count

## Development Roadmap

### Phase 1: Core Game Engine (Week 1-2)
**Deliverables:**
- Basic tile arrangement UI with drag-and-drop
- Word validation system
- Real-time scoring calculation
- Timer functionality
- Static puzzle testing interface

**Key Features:**
- React components for tiles and word racks
- Configurable scoring multipliers
- Word list integration
- Basic responsive layout

#### Detailed Steps

1. [X] Set up React project, Biome, and TypeScript configs
2. [X] Set up tile and word rack components
3. [X] Implement puzzle state and data structures
4. [X] Integrate word list for validation
5. [X] Add real-time scoring calculation
6. [X] Build static puzzle testing interface (full start-to-finish puzzle cycle)
7. [X] Implement timer functionality
8. [X] Use `localStorage` to track completed puzzles
9. [X] Implement basic responsive layout (plus better styling)
10. [X] Accessibility updates
11. [X] Update `ShareButton` to use Web Share API (plus general zhuzh)
12. [X] **Testing Suite Setup & Implementation**
    - [X] **Setup**: Install Vitest, JSDOM, React Testing Library, and related dependencies.
    - [X] **Configuration**: Configure Vite (`vite.config.ts`) for the test environment (e.g., globals, set-up files).
    - [X] **Unit Test: Scoring Logic**: Test `utils/scoring.ts` to ensure `calculateRackScore` works correctly with various inputs.
    - [X] **Unit Test: Shareable Text**: Test `utils/shareableText.ts` to ensure summary and report text is generated correctly.
    - [X] **Hook Test: Local Storage**: Test `hooks/usePlayHistory.ts` by mocking `localStorage` to verify history is saved and retrieved correctly.
    - [X] **Hook Test: `useTimer`**: Test the timer hook with fake timers to ensure it counts down and calls back correctly.
    - [X] **Hook Test: `useGameScoring`**: Test the scoring hook to verify it computes player and target scores accurately using the scoring utils.
    - [X] **Component Test: `TimerBar`**: Test that the component renders the correct time and progress bar value.
    - [X] **Component Test: `ScoreReport`**: Test that the final report displays the correct score comparison.
    - [X] **Integration Test: `Game` Component**: Test the user flow from the perspective of the main `Game` component. This approach treats child components like `WordRacks` as implementation details, leading to more robust tests that don't break on refactoring.
        - [X] **Happy Path**: Test the full game flow: start game, see the board, and submit a valid answer.
        - [X] **State Transitions**: Verify the correct UI elements are shown/hidden based on `gameState` ("pre-game", "playing", "finished").
        - [X] **Edge Cases**: Test behavior when the timer runs out, or when a user submits an incomplete board.

### Phase 2: Daily Puzzle Infrastructure (Week 3)
**Deliverables:**
- A production-ready API serving daily puzzles from a persistent store.
- A client application fully integrated with the live API.
- A script for generating and storing future puzzles.

#### Detailed Steps
1. [X] **Backend Project Setup (Python)**
    -   Create a `server` directory within your workspace.
    -   Install your chosen framework (e.g., `fastapi`, `uvicorn`, `sqlmodel`).
2. [X] **Database and Model Definition**
    -   Define the database schema for a `Puzzle`. This would include fields for the `date`, the `initialRacks` (as JSON), and the `targetSolution` (as JSON).
    -   Set up your ORM (e.g., SQLModel) to interact with an SQLite database file.
3. [X] **Create a Puzzle Generation Script**
    -   Develop a standalone Python script (`generate_puzzles.py`).
    -   This script will contain the core logic for creating a valid puzzle from your word lists.
    -   It should be runnable from the command line (e.g., `python generate_puzzles.py --days 30`) to generate and save a batch of future puzzles to the database.
    -   Include unit tests
4. [X] **Write API Endpoint Tests (TDD)**
    -   Use a test client (e.g., FastAPI's `TestClient`) to write tests for the API endpoints before implementing their logic.
    -   Test success cases (e.g., `200 OK` for a valid puzzle date).
    -   Test failure cases (e.g., `404 Not Found` for a non-existent puzzle, `422 Unprocessable Entity` for an invalid date format).
    -   Mock database/file system interactions to isolate the API layer.
5.  [X] **Implement API Endpoints**
    -   **`GET /api/puzzle/:date`**: Fetches a specific puzzle by its date from the database.
    -   **`GET /api/config`**: Reads the `gameRules.yaml` file and serves its content as JSON. This keeps your game rules easily configurable without a code change.
6. [X] **Client Integration**
    -   Update the `Game` component to fetch its data from your new, live API endpoints instead of using the local mock data.
    -   Ensure loading and error states are handled gracefully (e.g., what happens if the API call fails?).

### Phase 3: Polish and Final Features
**Deliverables:**
- Enhanced UI/UX with a polished, professional feel.
- Final branding and essential user-facing features.

**Key Features:**
- Updated color scheme, including dark mode
- Error handling
- Instructions screen
- Play history display

#### Detailed Steps

1. [X] Create an "Instructions" screen or modal.
2. [X] Implement a view to display the history of past games.
3. [ ] Add `.env` file for client configuration
4. [ ] Enhance keyboard and mobile touch interactions.
5. [ ] Implement comprehensive error handling and loading states for API calls.
6. [ ] Credits/copyright information (footer?)
7. [ ] MAYBE: Front-end refactor (break header into its own component, divide `client/src/components/` into subfolders)
8. [ ] Download the primary font and serve it locally.
9. [ ] Finalize the game name and create a logo.
10. [ ] Finalize the color scheme and implement a dark mode toggle.
11. [ ] Add a favicon based on the new logo.
12. [ ] Update `package.json` and `pyproject.toml` with the final project name, version, and author details.
13. [ ] Write the project `README.md`.

### Phase 4: Deployment & Operations
**Deliverables:**
- A fully containerized application ready for production deployment.
- Automated operational tasks for puzzle generation.

**Key Features:**
- **Containerization (Deployment Prep)**:
    - Create the `Dockerfile` for the FastAPI server.
    - Create the `Dockerfile` for the Nginx frontend server.
    - Write the `docker-compose.yaml` to orchestrate the containers.
- **Performance Optimization**:
    - Implement server-side caching (e.g., Redis) for API endpoints.
- **Automation & Operations**:
    - Set up a recurring job (e.g., a cron job in the Docker container) to automatically generate future puzzles.
    - (Optional) Configure a CI/CD pipeline (e.g., GitHub Actions) to automate testing and deployment.

## Technical Specifications

### API Endpoints
- `GET /api/puzzle/:date` - Get puzzle for specific date
- `GET /api/config` - Get current scoring configuration
- `GET /api/wordlist` - Get list of legal words

### Data Structures
```javascript
// Puzzle format
{
  date: "2025-01-15",
  tiles: [
    { letter: "A", value: 1, id: "tile-1" },
    // ... 18 tiles total
  ],
  targetScore: 156,
  targetWords: ["BEE", "SICK", "JERRY", "MOBILE"] // for internal use
}

// Scoring config
{
  multipliers: {
    3: 6,
    4: 5,
    5: 4,
    6: 3
  },
  letterValues: {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  },
  timeLimit: 300 // seconds
}
```

### File Structure
```
/config
  - scoring.json (multipliers, letter values, and game settings)
  - words-common.txt (puzzle generation)
  - words-full.txt (validation)
/src
  /components (React components)
  /api (backend endpoints)
  /utils (game logic, validation)
```

## Assumptions and Notes
- Word lists will be provided as plain text files
- Focus on functionality over visual design for MVP
- Use modern web standards (ES6+, CSS Grid/Flexbox)
- Prioritize mobile-friendly interface
- No user authentication required for Phase 1-2

## Success Criteria
- Players can complete daily puzzles consistently
- Puzzle generation creates solvable challenges
- Results are shareable and spoiler-free
- Game works reliably across devices
- Easy configuration changes for scoring experimentation

Generate a complete, production-ready implementation with clear documentation and deployment instructions.
