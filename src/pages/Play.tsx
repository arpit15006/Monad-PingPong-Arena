
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MultiplayerPongCanvas from '@/components/MultiplayerPongCanvas';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';
import { Game, PeerConnectionStatus } from '@/lib/types';
import { Peer, DataConnection } from 'peerjs';
import { playSound } from '@/lib/sounds';
import { playAnimation, AnimationType, createParticleExplosion } from '@/lib/animations';
import { saveGameResult } from '@/lib/gameResults';

// Constants for peer connection
const PEER_RETRY_DELAY = 3000; // 3 seconds between retries
const HEARTBEAT_INTERVAL = 5000; // 5 seconds between heartbeats
const CONNECTION_TIMEOUT = 10000; // 10 seconds connection timeout

const Play = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { address, walletState, isCorrectChain, switchToMonadTestnet } = useWallet();

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [stake, setStake] = useState('0');
  const [isPlayer, setIsPlayer] = useState(false);
  const [canReport, setCanReport] = useState(false);

  // WebRTC state
  const [isHost, setIsHost] = useState(false);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const [peerStatus, setPeerStatus] = useState<PeerConnectionStatus>('disconnected');
  const retryTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  // Extract stake from URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const stakeParam = searchParams.get('stake');
    if (stakeParam) {
      setStake(stakeParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!gameId) {
      toast.error('Game ID is required');
      navigate('/multiplayer');
      return;
    }

    loadGameDetails();

    // Cleanup function
    return () => {
      // Set the navigating away flag to prevent reconnection attempts
      isNavigatingAwayRef.current = true;
      cleanupPeerConnection();
    };
  }, [gameId]);

  // Effect for checking if peer connection is alive using heartbeats
  useEffect(() => {
    if (peerStatus === 'connected') {
      const checkConnection = () => {
        const now = Date.now();
        if (now - lastHeartbeatRef.current > CONNECTION_TIMEOUT) {
          console.log('Connection timeout, attempting to reconnect...');
          setPeerStatus('disconnected');
          restartPeerConnection();
        }
      };

      const interval = setInterval(checkConnection, 5000);
      return () => clearInterval(interval);
    }
  }, [peerStatus]);

  // Effect to initialize peer connection when game details are loaded
  useEffect(() => {
    if (game && address && isPlayer && !gameEnded) {
      initializePeerConnection();
    }
  }, [game, address, isPlayer]);

  // Effect to handle auto game start when peer is connected
  useEffect(() => {
    if (peerStatus === 'connected' && isPlayer && !gameStarted && !gameEnded && !game?.isFinished && !game?.isCancelled) {
      console.log('Peer connected, starting game automatically');
      setGameStarted(true);
    }
  }, [peerStatus, isPlayer, gameStarted, gameEnded, game]);

  const loadGameDetails = async () => {
    try {
      setLoading(true);

      if (!gameId) return;

      const gameDetails = await pingPongContract.getGame(gameId);
      setGame(gameDetails);
      console.log("Loaded game details:", gameDetails);

      if (gameDetails.stake) {
        setStake(ethers.formatEther(gameDetails.stake));
      }

      // Check if current user is a player in this game
      if (address) {
        const isCurrentPlayer1 = gameDetails.player1.toLowerCase() === address.toLowerCase();
        const isCurrentPlayer2 = gameDetails.player2.toLowerCase() === address.toLowerCase();
        console.log("Is player 1:", isCurrentPlayer1, "Is player 2:", isCurrentPlayer2);

        setIsPlayer(isCurrentPlayer1 || isCurrentPlayer2);
        setIsHost(isCurrentPlayer1); // Player 1 is always the host

        // Check if the game can be reported (finished but winner not set)
        setCanReport(
          (isCurrentPlayer1 || isCurrentPlayer2) &&
          !gameDetails.isFinished &&
          !gameDetails.isCancelled &&
          gameDetails.player2 !== ethers.ZeroAddress
        );
      }
    } catch (error) {
      console.error('Error loading game details:', error);
      toast.error('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const initializePeerConnection = () => {
    if (!gameId || !address) return;

    cleanupPeerConnection();

    try {
      // Create peer IDs based on role (host or guest)
      const hostPeerId = `host_${gameId}`;
      const guestPeerId = `guest_${gameId}_${Date.now()}`;
      const peerId = isHost ? hostPeerId : guestPeerId;

      console.log(`Initializing as ${isHost ? 'host' : 'guest'} with ID: ${peerId}`);

      // Initialize the Peer
      const peer = new Peer(peerId);
      peerRef.current = peer;

      // Set up peer event handlers
      peer.on('open', (id) => {
        console.log(`Peer connection opened with ID: ${id}`);
        toast.success(`${isHost ? 'Hosting' : 'Joining'} game server`);
        setPeerStatus('connecting');

        if (isHost) {
          // Host waits for connections
          console.log('Host waiting for connections');
        } else {
          // Guest tries to connect to host
          console.log("Attempting to connect to host with ID:", hostPeerId);
          connectToHost(hostPeerId);
        }
      });

      peer.on('connection', (conn) => {
        console.log('Received connection from peer');
        setupConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setPeerStatus('error');

        // Only show error and attempt to reconnect if not navigating away
        if (!isNavigatingAwayRef.current) {
          toast.error(`Connection error: ${err.message}`);

          // Try to reconnect after delay
          if (retryTimeoutRef.current === null) {
            retryTimeoutRef.current = window.setTimeout(() => {
              retryTimeoutRef.current = null;
              if (peerStatus !== 'connected' && !isNavigatingAwayRef.current) {
                console.log('Retrying connection...');
                restartPeerConnection();
              }
            }, PEER_RETRY_DELAY);
          }
        }
      });

      peer.on('disconnected', () => {
        console.log('Peer disconnected');
        setPeerStatus('disconnected');

        // Only show reconnection message and attempt to reconnect if not navigating away and game not ended
        if (!isNavigatingAwayRef.current && !gameEnded) {
          toast.warning('Disconnected from game, trying to reconnect...');
          // Try to reconnect
          peer.reconnect();
        } else if (gameEnded) {
          console.log('Peer disconnected after game ended - not attempting to reconnect');
        }
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
        setPeerStatus('disconnected');

        // Only attempt to reconnect if not navigating away and game is not ended
        if (!gameEnded && !isNavigatingAwayRef.current) {
          restartPeerConnection();
        } else if (gameEnded) {
          console.log('Peer connection closed after game ended - not attempting to reconnect');
        }
      });
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      toast.error('Failed to set up game connection');
      setPeerStatus('error');
    }
  };

  const connectToHost = (hostPeerId: string) => {
    // Check if the current user is the invited player2
    if (game?.player2 && address?.toLowerCase() !== game.player2.toLowerCase()) {
      console.log('Cannot connect: You are not the invited player for this match');
      console.log('Game player2:', game.player2);
      console.log('Current address:', address);
      toast.error('You are not the invited player for this match');
      return;
    }
    if (!peerRef.current) return;

    try {
      console.log(`Connecting to host: ${hostPeerId}`);
      const conn = peerRef.current.connect(hostPeerId, {
        reliable: true,
        metadata: { role: 'guest' }
      });

      setupConnection(conn);
    } catch (error) {
      console.error('Error connecting to host:', error);
      toast.error('Failed to connect to game host');
      setPeerStatus('error');
    }
  };

  const setupConnection = (conn: DataConnection) => {
    // Store connection reference
    connectionRef.current = conn;

    conn.on('open', () => {
      console.log('Connection established');
      setPeerStatus('connected');
      toast.success('Connected to opponent!');

      // Start heartbeat
      startHeartbeat();
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      lastHeartbeatRef.current = Date.now();

      // Forward data to the game canvas using custom event
      window.dispatchEvent(new CustomEvent('peerSync', { detail: data }));
    });

    conn.on('close', () => {
      console.log('Connection closed');
      setPeerStatus('disconnected');
      stopHeartbeat();

      // Only attempt to reconnect if not navigating away and game is not ended
      if (!gameEnded && !isNavigatingAwayRef.current) {
        // If the game is still in progress, try to reconnect
        toast.warning('Connection to opponent lost, trying to reconnect...');
        restartPeerConnection();
      } else if (gameEnded) {
        // If game has ended, just log it without showing a toast
        console.log('Connection closed after game ended - not attempting to reconnect');
      }
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      setPeerStatus('error');
      stopHeartbeat();

      // Only show error if not navigating away
      if (!isNavigatingAwayRef.current) {
        toast.error(`Connection error: ${err}`);
      }
    });
  };

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = window.setInterval(() => {
      if (connectionRef.current && connectionRef.current.open) {
        connectionRef.current.send({
          type: 'heartbeat',
          timestamp: Date.now(),
          data: null
        });
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Track if we're navigating away from the page
  const isNavigatingAwayRef = useRef(false);

  const restartPeerConnection = () => {
    // Don't attempt to reconnect if we're navigating away or game has ended
    if (isNavigatingAwayRef.current || gameEnded) {
      console.log('Not restarting peer connection - navigating away or game ended');
      return;
    }

    cleanupPeerConnection();

    // Small delay before reconnecting
    setTimeout(() => {
      // Double-check we're not navigating away and game isn't ended
      if (!isNavigatingAwayRef.current && !gameEnded) {
        initializePeerConnection();
      }
    }, 1000);
  };

  const cleanupPeerConnection = () => {
    // Clear any pending timeouts or intervals
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    stopHeartbeat();

    // Close connection
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    // Close peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  // Set up a listener for peer data messages
  useEffect(() => {
    const handlePeerMessage = (event: CustomEvent) => {
      if (connectionRef.current && connectionRef.current.open) {
        connectionRef.current.send(event.detail);
      }
    };

    window.addEventListener('peerData', handlePeerMessage as EventListener);

    return () => {
      window.removeEventListener('peerData', handlePeerMessage as EventListener);
    };
  }, []);

  const handleCancel = async () => {
    if (!gameId || !game) return;

    try {
      // Set navigating flag first to prevent any reconnection attempts
      isNavigatingAwayRef.current = true;

      // Disable toast warnings for connection issues
      const originalToastWarning = toast.warning;
      toast.warning = () => ({ id: 'suppressed' });

      await pingPongContract.cancelMatch(gameId);
      toast.success('Game cancelled successfully');

      // Clean up connection
      cleanupPeerConnection();

      // Small delay to ensure cleanup is complete before navigation
      setTimeout(() => {
        // Restore toast function
        toast.warning = originalToastWarning;
        navigate('/multiplayer');
      }, 50);
    } catch (error) {
      console.error('Error cancelling game:', error);
      toast.error('Failed to cancel game');
      // Reset navigating flag if there was an error
      isNavigatingAwayRef.current = false;
      // Restore toast function
      toast.warning = originalToastWarning;
    }
  };

  // This function is kept for reference but no longer used directly by players
  // Admin will handle reporting results through the admin panel
  /*
  const handleReportResult = async (winnerAddress: string) => {
    if (!gameId || !game) return;

    try {
      setIsReporting(true);
      const result = await pingPongContract.reportMatchResult(gameId, winnerAddress);

      // Check if this was a simulated result (non-owner user)
      if (result && result.simulated) {
        // Update the UI to show the game as ended locally
        // In a real app, you would have a server that processes these results
        console.log('Result was simulated (non-owner user)');
        toast.success('Game result recorded locally');

        // Update local state to reflect the winner
        setGame(prev => prev ? {
          ...prev,
          winner: winnerAddress,
          // Note: We don't set isFinished to true since it's not confirmed on-chain
        } : null);
      } else {
        toast.success('Match result reported successfully');
        // Refresh game data to show the updated state from the blockchain
        loadGameDetails();
      }

      setGameEnded(true);
    } catch (error) {
      console.error('Error reporting match result:', error);
      toast.error('Failed to report match result');
    } finally {
      setIsReporting(false);
    }
  };
  */

  // Reference to the game container for animations
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleGameEnd = (winnerId: 1 | 2, finalScore1: number = 5, finalScore2: number = 3) => {
    console.log(`Game ended with winner: ${winnerId}, scores: ${finalScore1}-${finalScore2}`);
    setWinner(winnerId);
    setGameEnded(true);

    // Play sound based on whether the current player won or lost
    const isHost = game?.player1.toLowerCase() === address?.toLowerCase();
    const playerWon = (isHost && winnerId === 1) || (!isHost && winnerId === 2);

    // Determine the actual winner address based on the winnerId
    const winnerAddress = winnerId === 1 ? game?.player1 : game?.player2;

    // Save the game result to localStorage for the admin panel to access
    if (game && gameId && winnerAddress) {
      saveGameResult({
        gameId: gameId,
        player1: game.player1,
        player2: game.player2,
        score1: finalScore1,
        score2: finalScore2,
        winner: winnerAddress,
        timestamp: Date.now()
      });
      console.log('Game result saved to local storage');
    }

    if (playerWon) {
      // Play win sound
      playSound('win', 0.7);

      // Create victory particle effect
      if (gameContainerRef.current) {
        const container = gameContainerRef.current;
        const rect = container.getBoundingClientRect();
        createParticleExplosion(rect.width / 2, rect.height / 2, container, 50, [
          '#05d9e8', '#ff2a6d', '#ffb703', '#d1f7ff', '#7700a6'
        ]);

        // Apply win animation to the game container
        playAnimation(AnimationType.WIN, container);
      }

      toast.success('You won the match!', {
        duration: 5000,
      });
    } else {
      // Play lose sound
      playSound('lose', 0.7);

      // Apply lose animation to the game container
      if (gameContainerRef.current) {
        playAnimation(AnimationType.LOSE, gameContainerRef.current);
      }

      toast.error('You lost the match', {
        duration: 5000,
      });
    }

    // After game ends, we don't want to show reconnection messages
    // as the peer connection naturally closes when one player leaves
    const originalToastWarning = toast.warning;
    toast.warning = (message) => {
      // Only suppress connection-related messages
      if (message && typeof message === 'string' &&
          (message.includes('Connection') || message.includes('connect'))) {
        return { id: 'suppressed' };
      }
      return originalToastWarning(message);
    };

    // Restore toast after a delay
    setTimeout(() => {
      toast.warning = originalToastWarning;
    }, 5000);

    // We no longer automatically report the result to the blockchain
    // The admin will handle this through the admin panel
  };

  const shortenAddress = (address: string) => {
    if (!address || address === ethers.ZeroAddress) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Define game connection status label and color
  const getConnectionStatus = () => {
    switch (peerStatus) {
      case 'connected':
        return { label: 'Connected', className: 'bg-green-500/20 text-green-400' };
      case 'connecting':
        return { label: 'Connecting...', className: 'bg-yellow-500/20 text-yellow-400' };
      case 'error':
        return { label: 'Connection Error', className: 'bg-red-500/20 text-red-400' };
      default:
        return { label: 'Not Connected', className: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          Match #{gameId}
        </h1>
        <p className="text-gray-400 mt-2">
          {loading ? 'Loading match details...' : (
            game && game.isFinished ? 'Match Completed' :
            game && game.isCancelled ? 'Match Cancelled' :
            'In Progress'
          )}
        </p>
        {isPlayer && peerStatus && !loading && !game?.isFinished && !game?.isCancelled && (
          <div className="mt-2">
            <span className={`px-3 py-1 rounded-full text-xs ${connectionStatus.className}`}>
              {connectionStatus.label}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-neon-blue" />
        </div>
      ) : walletState !== 'connected' ? (
        <div className="max-w-md mx-auto bg-gray-900/50 rounded-lg border border-gray-800 p-6 text-center space-y-4">
          <p className="text-gray-300">
            Please connect your wallet to view match details
          </p>
        </div>
      ) : !isCorrectChain ? (
        <div className="max-w-md mx-auto bg-gray-900/50 rounded-lg border border-gray-800 p-6 text-center space-y-4">
          <p className="text-gray-300">
            Please switch to the Monad testnet to view match details
          </p>
          <Button
            className="bg-monad hover:bg-monad-600"
            onClick={switchToMonadTestnet}
          >
            Switch to Monad Testnet
          </Button>
        </div>
      ) : game ? (
        <div className="space-y-8">
          {/* Match Details */}
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400">Player 1 {isHost && address?.toLowerCase() === game.player1.toLowerCase() && '(You)'}</div>
                <div className="font-medium">
                  {shortenAddress(game.player1)}
                  {address && game.player1.toLowerCase() === address.toLowerCase() && (
                    <span className="ml-2 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-2 rounded-full">You</span>
                  )}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-400">Stake</div>
                <div className="font-medium text-neon-green">{stake} MON</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400">Player 2 {!isHost && address?.toLowerCase() === game.player2.toLowerCase() && '(You)'}</div>
                <div className="font-medium">
                  {game.player2 === ethers.ZeroAddress ? (
                    <span className="text-gray-500">Waiting for player...</span>
                  ) : (
                    <>
                      {shortenAddress(game.player2)}
                      {address && game.player2.toLowerCase() === address.toLowerCase() && (
                        <span className="ml-2 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-2 rounded-full">You</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {game.isFinished && (
              <div className="mt-6 pt-4 border-t border-gray-800">
                <div className="text-sm text-gray-400">Winner</div>
                <div className="font-medium text-neon-green">
                  {shortenAddress(game.winner)}
                  {address && game.winner.toLowerCase() === address.toLowerCase() && (
                    <span className="ml-2 text-xs bg-neon-green/20 text-neon-green py-0.5 px-2 rounded-full">You</span>
                  )}
                </div>
              </div>
            )}

            {game.isCancelled && (
              <div className="mt-4 bg-red-900/20 text-red-400 p-3 rounded-md text-center">
                This match has been cancelled
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {!game.isFinished && !game.isCancelled && game.player1.toLowerCase() === address?.toLowerCase() && game.player2 === ethers.ZeroAddress && (
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:text-red-400"
                  onClick={handleCancel}
                >
                  Cancel Match
                </Button>
              )}

              {isPlayer && peerStatus !== 'connected' && !gameStarted && !gameEnded && !game.isFinished && !game.isCancelled && (
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={restartPeerConnection}
                >
                  Reconnect to Game
                </Button>
              )}

              {gameEnded && winner && (
                <div className="w-full text-center space-y-3">
                  <div className="text-xl font-bold">
                    {winner === 1 ? 'Player 1' : 'Player 2'} Won!
                  </div>

                  {canReport && !game.isFinished && (
                    <div className="space-y-2">
                      <div className="bg-yellow-500/10 text-yellow-400 p-3 rounded-md text-center">
                        <p className="font-medium">Game Result: {winner === 1 ? 'Player 1' : 'Player 2'} Won!</p>
                        <p className="text-xs mt-2">
                          The game admin will finalize this result and transfer the staked MON to the winner.
                        </p>
                        <p className="text-xs mt-1">
                          <a href="/admin" className="text-neon-blue hover:underline" target="_blank">Admin panel</a> (contract owner only)
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    className="bg-neon-blue hover:bg-neon-blue/80 mt-4"
                    onClick={() => {
                      // Set navigating flag first to prevent any reconnection attempts
                      isNavigatingAwayRef.current = true;
                      // Disable toast notifications for connection issues
                      const originalToastWarning = toast.warning;
                      toast.warning = () => ({ id: 'suppressed' });

                      // Clean up connection
                      cleanupPeerConnection();

                      // Small delay to ensure cleanup is complete before navigation
                      setTimeout(() => {
                        // Restore toast function
                        toast.warning = originalToastWarning;
                        navigate('/multiplayer');
                      }, 50);
                    }}
                  >
                    Return to Lobby
                  </Button>


                </div>
              )}

              <Button
                variant="outline"
                className="border-gray-500 text-gray-300"
                onClick={() => {
                  // Set navigating flag first to prevent any reconnection attempts
                  isNavigatingAwayRef.current = true;
                  // Disable toast notifications for connection issues
                  const originalToastWarning = toast.warning;
                  toast.warning = () => ({ id: 'suppressed' });

                  // Clean up connection
                  cleanupPeerConnection();

                  // Small delay to ensure cleanup is complete before navigation
                  setTimeout(() => {
                    // Restore toast function
                    toast.warning = originalToastWarning;
                    navigate('/multiplayer');
                  }, 50);
                }}
              >
                Back to Multiplayer
              </Button>
            </div>
          </div>

          {/* Game Canvas */}
          {isPlayer && !game.isCancelled && (
            <div ref={gameContainerRef} className="relative">
              <MultiplayerPongCanvas
                opponent={shortenAddress(game.player1.toLowerCase() === address?.toLowerCase() ? game.player2 : game.player1)}
                gameId={gameId}
                isMultiplayer={true}
                isPeerConnected={peerStatus === 'connected'}
                onGameEnd={handleGameEnd}
                gameStarted={gameStarted}
                isHost={isHost}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          Match not found
        </div>
      )}
    </div>
  );
};

export default Play;
