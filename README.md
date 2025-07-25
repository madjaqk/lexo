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
- Extracts exactly 18 tiles from these words to ensure winnability
- Uses date-based seeding (UTC/server time) for consistent daily puzzles
- Server's solution becomes the "target score" that players try to beat

### Word Validation
- Use a comprehensive word list (assume provided) for validation - should include plurals, verb forms, no proper nouns
- Separate smaller "common words" list for puzzle generation
- Words only count if placed in correct length position

## Technical Requirements

### Frontend (React/Next.js)
- Drag-and-drop tile interface
- Four word "racks" with visual length indicators
- Real-time word validation and scoring display
- Timer display
- Responsive design for mobile/desktop

### Backend
- Express.js or Python (Flask/FastAPI) - your choice
- RESTful API endpoints for puzzle data and validation
- Date-based puzzle generation using seeded randomization
- Session/cookie-based play tracking (no user accounts needed for MVP)

### User Experience
- Visual feedback for valid/invalid words
- Tiles can be moved between racks during play
- Score calculation updates in real-time
- Prevent multiple plays per day per user

## Daily Puzzle Features

### Play Limiting
- Track completed puzzles using browser localStorage or cookies
- Prevent multiple plays of same day's puzzle
- Allow access to previous days' puzzles

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
11. [ ] Update `ShareButton` to use Web Share API (plus general zhuzh)
12. [ ] Unit/integration tests for all components (I'll be better about adding these as I go in future phases)

### Phase 2: Daily Puzzle Infrastructure (Week 3)
**Deliverables:**
- Date-based puzzle generation
- Play limiting system
- Historical puzzle access
- Shareable results generation

**Key Features:**
- Seeded random puzzle creation
- Cookie/localStorage tracking
- Results formatting and copy-to-clipboard
- Previous puzzle navigation

### Phase 3: Polish and Optimization (Week 4)
**Deliverables:**
- Enhanced UI/UX
- Performance optimization
- Error handling
- Mobile optimization
- Branding (name and logo)

**Key Features:**
- Improved animations and transitions
- Better mobile touch interactions
- Comprehensive error handling
- Loading states and feedback
- Dark mode

**Miscellaneous:**

(This is a to-do list for small tasks I want to take care of before launch.  They all have to be done, but I'm not sure I'd call them "key features".)
- Download font rather than using link
- Instructions screen
- Display history of past games

## Technical Specifications

### API Endpoints
- `GET /api/puzzle/:date` - Get puzzle for specific date
- `GET /api/config` - Get current scoring configuration
- `POST /api/submit` - Submit completed puzzle

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
