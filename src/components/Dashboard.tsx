import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Users, Award, ShoppingBag } from 'lucide-react';
import pingPongContract from '@/lib/contract';
import { useWallet } from '@/providers/WalletProvider';
import { ethers } from 'ethers';
import { playSound } from '@/lib/sounds';
import { playAnimation, AnimationType, createParticleExplosion } from '@/lib/animations';

const Dashboard = () => {
  const { address } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPlayers: 0,
    totalNFTs: 0,
    totalVolume: 0,
    recentMatches: [],
    topPlayers: []
  });

  // References for animation effects
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);

        // Get total games played
        const matchHistory = await pingPongContract.getMatchHistory();

        // Get total NFTs minted (estimate based on highest token ID)
        const nftCount = await estimateNFTCount();

        // Get trading volume (simplified estimate)
        const volume = await estimateTradingVolume();

        // Get unique players
        const uniquePlayers = getUniquePlayers(matchHistory);

        // Get top players
        const topPlayers = getTopPlayers(matchHistory);

        setStats({
          totalGames: matchHistory.length,
          totalPlayers: uniquePlayers.length,
          totalNFTs: nftCount,
          totalVolume: volume,
          recentMatches: matchHistory.slice(0, 5),
          topPlayers: topPlayers.slice(0, 5)
        });

        // Play sound and animation when data is loaded
        playSound('matchStart', 0.3);

        // Animation removed
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [address]);

  // Helper function to estimate NFT count
  const estimateNFTCount = async () => {
    try {
      // This is a simplified approach - in a production app, you'd track this more accurately
      let count = 0;
      const maxToCheck = 20;

      for (let i = 1; i <= maxToCheck; i++) {
        try {
          await pingPongContract.readOnlyContract.ownerOf(i);
          count++;
        } catch (error) {
          // Token doesn't exist, continue
        }
      }

      return count;
    } catch (error) {
      console.error('Error estimating NFT count:', error);
      return 0;
    }
  };

  // Helper function to estimate trading volume
  const estimateTradingVolume = async () => {
    try {
      // In a real app, you'd track this from events
      // For the hackathon, we'll return a simulated value
      return Math.floor(Math.random() * 10) + 5; // 5-15 MON
    } catch (error) {
      console.error('Error estimating trading volume:', error);
      return 0;
    }
  };

  // Helper function to get unique players
  const getUniquePlayers = (matches) => {
    const players = new Set();

    matches.forEach(match => {
      if (match.player1 !== ethers.ZeroAddress) players.add(match.player1);
      if (match.player2 !== ethers.ZeroAddress) players.add(match.player2);
    });

    return Array.from(players);
  };

  // Helper function to get top players
  const getTopPlayers = (matches) => {
    const playerWins = {};

    matches.forEach(match => {
      if (match.winner !== ethers.ZeroAddress) {
        playerWins[match.winner] = (playerWins[match.winner] || 0) + 1;
      }
    });

    return Object.entries(playerWins)
      .map(([address, wins]) => ({ address, wins }))
      .sort((a, b) => b.wins - a.wins);
  };

  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-monad-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        <Card className="glass border-monad-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-monad-300 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-neon-blue" />
              Total Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neon-blue">{stats.totalGames}</p>
          </CardContent>
        </Card>

        <Card className="glass border-monad-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-monad-300 flex items-center">
              <Users className="h-5 w-5 mr-2 text-neon-pink" />
              Unique Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neon-pink">{stats.totalPlayers}</p>
          </CardContent>
        </Card>

        <Card className="glass border-monad-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-monad-300 flex items-center">
              <Award className="h-5 w-5 mr-2 text-neon-green" />
              NFTs Minted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neon-green">{stats.totalNFTs}</p>
          </CardContent>
        </Card>

        <Card className="glass border-monad-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-monad-300 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-yellow-400" />
              Trading Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-400">{stats.totalVolume} MON</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full" ref={tabsRef} onValueChange={(value) => {
        // Play sound when changing tabs
        playSound('buttonClick', 0.2);
      }}>
        <TabsList className="glass w-full mb-6">
          <TabsTrigger value="recent" className="flex-1">Recent Matches</TabsTrigger>
          <TabsTrigger value="top" className="flex-1">Top Players</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card className="glass border-monad-500/30">
            <CardHeader>
              <CardTitle className="text-monad-300">Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentMatches.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No matches played yet</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentMatches.map((match, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-monad-500/20 pb-2">
                      <div className="flex-1">
                        <p className="text-neon-blue">{shortenAddress(match.player1)}</p>
                      </div>
                      <div className="flex-none px-4">
                        <span className="text-gray-400">vs</span>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-neon-pink">{shortenAddress(match.player2)}</p>
                      </div>
                      <div className="flex-none ml-4">
                        <p className="text-neon-green">
                          {match.winner === match.player1 ? "P1 Won" : "P2 Won"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top">
          <Card className="glass border-monad-500/30">
            <CardHeader>
              <CardTitle className="text-monad-300">Top Players</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topPlayers.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No players ranked yet</p>
              ) : (
                <div className="space-y-4">
                  {stats.topPlayers.map((player, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-monad-500/20 pb-2">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-monad-300 mr-4">{index + 1}</span>
                        <p className="text-neon-blue">{shortenAddress(player.address)}</p>
                      </div>
                      <div>
                        <p className="text-neon-green">{player.wins} Wins</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
