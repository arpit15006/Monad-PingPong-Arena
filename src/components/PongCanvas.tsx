import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { GameProps, GameState, PeerData } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_DEPTH,
  BALL_RADIUS,
  WINNING_SCORE,
  PADDLE_PERSPECTIVE,
  BALL_SHADOW_BLUR,
  PADDLE_SHADOW_BLUR,
  NETWORK_SYNC_INTERVAL,
  MIN_DELTA_FOR_SYNC,
  BALL_SPEED_INCREMENT,
  MAX_BALL_SPEED,
  TABLE_GRID_SIZE,
  TABLE_GRID_OPACITY,
  TABLE_CENTER_LINE_WIDTH,
  TABLE_CENTER_LINE_DASH,
  TABLE_BORDER_WIDTH,
  TABLE_BORDER_RADIUS,
  BALL_TRAIL_LENGTH,
  BALL_TRAIL_OPACITY,
  PADDLE_GLOW_INTENSITY,
  COLORS
} from '@/lib/gameConstants';

const PongCanvas = ({
  opponent = 'Bot',
  gameId,
  isMultiplayer = false,
  isPeerConnected = false,
  botSpeed = 5,
  gameStarted: externalGameStarted = false,
  onGameEnd,
  isHost = false,
}: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const [gameStarted, setGameStarted] = useState(externalGameStarted);
  const [initialized, setInitialized] = useState(false);
  const mousePositionRef = useRef({ y: 0 });
  const lastSyncedPaddleYRef = useRef<number | null>(null);

  // Ball trail for visual effects
  const ballTrailRef = useRef<{x: number, y: number}[]>([]);

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
    if (!isMultiplayer) return;

    const peerData: PeerData = {
      type,
      data,
      timestamp: Date.now()
    };

    window.dispatchEvent(new CustomEvent('peerSendData', {
      detail: peerData
    }));
  }, [isMultiplayer]);

  // Ensure the game initializes properly
  useEffect(() => {
    if (externalGameStarted && !gameStarted) {
      startGame();
    }
  }, [externalGameStarted]);

  // Listen for peer game state updates
  useEffect(() => {
    const handlePeerSync = (event: CustomEvent) => {
      if (!isMultiplayer) return;

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
              if (onGameEnd) onGameEnd(1);
            } else if (peerData.data.score2 >= WINNING_SCORE) {
              gameStateRef.current.gameOver = true;
              gameStateRef.current.winner = 2;
              if (onGameEnd) onGameEnd(2);
            }
          }
          break;

        case 'gameOver':
          // Set game over and winner
          gameStateRef.current.gameOver = true;
          gameStateRef.current.winner = peerData.data.winner;
          if (onGameEnd) onGameEnd(peerData.data.winner);
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
  }, [isMultiplayer, isHost, opponentPaddle, onGameEnd]);

  useEffect(() => {
    console.log("PongCanvas mounted with multiplayer:", isMultiplayer, "host:", isHost, "connected:", isPeerConnected);

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
    if (isMultiplayer && isPeerConnected && initialized && !gameStarted) {
      console.log("Peer connected, starting game automatically");
      startGame();
    }
  }, [isMultiplayer, isPeerConnected, initialized, gameStarted]);

  // Handle mouse movement to control the player's paddle
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

  // Bot AI movement
  const moveComputer = (timeScale: number) => {
    if (isMultiplayer) return; // Don't move AI in multiplayer mode

    const gameState = gameStateRef.current;
    const { paddle2Y, ballY, ballSpeedX, ballX } = gameState;

    // Calculate target Y based on ball trajectory
    let targetY = ballY;

    // Predict ball position when it reaches paddle
    if (ballSpeedX > 0) {
      // Ball is moving toward the right (computer) side
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

    // Update player's paddle position based on role
    gameStateRef.current[playerPaddle] = newY;

    // In multiplayer mode, send paddle position to peer if it has changed significantly
    if (isMultiplayer && isPeerConnected) {
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

    // Only host updates ball physics in multiplayer mode
    if (!isMultiplayer || isHost) {
      // Update ball position
      ballX += ballSpeedX * timeScale;
      ballY += ballSpeedY * timeScale;

      // Update ball trail for visual effects
      ballTrailRef.current.push({x: ballX, y: ballY});
      if (ballTrailRef.current.length > BALL_TRAIL_LENGTH) {
        ballTrailRef.current.shift();
      }

      // Ball collision with top and bottom walls
      if (ballY < BALL_RADIUS) {
        ballY = BALL_RADIUS;
        ballSpeedY = Math.abs(ballSpeedY);
      } else if (ballY > CANVAS_HEIGHT - BALL_RADIUS) {
        ballY = CANVAS_HEIGHT - BALL_RADIUS;
        ballSpeedY = -Math.abs(ballSpeedY);
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

        // Play sound effect (future enhancement)
      }
      // Check collision with player 2 paddle (right)
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

        // Play sound effect (future enhancement)
      }

      // Check if ball went out of bounds (scoring)
      let scoreChanged = false;

      if (ballX < 0) {
        // Point for opponent/player 2
        score2 += 1;
        scoreChanged = true;

        if (!isMultiplayer) {
          toast.error('Point for opponent!');
        }

        // Check for game over
        if (score2 >= WINNING_SCORE) {
          gameOver = true;
          winner = 2;

          if (isMultiplayer && isPeerConnected) {
            sendGameState('gameOver', { winner: 2 });
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
        // Point for player 1
        score1 += 1;
        scoreChanged = true;

        if (!isMultiplayer) {
          toast.success('You scored a point!');
        }

        // Check for game over
        if (score1 >= WINNING_SCORE) {
          gameOver = true;
          winner = 1;

          if (isMultiplayer && isPeerConnected) {
            sendGameState('gameOver', { winner: 1 });
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

      // In multiplayer mode, host sends updated ball position and scores to peer
      if (isMultiplayer && isPeerConnected && isHost) {
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
    console.log("Starting game with multiplayer:", isMultiplayer, "host:", isHost);

    // Reset ball trail
    ballTrailRef.current = [];

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

    if (isMultiplayer) {
      toast.success("Game started! " + (isHost ? "You're player 1" : "You're player 2"));
    }
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

    // Move computer paddle if not multiplayer
    if (!isMultiplayer) {
      moveComputer(deltaTime / 16.67);
    }

    // Render the game
    renderGame();

    // Continue the game loop only if game is not over
    if (!gameStateRef.current.gameOver) {
      requestIdRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Render the game on canvas with enhanced visuals
  const renderGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    try {
      // Clear canvas with dark blue background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Get the current game state
      const {
        ballX, ballY,
        paddle1Y, paddle2Y,
        score1, score2,
        gameOver, winner
      } = gameStateRef.current;

      // Draw table grid for enhanced visuals
      drawTableGrid(ctx);

      // Draw table border with rounded corners
      drawTableBorder(ctx);

      // Draw center line
      ctx.setLineDash(TABLE_CENTER_LINE_DASH);
      ctx.lineWidth = TABLE_CENTER_LINE_WIDTH;
      ctx.strokeStyle = COLORS.centerLine;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw scores
      ctx.font = 'bold 60px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.scoreText;
      ctx.fillText(score1.toString(), CANVAS_WIDTH / 4, 70);
      ctx.fillText(score2.toString(), 3 * CANVAS_WIDTH / 4, 70);

      // Draw player names
      ctx.font = '18px Orbitron, sans-serif';
      ctx.fillStyle = COLORS.playerText;

      if (isMultiplayer) {
        // In multiplayer mode, show player roles
        ctx.fillText(isHost ? 'You' : opponent, CANVAS_WIDTH / 4, 30);
        ctx.fillText(isHost ? opponent : 'You', 3 * CANVAS_WIDTH / 4, 30);
      } else {
        // In single player mode
        ctx.fillText('You', CANVAS_WIDTH / 4, 30);
        ctx.fillText(opponent, 3 * CANVAS_WIDTH / 4, 30);
      }

      // Draw ball trail for motion effect
      drawBallTrail(ctx);

      // Draw ball with enhanced glow effect
      drawEnhancedBall(ctx, ballX, ballY);

      // Draw player 1 paddle (left) with enhanced 3D effect and glow
      drawEnhancedPaddle(ctx, 0, paddle1Y, true, COLORS.paddle1Main, COLORS.paddle1Light, COLORS.paddle1Dark, COLORS.paddle1Glow);

      // Draw player 2 paddle (right) with enhanced 3D effect and glow
      drawEnhancedPaddle(ctx, CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y, false, COLORS.paddle2Main, COLORS.paddle2Light, COLORS.paddle2Dark, COLORS.paddle2Glow);

      // Show connection status for multiplayer games
      if (isMultiplayer) {
        ctx.font = '14px Orbitron, sans-serif';
        ctx.fillStyle = isPeerConnected ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(
          isPeerConnected ? 'Connected to opponent' : 'Waiting for connection...',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT - 15
        );
      }

      // Draw game over message if game is over
      if (gameOver) {
        ctx.fillStyle = COLORS.gameOverOverlay;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.font = 'bold 48px Orbitron, sans-serif';
        ctx.fillStyle = COLORS.gameOverText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let message;
        if (isMultiplayer) {
          // In multiplayer, show who won based on player role
          if (isHost) {
            message = winner === 1 ? 'You Won!' : `${opponent} Won!`;
          } else {
            message = winner === 2 ? 'You Won!' : `${opponent} Won!`;
          }
        } else {
          // In single player mode
          message = winner === 1 ? 'You Won!' : `${opponent} Won!`;
        }

        ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        // Only show 'play again' option for single player games
        if (!isMultiplayer) {
          ctx.font = '24px Orbitron, sans-serif';
          ctx.fillText('Click to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        } else {
          ctx.font = '20px Orbitron, sans-serif';
          ctx.fillText('Return to lobby to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        }
      }
    } catch (error) {
      console.error('Error rendering game:', error);
    }
  };

  // Draw the table grid for enhanced visuals
  const drawTableGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = COLORS.gridLines;
    ctx.lineWidth = 1;
    ctx.globalAlpha = TABLE_GRID_OPACITY;

    // Draw vertical grid lines
    for (let x = TABLE_GRID_SIZE; x < CANVAS_WIDTH; x += TABLE_GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = TABLE_GRID_SIZE; y < CANVAS_HEIGHT; y += TABLE_GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  };

  // Draw the table border with rounded corners
  const drawTableBorder = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = COLORS.tableBorder;
    ctx.lineWidth = TABLE_BORDER_WIDTH;
    ctx.lineJoin = 'round';

    // Draw rounded rectangle for table border
    ctx.beginPath();
    ctx.moveTo(TABLE_BORDER_WIDTH / 2, TABLE_BORDER_RADIUS);
    ctx.arcTo(TABLE_BORDER_WIDTH / 2, TABLE_BORDER_WIDTH / 2, TABLE_BORDER_RADIUS, TABLE_BORDER_WIDTH / 2, TABLE_BORDER_RADIUS);
    ctx.lineTo(CANVAS_WIDTH - TABLE_BORDER_RADIUS, TABLE_BORDER_WIDTH / 2);
    ctx.arcTo(CANVAS_WIDTH - TABLE_BORDER_WIDTH / 2, TABLE_BORDER_WIDTH / 2, CANVAS_WIDTH - TABLE_BORDER_WIDTH / 2, TABLE_BORDER_RADIUS, TABLE_BORDER_RADIUS);
    ctx.lineTo(CANVAS_WIDTH - TABLE_BORDER_WIDTH / 2, CANVAS_HEIGHT - TABLE_BORDER_RADIUS);
    ctx.arcTo(CANVAS_WIDTH - TABLE_BORDER_WIDTH / 2, CANVAS_HEIGHT - TABLE_BORDER_WIDTH / 2, CANVAS_WIDTH - TABLE_BORDER_RADIUS, CANVAS_HEIGHT - TABLE_BORDER_WIDTH / 2, TABLE_BORDER_RADIUS);
    ctx.lineTo(TABLE_BORDER_RADIUS, CANVAS_HEIGHT - TABLE_BORDER_WIDTH / 2);
    ctx.arcTo(TABLE_BORDER_WIDTH / 2, CANVAS_HEIGHT - TABLE_BORDER_WIDTH / 2, TABLE_BORDER_WIDTH / 2, CANVAS_HEIGHT - TABLE_BORDER_RADIUS, TABLE_BORDER_RADIUS);
    ctx.closePath();
    ctx.stroke();
  };

  // Draw the ball trail for motion effect
  const drawBallTrail = (ctx: CanvasRenderingContext2D) => {
    const trail = ballTrailRef.current;
    if (trail.length === 0) return;

    // Draw trail segments with decreasing opacity
    for (let i = 0; i < trail.length - 1; i++) {
      const opacity = BALL_TRAIL_OPACITY * (i / trail.length);
      const radius = BALL_RADIUS * (0.5 + 0.5 * (i / trail.length));

      ctx.beginPath();
      ctx.fillStyle = `rgba(236, 72, 153, ${opacity})`;
      ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Draw the ball with enhanced visual effects
  const drawEnhancedBall = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Ball glow effect
    ctx.shadowColor = COLORS.ballGlow;
    ctx.shadowBlur = BALL_SHADOW_BLUR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Gradient for the ball
    const ballGradient = ctx.createRadialGradient(
      x - BALL_RADIUS / 3, y - BALL_RADIUS / 3, 0,
      x, y, BALL_RADIUS
    );
    ballGradient.addColorStop(0, COLORS.ballGradient1);
    ballGradient.addColorStop(1, COLORS.ballGradient2);

    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2, false);
    ctx.fill();

    // Add highlight to ball
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.arc(x - BALL_RADIUS / 3, y - BALL_RADIUS / 3, BALL_RADIUS / 3, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  // Draw a paddle with enhanced 3D effect and glow
  const drawEnhancedPaddle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isLeftPaddle: boolean,
    mainColor: string,
    lightColor: string,
    darkColor: string,
    glowColor: string
  ) => {
    // Paddle glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = PADDLE_SHADOW_BLUR;
    ctx.shadowOffsetX = isLeftPaddle ? 5 : -5;
    ctx.shadowOffsetY = 5;

    // Main paddle body
    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Enhanced 3D effect - top side
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    if (isLeftPaddle) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + PADDLE_WIDTH, y);
      ctx.lineTo(x + PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(x, y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + PADDLE_WIDTH, y);
      ctx.lineTo(x + PADDLE_WIDTH, y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(x, y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
    }
    ctx.closePath();
    ctx.fill();

    // Enhanced 3D effect - side
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    if (isLeftPaddle) {
      ctx.moveTo(x + PADDLE_WIDTH, y);
      ctx.lineTo(x + PADDLE_WIDTH, y + PADDLE_HEIGHT);
      ctx.lineTo(x + PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(x + PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + PADDLE_HEIGHT);
      ctx.lineTo(x - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(x - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
    }
    ctx.closePath();
    ctx.fill();

    // Enhanced 3D effect - bottom side
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    if (isLeftPaddle) {
      ctx.moveTo(x, y + PADDLE_HEIGHT);
      ctx.lineTo(x + PADDLE_WIDTH, y + PADDLE_HEIGHT);
      ctx.lineTo(x + PADDLE_WIDTH - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(x, y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
    } else {
      ctx.moveTo(x, y + PADDLE_HEIGHT);
      ctx.lineTo(x + PADDLE_WIDTH, y + PADDLE_HEIGHT);
      ctx.lineTo(x + PADDLE_WIDTH, y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
      ctx.lineTo(x - PADDLE_DEPTH * PADDLE_PERSPECTIVE, y + PADDLE_HEIGHT + PADDLE_DEPTH * PADDLE_PERSPECTIVE);
    }
    ctx.closePath();
    ctx.fill();

    // Add highlight to paddle
    const gradientHeight = PADDLE_HEIGHT / 4;
    const paddleGradient = ctx.createLinearGradient(x, y, x, y + gradientHeight);
    paddleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    paddleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = paddleGradient;
    ctx.fillRect(x, y, PADDLE_WIDTH, gradientHeight);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
        console.log("Canvas clicked", gameStateRef.current.gameOver, gameStarted, isMultiplayer);

        // For multiplayer games, don't allow restart after game over
        if (isMultiplayer && gameStateRef.current.gameOver) {
          console.log("Multiplayer game ended - cannot restart");
          return;
        }

        // For single player or not-yet-started games, allow start/restart
        if (gameStateRef.current.gameOver || !gameStarted) {
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
      {!gameStarted && isMultiplayer && !isPeerConnected ? (
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

export default PongCanvas;
