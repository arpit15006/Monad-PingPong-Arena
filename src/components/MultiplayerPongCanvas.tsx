
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PeerData } from '@/lib/types';
import { playSound } from '@/lib/sounds';
import { playAnimation, AnimationType } from '@/lib/animations';

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const PADDLE_DEPTH = 20; // for 3D effect
const BALL_RADIUS = 10;
const WINNING_SCORE = 5;
const PADDLE_PERSPECTIVE = 0.3; // Controls the 3D perspective effect
const BALL_SHADOW_BLUR = 15;
const PADDLE_SHADOW_BLUR = 20;
const NETWORK_SYNC_INTERVAL = 16; // ms between network updates
const MIN_DELTA_FOR_SYNC = 0.5; // Minimum paddle movement to sync

// Game constants
const BALL_SPEED_INCREMENT = 0.05; // Speed increases by 5% each hit
const MAX_BALL_SPEED = 15;

// Game state type
interface GameState {
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  paddle1Y: number;
  paddle2Y: number;
  score1: number;
  score2: number;
  gameOver: boolean;
  winner: 1 | 2 | null;
}

interface MultiplayerPongCanvasProps {
  opponent: string;
  gameId?: string;
  isMultiplayer: true;
  isPeerConnected: boolean;
  onGameEnd: (winner: 1 | 2) => void;
  gameStarted: boolean;
  isHost: boolean;
}

const MultiplayerPongCanvas = ({
  opponent,
  gameId,
  isMultiplayer,
  isPeerConnected,
  onGameEnd,
  gameStarted: externalGameStarted,
  isHost,
}: MultiplayerPongCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const [gameStarted, setGameStarted] = useState(externalGameStarted);
  const [initialized, setInitialized] = useState(false);
  const mousePositionRef = useRef({ y: 0 });
  const lastSyncedPaddleYRef = useRef<number | null>(null);

  // Game state with default values
  const gameStateRef = useRef<GameState>({
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: isHost ? 5 : -5, // Host starts with ball going right, guest going left
    ballSpeedY: 2,
    paddle1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    paddle2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score1: 0,
    score2: 0,
    gameOver: false,
    winner: null
  });

  // Determine which paddle the player controls (paddle1 for host, paddle2 for guest)
  const playerPaddle = isHost ? 'paddle1Y' : 'paddle2Y';
  const opponentPaddle = isHost ? 'paddle2Y' : 'paddle1Y';

  // Function to send game state via peer connection
  const sendGameState = useCallback((type: 'paddle' | 'ball' | 'score' | 'gameOver', data: any) => {
    const peerData: PeerData = {
      type,
      data,
      timestamp: Date.now()
    };

    window.dispatchEvent(new CustomEvent('peerSendData', {
      detail: peerData
    }));
  }, []);

  // Ensure the game initializes properly
  useEffect(() => {
    if (externalGameStarted && !gameStarted) {
      startGame();
    }
  }, [externalGameStarted]);

  // Listen for peer game state updates
  useEffect(() => {
    const handlePeerSync = (event: CustomEvent) => {
      const peerData = event.detail as PeerData;
      if (!peerData) return;

      // Handle different types of peer data
      switch (peerData.type) {
        case 'paddle':
          // Update opponent's paddle position
          gameStateRef.current[opponentPaddle] = peerData.data;
          break;

        case 'ball':
          // Only non-host should update ball position from peer
          if (!isHost) {
            const ballData = peerData.data;
            gameStateRef.current.ballX = ballData.x;
            gameStateRef.current.ballY = ballData.y;
            gameStateRef.current.ballSpeedX = ballData.speedX;
            gameStateRef.current.ballSpeedY = ballData.speedY;
          }
          break;

        case 'score':
          // Update scores from host
          if (!isHost) {
            gameStateRef.current.score1 = peerData.data.score1;
            gameStateRef.current.score2 = peerData.data.score2;

            // If either score reaches winning score, end game
            if (peerData.data.score1 >= WINNING_SCORE) {
              gameStateRef.current.gameOver = true;
              gameStateRef.current.winner = 1;
              if (onGameEnd) onGameEnd(1, score1, score2);
            } else if (peerData.data.score2 >= WINNING_SCORE) {
              gameStateRef.current.gameOver = true;
              gameStateRef.current.winner = 2;
              if (onGameEnd) onGameEnd(2, peerData.data.score1, peerData.data.score2);
            }
          }
          break;

        case 'gameOver':
          // Set game over and winner
          gameStateRef.current.gameOver = true;
          gameStateRef.current.winner = peerData.data.winner;
          // Get current scores
          const { score1, score2 } = gameStateRef.current;
          if (onGameEnd) onGameEnd(peerData.data.winner, score1, score2);
          break;

        default:
          break;
      }
    };

    // Add event listener
    window.addEventListener('peerSync', handlePeerSync as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('peerSync', handlePeerSync as EventListener);
    };
  }, [isHost, opponentPaddle, onGameEnd]);

  useEffect(() => {
    console.log("MultiplayerPongCanvas mounted with multiplayer:", isMultiplayer, "host:", isHost, "connected:", isPeerConnected);

    // Initialize the canvas once mounted
    renderGame();
    setInitialized(true);

    return () => {
      // Cleanup animation frame on unmount
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
  }, []);

  // Effect to start game automatically when peer is connected in multiplayer mode
  useEffect(() => {
    if (isPeerConnected && initialized && !gameStarted) {
      console.log("Peer connected, starting game automatically");
      startGame();
    }
  }, [isPeerConnected, initialized, gameStarted]);

  // Handle mouse movement to control the player's paddle
  const handleMouseMove = (event: MouseEvent): void => {
    // Always track mouse position even if game is over (for UI responsiveness)
    // but we'll only use it to update paddles if the game is not over
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    const canvasHeight = rect.height;
    const scaleFactor = CANVAS_HEIGHT / canvasHeight;

    // Scale mouse position to canvas coordinates
    const scaledMouseY = mouseY * scaleFactor;

    // Store the mouse position for use in the game loop
    mousePositionRef.current = { y: scaledMouseY };
  };

  // Handle touch movement for mobile devices
  const handleTouchMove = (event: TouchEvent): void => {
    // Always track touch position even if game is over (for UI responsiveness)
    // but we'll only use it to update paddles if the game is not over
    if (!canvasRef.current) return;

    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touchY = event.touches[0].clientY - rect.top;
    const canvasHeight = rect.height;
    const scaleFactor = CANVAS_HEIGHT / canvasHeight;

    // Scale touch position to canvas coordinates
    const scaledTouchY = touchY * scaleFactor;

    // Store the touch position for use in the game loop
    mousePositionRef.current = { y: scaledTouchY };
  };

  // Move player paddle based on mouse position
  const movePlayer = () => {
    // This function is only called when the game is not over (checked in gameLoop)
    const mouseY = mousePositionRef.current.y;
    // Calculate new paddle position (centered on mouse)
    const newY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, mouseY - PADDLE_HEIGHT / 2));

    // Update player's paddle position based on role
    gameStateRef.current[playerPaddle] = newY;

    // Send paddle position to peer if it has changed significantly
    if (isPeerConnected) {
      const now = Date.now();
      // Only send updates at most every NETWORK_SYNC_INTERVAL ms and if position changed significantly
      if (now - lastSyncTimeRef.current >= NETWORK_SYNC_INTERVAL &&
          (lastSyncedPaddleYRef.current === null ||
           Math.abs(newY - lastSyncedPaddleYRef.current) >= MIN_DELTA_FOR_SYNC)) {

        sendGameState('paddle', newY);
        lastSyncTimeRef.current = now;
        lastSyncedPaddleYRef.current = newY;
      }
    }
  };

  // Update the game state based on delta time for smooth animations
  const updateGameState = (deltaTime: number) => {
    // Time-based movement scaling for consistent speed regardless of frame rate
    const timeScale = deltaTime / 16.67; // Normalized to ~60fps

    const gameState = gameStateRef.current;
    let {
      ballX, ballY, ballSpeedX, ballSpeedY,
      paddle1Y, paddle2Y, score1, score2,
      gameOver, winner
    } = gameState;

    // If game is over, don't update physics - just keep rendering the end screen
    if (gameOver) {
      return;
    }

    // Only host updates ball physics in multiplayer mode
    if (isHost) {
      // Update ball position
      ballX += ballSpeedX * timeScale;
      ballY += ballSpeedY * timeScale;

      // Ball collision with top and bottom walls
      if (ballY < BALL_RADIUS) {
        ballY = BALL_RADIUS;
        ballSpeedY = Math.abs(ballSpeedY);
        // Play wall hit sound
        playSound('wallHit', 0.3);
      } else if (ballY > CANVAS_HEIGHT - BALL_RADIUS) {
        ballY = CANVAS_HEIGHT - BALL_RADIUS;
        ballSpeedY = -Math.abs(ballSpeedY);
        // Play wall hit sound
        playSound('wallHit', 0.3);
      }

      // Check collision with player 1 paddle (left)
      if (
        ballX - BALL_RADIUS <= PADDLE_WIDTH &&
        ballY >= paddle1Y &&
        ballY <= paddle1Y + PADDLE_HEIGHT &&
        ballSpeedX < 0 // Only check when ball is moving left
      ) {
        // Play paddle hit sound
        playSound('paddleHit', 0.4);

        // Calculate ball reflection - angle depends on where it hit the paddle
        ballSpeedX = Math.abs(ballSpeedX) * (1 + BALL_SPEED_INCREMENT); // Increase speed slightly each hit

        // Calculate relative hit position (-0.5 to 0.5)
        const hitPosition = (ballY - (paddle1Y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = hitPosition * 10; // Adjust angle based on hit position

        // Limit maximum ball speed
        const currentSpeed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
        if (currentSpeed > MAX_BALL_SPEED) {
          const ratio = MAX_BALL_SPEED / currentSpeed;
          ballSpeedX *= ratio;
          ballSpeedY *= ratio;
        }

        // Ensure ball doesn't get stuck inside paddle
        ballX = PADDLE_WIDTH + BALL_RADIUS;
      }
      // Check collision with player 2 paddle (right)
      else if (
        ballX + BALL_RADIUS >= CANVAS_WIDTH - PADDLE_WIDTH &&
        ballY >= paddle2Y &&
        ballY <= paddle2Y + PADDLE_HEIGHT &&
        ballSpeedX > 0 // Only check when ball is moving right
      ) {
        // Play paddle hit sound
        playSound('paddleHit', 0.4);

        ballSpeedX = -Math.abs(ballSpeedX) * (1 + BALL_SPEED_INCREMENT);

        const hitPosition = (ballY - (paddle2Y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = hitPosition * 10;

        // Limit maximum ball speed
        const currentSpeed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
        if (currentSpeed > MAX_BALL_SPEED) {
          const ratio = MAX_BALL_SPEED / currentSpeed;
          ballSpeedX *= ratio;
          ballSpeedY *= ratio;
        }

        // Ensure ball doesn't get stuck inside paddle
        ballX = CANVAS_WIDTH - PADDLE_WIDTH - BALL_RADIUS;
      }

      // Check if ball went out of bounds (scoring)
      let scoreChanged = false;

      if (ballX < 0) {
        // Point for opponent/player 2
        score2 += 1;
        scoreChanged = true;

        // Play score sound
        playSound('score', 0.5);

        // Check for game over
        if (score2 >= WINNING_SCORE) {
          gameOver = true;
          winner = 2;

          if (isPeerConnected) {
            sendGameState('gameOver', { winner: 2 });
          }

          if (onGameEnd) onGameEnd(2, score1, score2);
        } else {
          // Reset ball to center with new direction
          ballX = CANVAS_WIDTH / 2;
          ballY = CANVAS_HEIGHT / 2;
          ballSpeedX = 5; // Reset speed and direction
          ballSpeedY = (Math.random() * 6 - 3);
        }
      } else if (ballX > CANVAS_WIDTH) {
        // Point for player 1
        score1 += 1;
        scoreChanged = true;

        // Play score sound
        playSound('score', 0.5);

        // Check for game over
        if (score1 >= WINNING_SCORE) {
          gameOver = true;
          winner = 1;

          if (isPeerConnected) {
            sendGameState('gameOver', { winner: 1 });
          }

          if (onGameEnd) onGameEnd(1, score1, score2);
        } else {
          // Reset ball to center with new direction
          ballX = CANVAS_WIDTH / 2;
          ballY = CANVAS_HEIGHT / 2;
          ballSpeedX = -5; // Reset speed and direction
          ballSpeedY = (Math.random() * 6 - 3);
        }
      }

      // In multiplayer mode, host sends updated ball position and scores to peer
      if (isPeerConnected) {
        // Send ball data at regular intervals
        const now = Date.now();
        if (now - lastSyncTimeRef.current >= NETWORK_SYNC_INTERVAL) {
          sendGameState('ball', {
            x: ballX,
            y: ballY,
            speedX: ballSpeedX,
            speedY: ballSpeedY
          });

          // Send score updates only when they change
          if (scoreChanged) {
            sendGameState('score', { score1, score2 });
          }

          lastSyncTimeRef.current = now;
        }
      }
    }

    // Update the game state reference
    gameStateRef.current = {
      ballX, ballY,
      ballSpeedX, ballSpeedY,
      paddle1Y, paddle2Y,
      score1, score2,
      gameOver, winner
    };
  };

  // Start a new game
  const startGame = () => {
    console.log("Starting multiplayer game with host:", isHost);

    // Reset all game state values
    gameStateRef.current = {
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballSpeedX: isHost ? 5 : -5, // Direction depends on role
      ballSpeedY: 2,
      paddle1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      paddle2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      score1: 0,
      score2: 0,
      gameOver: false,
      winner: null
    };

    setGameStarted(true);
    lastTimeRef.current = performance.now();

    // Cancel any existing animation frame before starting a new one
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
    }

    // Start the game loop
    requestIdRef.current = requestAnimationFrame(gameLoop);

    // Play game start sound
    playSound('matchStart', 0.6);

    toast.success("Game started! " + (isHost ? "You're player 1" : "You're player 2"));
  };

  // Main game loop
  const gameLoop = (timestamp: number) => {
    if (!gameStarted) return;

    // Calculate time since last frame
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const { gameOver } = gameStateRef.current;

    // Only update player paddle position if game is not over
    if (!gameOver) {
      movePlayer();
    }

    // Update game state (physics will be skipped if game is over)
    updateGameState(deltaTime);

    // Render the game
    renderGame();

    // Continue the game loop even after game is over to keep rendering the end screen
    requestIdRef.current = requestAnimationFrame(gameLoop);
  };

  // Render the game on canvas
  const renderGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      console.error('Canvas or context is null');
      return;
    }

    try {
      // Clear canvas with dark blue background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Get the current game state
      const {
        ballX, ballY,
        paddle1Y, paddle2Y,
        score1, score2,
        gameOver, winner
      } = gameStateRef.current;

      // Draw center line
      ctx.setLineDash([10, 15]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw scores
      ctx.font = 'bold 60px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillText(score1.toString(), CANVAS_WIDTH / 4, 70);
      ctx.fillText(score2.toString(), 3 * CANVAS_WIDTH / 4, 70);

      // Draw player names
      ctx.font = '18px Orbitron, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

      // In multiplayer mode, show player roles
      ctx.fillText(isHost ? 'You' : opponent, CANVAS_WIDTH / 4, 30);
      ctx.fillText(isHost ? opponent : 'You', 3 * CANVAS_WIDTH / 4, 30);

      // Draw ball with shadow
      ctx.shadowColor = '#EC4899';
      ctx.shadowBlur = BALL_SHADOW_BLUR;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Gradient for the ball
      const ballGradient = ctx.createRadialGradient(
        ballX, ballY, 0,
        ballX, ballY, BALL_RADIUS
      );
      ballGradient.addColorStop(0, '#EC4899');
      ballGradient.addColorStop(1, '#BE185D');

      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2, false);
      ctx.fill();

      // Reset shadow before drawing paddles
      ctx.shadowBlur = 0;

      // Draw player 1 paddle (left) with enhanced 3D effect
      ctx.shadowColor = '#3B82F6';
      ctx.shadowBlur = PADDLE_SHADOW_BLUR;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      // Main paddle body
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Enhanced 3D effect for left paddle - lighter side (top)
      ctx.fillStyle = '#60A5FA';
      ctx.beginPath();
      ctx.moveTo(0, paddle1Y);
      ctx.lineTo(PADDLE_WIDTH, paddle1Y);
      ctx.lineTo(PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle1Y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(0, paddle1Y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.closePath();
      ctx.fill();

      // Enhanced 3D effect for left paddle - darker side (right)
      ctx.fillStyle = '#1D4ED8';
      ctx.beginPath();
      ctx.moveTo(PADDLE_WIDTH, paddle1Y);
      ctx.lineTo(PADDLE_WIDTH, paddle1Y + PADDLE_HEIGHT);
      ctx.lineTo(PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle1Y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle1Y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.closePath();
      ctx.fill();

      // Enhanced 3D effect for left paddle - bottom side
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.moveTo(0, paddle1Y + PADDLE_HEIGHT);
      ctx.lineTo(PADDLE_WIDTH, paddle1Y + PADDLE_HEIGHT);
      ctx.lineTo(PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle1Y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(0, paddle1Y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.closePath();
      ctx.fill();

      // Reset shadow for right paddle
      ctx.shadowBlur = PADDLE_SHADOW_BLUR;
      ctx.shadowColor = '#10B981';
      ctx.shadowOffsetX = -5;
      ctx.shadowOffsetY = 5;

      // Right paddle (computer/opponent)
      // Main paddle body
      ctx.fillStyle = '#10B981';
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Enhanced 3D effect for right paddle - lighter side (top)
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y);
      ctx.lineTo(CANVAS_WIDTH, paddle2Y);
      ctx.lineTo(CANVAS_WIDTH, paddle2Y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.closePath();
      ctx.fill();

      // Enhanced 3D effect for right paddle - darker side (left)
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y);
      ctx.lineTo(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y + PADDLE_HEIGHT);
      ctx.lineTo(CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle2Y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle2Y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.closePath();
      ctx.fill();

      // Enhanced 3D effect for right paddle - bottom side
      ctx.fillStyle = '#0D9488';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y + PADDLE_HEIGHT);
      ctx.lineTo(CANVAS_WIDTH, paddle2Y + PADDLE_HEIGHT);
      ctx.lineTo(CANVAS_WIDTH, paddle2Y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, paddle2Y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.closePath();
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Show connection status for multiplayer games
      ctx.font = '14px Orbitron, sans-serif';
      ctx.fillStyle = isPeerConnected ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(
        isPeerConnected ? 'Connected to opponent' : 'Waiting for connection...',
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 15
      );

      // Draw game over message if game is over
      if (gameOver) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Game over text with glow effect
        ctx.save();
        ctx.shadowColor = '#EC4899';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 48px Orbitron, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let message;
        // In multiplayer, show who won based on player role
        if (isHost) {
          message = winner === 1 ? 'You Won!' : `${opponent} Won!`;
        } else {
          message = winner === 2 ? 'You Won!' : `${opponent} Won!`;
        }

        ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        // Return to lobby message for multiplayer games
        ctx.font = '20px Orbitron, sans-serif';
        ctx.shadowBlur = 5;
        ctx.fillText('Return to lobby to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        ctx.restore();
      }
    } catch (error) {
      console.error('Error rendering game:', error);
    }
  };

  // Set up event listeners and initialize game
  useEffect(() => {
    console.log("Setting up event listeners");
    const canvas = canvasRef.current;

    // Add event listeners for user input
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

      // Start or restart game on click
      const handleClick = () => {
        console.log("Canvas clicked", gameStateRef.current.gameOver, gameStarted);

        // For multiplayer games, don't allow restart after game over
        if (gameStateRef.current.gameOver) {
          console.log("Multiplayer game ended - cannot restart");
          return;
        }

        // Only allow starting a not-yet-started game
        if (!gameStarted) {
          startGame();
        }
      };

      canvas.addEventListener('click', handleClick);

      // Setup peer data sending event listener
      const handleSendData = (event: CustomEvent) => {
        // This event will be caught by Play.tsx and sent to the peer
        window.dispatchEvent(new CustomEvent('peerData', { detail: event.detail }));
      };

      window.addEventListener('peerSendData', handleSendData as EventListener);

      // Cleanup function to remove event listeners
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('click', handleClick);
        window.removeEventListener('peerSendData', handleSendData as EventListener);

        if (requestIdRef.current) {
          cancelAnimationFrame(requestIdRef.current);
          requestIdRef.current = null;
        }
      };
    }
  }, [gameStarted]);

  // Start game loop when gameStarted changes
  useEffect(() => {
    console.log("Game started effect:", gameStarted, initialized);
    if (gameStarted && initialized) {
      lastTimeRef.current = performance.now();
      // Cancel any existing animation frame before starting a new one
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
      requestIdRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
  }, [gameStarted, initialized]);

  return (
    <div className="w-full flex justify-center">
      {!gameStarted && !isPeerConnected ? (
        <div className="text-center py-10 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-neon-blue mx-auto" />
          <p className="text-gray-300">Waiting for opponent to connect...</p>
        </div>
      ) : (
        <div className="relative">
          <div
            className="absolute inset-0 bg-gradient-to-r from-neon-blue/30 to-neon-pink/30 blur-xl opacity-50 -z-10"
            style={{ transform: 'scale(0.95)' }}
          />
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="game-border bg-game-bg max-w-full h-auto glow-container relative z-10"
            style={{
              touchAction: 'none',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)',
              maxHeight: '80vh',
              borderRadius: '12px',
              border: '2px solid rgba(59, 130, 246, 0.3)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MultiplayerPongCanvas;
