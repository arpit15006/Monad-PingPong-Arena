
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import { PlayerStats } from '@/lib/types';
import { Loader2, Trophy, Medal } from 'lucide-react';
import { ethers } from 'ethers';

interface LeaderboardEntry {
  address: string;
  played: bigint;
  won: bigint;
  winRate: number;
}

const Leaderboard = () => {
  const { address } = useWallet();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('Loading leaderboard...');

      // Create mock data for testing UI
      const mockData: LeaderboardEntry[] = [
        {
          address: '0x1234567890123456789012345678901234567890',
          played: 10n,
          won: 8n,
          winRate: 80
        },
        {
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          played: 15n,
          won: 7n,
          winRate: 46
        },
        {
          address: '0x9876543210987654321098765432109876543210',
          played: 5n,
          won: 3n,
          winRate: 60
        }
      ];

      console.log('Setting mock leaderboard data:', mockData);
      setLeaderboard(mockData);

      // Try to get real data in the background
      try {
        console.log('Attempting to fetch real data...');
        // Get top players
        const topAddresses = await pingPongContract.getTopPlayers();
        console.log('Top players addresses:', topAddresses);

        // If we have real players, use them
        if (topAddresses && topAddresses.length > 0) {
          // Get stats for each player
          const entries: LeaderboardEntry[] = await Promise.all(
            topAddresses.map(async (addr: string) => {
              try {
                const stats: PlayerStats = await pingPongContract.getPlayerStats(addr);
                const winRate = stats.played > 0n
                  ? Number((stats.won * 100n) / stats.played)
                  : 0;

                return {
                  address: addr,
                  played: stats.played,
                  won: stats.won,
                  winRate
                };
              } catch (err) {
                console.error(`Error getting stats for ${addr}:`, err);
                return {
                  address: addr,
                  played: 0n,
                  won: 0n,
                  winRate: 0
                };
              }
            })
          );

          // Sort by number of wins (highest first)
          const sortedEntries = entries.sort((a, b) => {
            if (b.won !== a.won) {
              return Number(b.won - a.won);
            }
            // If tied on wins, compare win rate
            return b.winRate - a.winRate;
          });

          console.log('Setting real leaderboard data:', sortedEntries);
          setLeaderboard(sortedEntries);
        } else {
          // Try to get players from match history
          console.log('No players found from getTopPlayers, trying match history...');
          const historyLength = await pingPongContract.getMatchHistoryLength();
          console.log('Match history length:', historyLength.toString());

          if (historyLength > 0n) {
            // Create a Set to store unique player addresses
            const uniquePlayers = new Set<string>();

            // Get the last 20 matches (or fewer if there aren't that many)
            const start = historyLength > 20n ? Number(historyLength) - 20 : 0;
            const end = Number(historyLength);

            for (let i = start; i < end; i++) {
              try {
                const match = await pingPongContract.getMatchResult(i);
                console.log(`Match ${i}:`, match);
                if (match.player1 && match.player1 !== ethers.ZeroAddress) {
                  uniquePlayers.add(match.player1.toLowerCase());
                }
                if (match.player2 && match.player2 !== ethers.ZeroAddress) {
                  uniquePlayers.add(match.player2.toLowerCase());
                }
              } catch (err) {
                console.error(`Error fetching match ${i}:`, err);
              }
            }

            console.log('Players found from match history:', Array.from(uniquePlayers));

            if (uniquePlayers.size > 0) {
              // Get stats for each player from match history
              const entries: LeaderboardEntry[] = await Promise.all(
                Array.from(uniquePlayers).map(async (addr: string) => {
                  try {
                    const stats: PlayerStats = await pingPongContract.getPlayerStats(addr);
                    const winRate = stats.played > 0n
                      ? Number((stats.won * 100n) / stats.played)
                      : 0;

                    return {
                      address: addr,
                      played: stats.played,
                      won: stats.won,
                      winRate
                    };
                  } catch (err) {
                    console.error(`Error getting stats for ${addr}:`, err);
                    return {
                      address: addr,
                      played: 0n,
                      won: 0n,
                      winRate: 0
                    };
                  }
                })
              );

              // Sort by number of wins (highest first)
              const sortedEntries = entries.sort((a, b) => {
                if (b.won !== a.won) {
                  return Number(b.won - a.won);
                }
                // If tied on wins, compare win rate
                return b.winRate - a.winRate;
              });

              console.log('Setting match history leaderboard data:', sortedEntries);
              setLeaderboard(sortedEntries);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching real data:', error);
        // Keep the mock data if real data fails
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address || address === ethers.ZeroAddress) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-gray-400 text-sm font-medium">{index + 1}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-gray-400 mt-2">
          Top Monad Pong players ranked by wins
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {leaderboard.length > 0 ? `${leaderboard.length} players found` : ''}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLeaderboard}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-neon-blue" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No players found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900/70">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Matches</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Wins</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.address}
                  className={`hover:bg-gray-900/30 ${
                    address && entry.address.toLowerCase() === address.toLowerCase()
                      ? 'bg-neon-blue/10'
                      : ''
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {getRankBadge(index)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-white">
                        {shortenAddress(entry.address)}
                        {address && entry.address.toLowerCase() === address.toLowerCase() && (
                          <span className="ml-2 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-2 rounded-full">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-white">
                      {entry.played.toString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-neon-green font-medium">
                      {entry.won.toString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-white">
                      {entry.winRate.toFixed(0)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Debug information */}
      <div className="mt-8 p-4 bg-gray-800/20 rounded-lg text-xs">
        <h3 className="font-medium mb-2 text-gray-400">Debug Information</h3>
        <p className="text-gray-500">Leaderboard entries: {leaderboard.length}</p>
        <p className="text-gray-500">Connected account: {address || 'Not connected'}</p>
        <details className="mt-2">
          <summary className="cursor-pointer hover:text-gray-400 text-gray-500">Raw Leaderboard Data</summary>
          <pre className="mt-2 p-2 bg-gray-900/50 rounded overflow-auto max-h-40 text-gray-400">
            {JSON.stringify(leaderboard, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default Leaderboard;
