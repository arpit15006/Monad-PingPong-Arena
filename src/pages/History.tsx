
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import { MatchResult } from '@/lib/types';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';

const History = () => {
  const { address } = useWallet();
  const [loading, setLoading] = useState(true);
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  const loadMatchHistory = async () => {
    try {
      setLoading(true);

      // Get total number of matches
      const historyLength = await pingPongContract.getMatchHistoryLength();
      setTotalMatches(Number(historyLength));

      // Calculate pagination
      const totalPages = Math.ceil(Number(historyLength) / matchesPerPage);
      const startIndex = Math.max(0, Number(historyLength) - currentPage * matchesPerPage);
      const endIndex = Math.max(0, Number(historyLength) - (currentPage - 1) * matchesPerPage);

      // Fetch match results
      const matches: MatchResult[] = [];

      for (let i = startIndex; i < endIndex; i++) {
        try {
          const match = await pingPongContract.getMatchResult(i);
          matches.push(match);
        } catch (error) {
          console.error(`Error fetching match ${i}:`, error);
        }
      }

      setMatchHistory(matches.reverse());
    } catch (error) {
      console.error('Error loading match history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchHistory();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const shortenAddress = (address: string) => {
    if (!address || address === ethers.ZeroAddress) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const totalPages = Math.ceil(totalMatches / matchesPerPage);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Match History</h1>
        <p className="text-gray-400 mt-2">
          View all completed matches on the blockchain
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={loadMatchHistory}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-neon-blue" />
        </div>
      ) : matchHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No match history found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900/70">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Game ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player 1</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player 2</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Winner</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Stake</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {matchHistory.map((match) => (
                  <tr
                    key={match.gameId.toString()}
                    className={`hover:bg-gray-900/30 ${
                      address &&
                      (match.player1.toLowerCase() === address.toLowerCase() ||
                       match.player2.toLowerCase() === address.toLowerCase())
                        ? 'bg-gray-900/50'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {match.gameId.toString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {shortenAddress(match.player1)}
                        {address && match.player1.toLowerCase() === address.toLowerCase() && (
                          <span className="ml-1 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-2 rounded-full">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {shortenAddress(match.player2)}
                        {address && match.player2.toLowerCase() === address.toLowerCase() && (
                          <span className="ml-1 text-xs bg-neon-blue/20 text-neon-blue py-0.5 px-2 rounded-full">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        address && match.winner.toLowerCase() === address.toLowerCase()
                          ? 'text-neon-green font-medium'
                          : ''
                      }`}>
                        {shortenAddress(match.winner)}
                        {address && match.winner.toLowerCase() === address.toLowerCase() && (
                          <span className="ml-1 text-xs bg-neon-green/20 text-neon-green py-0.5 px-2 rounded-full">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-neon-green font-medium">
                        {ethers.formatEther(match.stake)} MON
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-300">
                        {formatTimestamp(match.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>

                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
