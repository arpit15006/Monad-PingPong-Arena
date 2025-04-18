// Game results storage
// This is a client-side storage solution for game results
// In a production environment, this would be replaced with a server-side database

interface GameResult {
  gameId: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  winner: string;
  timestamp: number;
}

const STORAGE_KEY = 'monad_ping_pong_game_results';

// Get all stored game results
export const getGameResults = (): GameResult[] => {
  try {
    const storedResults = localStorage.getItem(STORAGE_KEY);
    if (storedResults) {
      return JSON.parse(storedResults);
    }
  } catch (error) {
    console.error('Error retrieving game results from localStorage:', error);
  }
  return [];
};

// Get a specific game result by ID
export const getGameResultById = (gameId: string): GameResult | undefined => {
  const results = getGameResults();
  return results.find(result => result.gameId === gameId);
};

// Save a new game result
export const saveGameResult = (result: GameResult): void => {
  try {
    const results = getGameResults();
    
    // Check if this game result already exists
    const existingIndex = results.findIndex(r => r.gameId === result.gameId);
    
    if (existingIndex >= 0) {
      // Update existing result
      results[existingIndex] = result;
    } else {
      // Add new result
      results.push(result);
    }
    
    // Store back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    console.log(`Game result saved for game ${result.gameId}`);
  } catch (error) {
    console.error('Error saving game result to localStorage:', error);
  }
};

// Clear all game results (for testing)
export const clearGameResults = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
