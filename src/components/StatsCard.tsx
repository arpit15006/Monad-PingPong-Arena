
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import { PlayerStats } from '@/lib/types';

interface StatsCardProps {
  playerAddress?: string;
  showPersonalStats?: boolean;
}

const StatsCard = ({ playerAddress, showPersonalStats = true }: StatsCardProps) => {
  const { address } = useWallet();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlayerStats>({ played: 0n, won: 0n });

  useEffect(() => {
    const fetchStats = async () => {
      if (!playerAddress && (!address || !showPersonalStats)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const addressToFetch = playerAddress || address;
        if (addressToFetch) {
          const playerStats = await pingPongContract.getPlayerStats(addressToFetch);
          setStats(playerStats);
        }
      } catch (error) {
        console.error('Error fetching player stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [address, playerAddress, showPersonalStats]);

  const winRate = stats.played > 0n
    ? Number((stats.won * 100n) / stats.played)
    : 0;

  return (
    <Card className="bg-gray-900/50 h-full flex flex-col enhanced-glass gradient-border">
      <CardHeader className="pb-4 pt-6">
        <CardTitle className="text-xl text-center text-gradient">
          {playerAddress ? 'Player Stats' : 'Your Stats'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center px-6 pb-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !address && !playerAddress && showPersonalStats ? (
          <div className="text-center text-gray-400 py-8">
            Connect your wallet to view stats
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8 py-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-neon-blue">
                {stats.played.toString()}
              </span>
              <span className="text-sm text-gray-400 mt-2">Games</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-neon-green">
                {stats.won.toString()}
              </span>
              <span className="text-sm text-gray-400 mt-2">Wins</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-neon-yellow">
                {winRate.toFixed(0)}%
              </span>
              <span className="text-sm text-gray-400 mt-2">Win Rate</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
