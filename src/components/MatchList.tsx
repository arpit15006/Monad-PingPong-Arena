
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/WalletProvider';
import { Card } from '@/components/ui/card';
import { ethers } from 'ethers';
import pingPongContract from '@/lib/contract';
import { Game } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface Match {
  id: string;
  player1: string;
  player2: string;
  stake: string;
  status: 'open' | 'active' | 'finished' | 'cancelled';
  winner?: string; // Add winner field
}

const MatchList = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { address, walletState } = useWallet();
  const navigate = useNavigate();

  const loadMatches = async () => {
    try {
      setLoading(true);
      const counter = await pingPongContract.getGameIdCounter();
      const gamesList: Match[] = [];

      // Fetch the last 10 games (or fewer if there aren't that many)
      const start = counter > 10n ? counter - 10n : 0n;

      for (let i = start; i < counter; i++) {
        try {
          const game: Game = await pingPongContract.getGame(i.toString());

          let status: Match['status'] = 'open';
          let winner = undefined;

          if (game.isFinished) {
            status = 'finished';
            winner = game.winner; // Store the winner address
          } else if (game.isCancelled) {
            status = 'cancelled';
          } else if (game.player2 !== ethers.ZeroAddress) {
            status = 'active';
          }

          gamesList.push({
            id: i.toString(),
            player1: game.player1,
            player2: game.player2,
            stake: ethers.formatEther(game.stake),
            status,
            winner
          });
        } catch (err) {
          console.error(`Error loading game ${i}:`, err);
        }
      }

      setMatches(gamesList.reverse());
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const shortenAddress = (address: string) => {
    if (!address || address === ethers.ZeroAddress) return 'Open Challenge';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleJoinMatch = (match: Match) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    navigate(`/play/${match.id}?stake=${match.stake}`);
  };

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'open': return 'text-neon-blue';
      case 'active': return 'text-neon-yellow';
      case 'finished': return 'text-neon-green';
      case 'cancelled': return 'text-neon-pink';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 enhanced-glass gradient-border p-8 rounded-xl">
      <div className="flex justify-between items-center pt-2 px-1">
        <h3 className="text-xl font-bold text-gradient">Recent Matches</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadMatches}
          disabled={loading}
          className="enhanced-button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
        </div>
      ) : matches.length === 0 ? (
        <Card className="p-6 text-center text-gray-400">
          No matches found. Create a new match to get started!
        </Card>
      ) : (
        <div className="space-y-5">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900/50 overflow-hidden"
            >
              <div className="flex flex-col w-full md:w-auto md:min-w-[200px]">
                <span className="text-sm text-gray-400 mb-1">Game #{match.id}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium whitespace-nowrap">
                    {shortenAddress(match.player1)}
                    {address && match.player1.toLowerCase() === address.toLowerCase() && (
                      <span className="ml-1 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 mx-1">vs</span>
                  <div className="font-medium whitespace-nowrap">
                    {match.player2 === ethers.ZeroAddress
                      ? 'Open Challenge'
                      : (
                        <>
                          {shortenAddress(match.player2)}
                          {address && match.player2.toLowerCase() === address.toLowerCase() && (
                            <span className="ml-1 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-1 rounded-full">
                              You
                            </span>
                          )}
                        </>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto md:mx-4">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-neon-green font-medium">
                    {match.stake} MON
                  </span>
                  <span className={`px-2 py-0.5 rounded text-sm ${getStatusColor(match.status)}`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                </div>
                {match.status === 'finished' && match.winner && (
                  <div className="text-neon-green text-sm whitespace-nowrap ml-0 md:ml-2">
                    Winner: {shortenAddress(match.winner)}
                    {address && match.winner.toLowerCase() === address.toLowerCase() && (
                      <span className="ml-1 text-xs bg-neon-green/20 text-neon-green py-0.5 px-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end md:min-w-[120px]">
                {walletState === 'connected' && match.status === 'open' &&
                 match.player1 !== address && match.player2.toLowerCase() === address?.toLowerCase() && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-monad hover:bg-monad-600"
                    onClick={() => handleJoinMatch(match)}
                  >
                    Accept Invitation
                  </Button>
                )}

                {walletState === 'connected' && match.status === 'open' &&
                 match.player1 !== address && match.player2.toLowerCase() !== address?.toLowerCase() && (
                  <span className="text-xs text-gray-400 italic">
                    Invitation only
                  </span>
                )}

                {/* Empty placeholder for consistent layout when no action is available */}
                {!(walletState === 'connected' && match.status === 'open' &&
                   match.player1 !== address) && <div className="h-6"></div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchList;
