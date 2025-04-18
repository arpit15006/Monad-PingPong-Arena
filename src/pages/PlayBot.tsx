
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BotPongCanvas from '@/components/BotPongCanvas';
import { toast } from 'sonner';

const PlayBot = () => {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [botSpeed, setBotSpeed] = useState<number>(5); // Default medium
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Update bot speed when difficulty changes
  useEffect(() => {
    if (difficulty === 'easy') {
      setBotSpeed(3);
    } else if (difficulty === 'medium') {
      setBotSpeed(5);
    } else if (difficulty === 'hard') {
      setBotSpeed(8);
    }
  }, [difficulty]);

  const handleStartGame = () => {
    setIsProcessing(true);

    // Start the game after brief delay for visual feedback
    setTimeout(() => {
      setGameStarted(true);
      toast.success(`Starting game against Bot (${difficulty} difficulty)!`, {
        duration: 3000,
      });
      setIsProcessing(false);
    }, 500);
  };

  const handleGameEnd = (winner: 1 | 2): void => {
    const message = winner === 1
      ? `You won against the bot!`
      : `You lost against the bot. Better luck next time!`;

    toast[winner === 1 ? 'success' : 'error'](message, {
      duration: 5000,
    });

    // Reset game state after a delay
    setTimeout(() => {
      setGameStarted(false);
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Play vs Bot</h1>
        <p className="text-gray-400 mt-2">
          Practice your skills against a computer opponent
        </p>
      </div>

      {!gameStarted ? (
        <div className="max-w-md mx-auto glass-card p-6 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-monad-500/5 to-neon-blue/5 z-0"></div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
              >
                <SelectTrigger className="glass-button border-neon-blue/30">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Bot games are completely free - perfect for practice mode!
              </p>
            </div>

            <Button
              className="w-full glass-button glow-button bg-neon-blue/20 border-neon-blue/30 hover:bg-neon-blue/40 hover:border-neon-blue/50 text-neon-blue"
              onClick={handleStartGame}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-neon-blue"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Start Game'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Playing Against: Bot ({difficulty})</h3>
              <p className="text-sm text-gray-400">First to 5 points wins</p>
            </div>
            <div className="text-right">
              <div className="text-neon-green font-bold">Practice Mode</div>
              <div className="text-xs text-gray-400">(Free Game)</div>
            </div>
          </div>

          <BotPongCanvas
            opponent={`Bot (${difficulty})`}
            botSpeed={botSpeed}
            onGameEnd={handleGameEnd}
            gameStarted={true}
          />

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setGameStarted(false)}
              className="glass-button border-neon-pink text-neon-pink hover:bg-neon-pink/20"
            >
              Quit Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayBot;
