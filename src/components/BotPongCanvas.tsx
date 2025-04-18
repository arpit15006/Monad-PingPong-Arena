
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { playSound } from '@/lib/sounds';
import { playAnimation, AnimationType, createParticleExplosion } from '@/lib/animations';

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

interface BotPongCanvasProps {
  opponent?: string;
  botSpeed: number;
  onGameEnd: (winner: 1 | 2) => void;
  gameStarted: boolean;
}

const BotPongCanvas = ({
  opponent = 'Bot',
  botSpeed = 5,
  gameStarted: externalGameStarted = false,
  onGameEnd,
}: BotPongCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const mousePositionRef = useRef({ y: 0 });
  const [gameStarted, setGameStarted] = useState(externalGameStarted);
  const [initialized, setInitialized] = useState(false);

  // Game state with default values
  const gameStateRef = useRef<GameState>({
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: 5, // Start with ball going right
    ballSpeedY: 2,
    paddle1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    paddle2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score1: 0,
    score2: 0,
    gameOver: false,
    winner: null
  });

  // Ensure the game initializes properly
  useEffect(() => {
    if (externalGameStarted && !gameStarted) {
      startGame();
    }
  }, [externalGameStarted]);

  useEffect(() => {
    console.log("BotPongCanvas mounted");

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

  // Handle mouse movement to control the player's paddle (paddle1 in bot mode)
  const handleMouseMove = (event: MouseEvent): void => {
    if (!canvasRef.current || gameStateRef.current.gameOver) return;

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
    if (!canvasRef.current || gameStateRef.current.gameOver) return;

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

  // Bot AI movement - controls paddle2 (right side)
  const moveBot = (timeScale: number) => {
    const gameState = gameStateRef.current;
    const { paddle2Y, ballY, ballSpeedX, ballX } = gameState;

    // Calculate target Y based on ball trajectory
    let targetY = ballY;

    // Predict ball position when it reaches paddle
    if (ballSpeedX > 0) {
      // Ball is moving toward the right (bot) side
      const timeToReach = (CANVAS_WIDTH - BALL_RADIUS - ballX) / ballSpeedX;
      const predictedY = ballY + gameState.ballSpeedY * timeToReach;

      // Add some randomness based on difficulty (botSpeed) - lower is easier
      const randomFactor = botSpeed <= 3 ? 40 : botSpeed <= 5 ? 20 : 5;
      const errorMargin = (Math.random() - 0.5) * randomFactor;
      targetY = predictedY + errorMargin;

      // Constrain predicted position to canvas bounds
      targetY = Math.max(PADDLE_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT / 2, targetY));
    }

    // Calculate center of paddle
    const paddleCenter = paddle2Y + PADDLE_HEIGHT / 2;

    // Move paddle towards the target at a speed proportional to difficulty
    const movementSpeed = botSpeed * timeScale;

    if (paddleCenter < targetY - 5) {
      // Move down
      gameStateRef.current.paddle2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle2Y + movementSpeed);
    } else if (paddleCenter > targetY + 5) {
      // Move up
      gameStateRef.current.paddle2Y = Math.max(0, paddle2Y - movementSpeed);
    }
  };

  // Move player paddle based on mouse position
  const movePlayer = () => {
    if (gameStateRef.current.gameOver) return;

    const mouseY = mousePositionRef.current.y;
    // Calculate new paddle position (centered on mouse)
    const newY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, mouseY - PADDLE_HEIGHT / 2));

    // Update player's paddle position (left paddle)
    gameStateRef.current.paddle1Y = newY;
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

    // Update ball position
    ballX += ballSpeedX * timeScale;
    ballY += ballSpeedY * timeScale;

    // Ball collision with top and bottom walls
    if (ballY < BALL_RADIUS) {
      ballY = BALL_RADIUS;
      ballSpeedY = Math.abs(ballSpeedY);
      playSound('wallHit', 0.3);
    } else if (ballY > CANVAS_HEIGHT - BALL_RADIUS) {
      ballY = CANVAS_HEIGHT - BALL_RADIUS;
      ballSpeedY = -Math.abs(ballSpeedY);
      playSound('wallHit', 0.3);
    }

    // Check collision with player 1 paddle (left)
    if (
      ballX - BALL_RADIUS <= PADDLE_WIDTH &&
      ballY >= paddle1Y &&
      ballY <= paddle1Y + PADDLE_HEIGHT &&
      ballSpeedX < 0 // Only check when ball is moving left
    ) {
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

      // Play paddle hit sound
      playSound('paddleHit', 0.5);
    }
    // Check collision with bot paddle (right)
    else if (
      ballX + BALL_RADIUS >= CANVAS_WIDTH - PADDLE_WIDTH &&
      ballY >= paddle2Y &&
      ballY <= paddle2Y + PADDLE_HEIGHT &&
      ballSpeedX > 0 // Only check when ball is moving right
    ) {
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

      // Play paddle hit sound
      playSound('paddleHit', 0.5);
    }

    // Check if ball went out of bounds (scoring)
    if (ballX < 0) {
      // Point for bot
      score2 += 1;

      // Play score sound and show toast
      playSound('score', 0.6);
      toast.error('Point for opponent!');

      // Check for game over
      if (score2 >= WINNING_SCORE) {
        gameOver = true;
        winner = 2;

        // Play lose sound and animation
        playSound('lose', 0.7);
        const canvas = canvasRef.current;
        if (canvas) {
          playAnimation(AnimationType.LOSE, canvas);
        }

        if (onGameEnd) onGameEnd(2);
      } else {
        // Reset ball to center with new direction
        ballX = CANVAS_WIDTH / 2;
        ballY = CANVAS_HEIGHT / 2;
        ballSpeedX = 5; // Reset speed and direction
        ballSpeedY = (Math.random() * 6 - 3);
      }
    } else if (ballX > CANVAS_WIDTH) {
      // Point for player
      score1 += 1;

      // Play score sound and show toast
      playSound('score', 0.6);
      toast.success('You scored a point!');

      // Check for game over
      if (score1 >= WINNING_SCORE) {
        gameOver = true;
        winner = 1;

        // Play win sound and animation
        playSound('win', 0.7);
        const canvas = canvasRef.current;
        if (canvas) {
          playAnimation(AnimationType.WIN, canvas);

          // Create particle explosion effect
          const rect = canvas.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          createParticleExplosion(centerX, centerY, canvas.parentElement || document.body, 50);
        }

        if (onGameEnd) onGameEnd(1);
      } else {
        // Reset ball to center with new direction
        ballX = CANVAS_WIDTH / 2;
        ballY = CANVAS_HEIGHT / 2;
        ballSpeedX = -5; // Reset speed and direction
        ballSpeedY = (Math.random() * 6 - 3);
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
    console.log("Starting bot game");

    // Reset all game state values
    gameStateRef.current = {
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballSpeedX: 5,
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

    // Play match start sound
    playSound('matchStart', 0.6);
    toast.success("Game started against the bot!");
  };

  // Main game loop
  const gameLoop = (timestamp: number) => {
    if (!gameStarted) return;

    // Calculate time since last frame
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Update player paddle position based on mouse
    movePlayer();

    // Update game state
    updateGameState(deltaTime);

    // Move bot paddle
    moveBot(deltaTime / 16.67);

    // Render the game
    renderGame();

    // Continue the game loop only if game is not over
    if (!gameStateRef.current.gameOver) {
      requestIdRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Render the game on canvas
  const renderGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

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
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillText(score1.toString(), CANVAS_WIDTH / 4, 70);
      ctx.fillText(score2.toString(), 3 * CANVAS_WIDTH / 4, 70);

      // Draw player names
      ctx.font = '18px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('You', CANVAS_WIDTH / 4, 30);
      ctx.fillText(opponent, 3 * CANVAS_WIDTH / 4, 30);

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

      // Right paddle (bot)
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

      // Draw game over message if game is over
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const message = winner === 1 ? 'You Won!' : `${opponent} Won!`;

        ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.font = '24px Arial';
        ctx.fillText('Click to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
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
        if (gameStateRef.current.gameOver || !gameStarted) {
          startGame();
        }
      };

      canvas.addEventListener('click', handleClick);

      // Cleanup function to remove event listeners
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('click', handleClick);

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
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-border game-table max-w-full h-auto glow-container"
        style={{
          touchAction: 'none',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          maxHeight: '80vh',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default BotPongCanvas;
