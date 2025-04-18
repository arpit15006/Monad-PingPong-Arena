
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useWallet } from '@/providers/WalletProvider';
import { Gamepad2, Users, ChevronRight, ShoppingBag } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import MatchList from '@/components/MatchList';

const Index = () => {
  const { walletState } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 mb-20">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 pt-10 pb-16 relative">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="bg-particle floating" style={{ width: '200px', height: '200px', top: '10%', left: '10%', animationDelay: '0s' }}></div>
          <div className="bg-particle floating" style={{ width: '150px', height: '150px', top: '60%', right: '10%', animationDelay: '0.5s' }}></div>
          <div className="bg-particle floating" style={{ width: '100px', height: '100px', bottom: '20%', left: '20%', animationDelay: '1s' }}></div>
        </div>

        <div className="relative">
          <h1 className="text-5xl md:text-7xl font-bold max-w-3xl leading-tight">
            <span className="text-gradient text-shadow">MONAD </span>
            <span className="text-gradient-green text-shadow">PINGPONG </span>
            <span className="text-white text-shadow">ARENA</span>
          </h1>
          <div className="absolute -inset-4 bg-gradient-to-r from-monad-500/20 via-neon-pink/20 to-monad-500/20 blur-3xl -z-10 rounded-full pulse"></div>
        </div>

        <p className="text-xl text-gray-300 max-w-2xl">
          The classic arcade game reimagined on the Monad blockchain.
          Challenge other players, win rewards, and climb the leaderboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
          <Link to="/play-bot" className="transform transition-transform hover:scale-105">
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-2 enhanced-glass enhanced-button gradient-border neon-glow-blue h-16 text-lg"
            >
              <Gamepad2 className="h-5 w-5 text-neon-blue" /> <span className="text-gradient">Play vs Bot</span>
            </Button>
          </Link>

          <Link to="/multiplayer" className="transform transition-transform hover:scale-105">
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-2 enhanced-glass enhanced-button gradient-border neon-glow-pink h-16 text-lg"
            >
              <Users className="h-5 w-5 text-neon-pink" /> <span className="text-gradient-green">Multiplayer</span>
            </Button>
          </Link>
        </div>

        {walletState !== 'connected' && (
          <p className="text-sm text-gray-400 max-w-lg">
            * Connect your wallet to access multiplayer features and earn rewards
          </p>
        )}
      </section>

      {/* Game Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="enhanced-glass gradient-border p-8 py-10 relative overflow-hidden group card-hover neon-glow-blue">
          <div className="h-12 w-12 rounded-full bg-neon-blue/20 flex items-center justify-center mb-5 pulse gradient-border">
            <Gamepad2 className="h-5 w-5 text-neon-blue" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-gradient">Blockchain Gaming</h3>
          <p className="text-gray-300 text-sm px-1">
            Play PingPong on the Monad blockchain. Create matches, stake MON tokens, and compete for rewards.
          </p>
          <div className="absolute inset-0 bg-gradient-to-r from-monad-500/0 via-monad-500/5 to-monad-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>

        <div className="enhanced-glass gradient-border p-8 py-10 relative overflow-hidden group card-hover neon-glow-pink">
          <div className="h-12 w-12 rounded-full bg-neon-pink/20 flex items-center justify-center mb-5 pulse gradient-border">
            <Users className="h-5 w-5 text-neon-pink" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-gradient-pink">Challenge Players</h3>
          <p className="text-gray-300 text-sm px-1">
            Create custom matches against specific players or open challenges for anyone to join.
          </p>
          <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/0 via-neon-pink/5 to-neon-pink/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>

        <div className="enhanced-glass gradient-border p-8 py-10 relative overflow-hidden group card-hover neon-glow-green">
          <div className="h-12 w-12 rounded-full bg-neon-green/20 flex items-center justify-center mb-5 pulse gradient-border">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-neon-green">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
              <path d="M12 18V6"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2 text-gradient-green">Win Rewards</h3>
          <p className="text-gray-300 text-sm px-1">
            Stake MON tokens on matches and earn rewards for winning. Track your stats and earnings.
          </p>
          <div className="absolute inset-0 bg-gradient-to-r from-neon-green/0 via-neon-green/5 to-neon-green/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>

        <div className="enhanced-glass gradient-border p-8 py-10 relative overflow-hidden group card-hover neon-glow-blue">
          <div className="h-12 w-12 rounded-full bg-monad-300/20 flex items-center justify-center mb-5 pulse gradient-border">
            <ShoppingBag className="h-5 w-5 text-monad-300" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-gradient">NFT Marketplace</h3>
          <p className="text-gray-300 text-sm px-1">
            Mint, buy, and sell unique Ping Pong paddle NFTs with different strength and speed attributes.
          </p>
          <div className="absolute inset-0 bg-gradient-to-r from-monad-300/0 via-monad-300/5 to-monad-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>
      </section>

      {/* Stats Card - Centered */}
      <section className="mt-16 mb-8">
        <div className="max-w-md mx-auto">
          <StatsCard />
        </div>
      </section>

      {/* Recent Matches - Centered */}
      <section className="mb-24">
        <div className="max-w-3xl mx-auto">
          <MatchList />
        </div>
      </section>

      {/* How to Play */}
      <section className="max-w-3xl mx-auto enhanced-glass gradient-border p-10 relative overflow-hidden mt-24">
        <h2 className="text-3xl font-bold mb-6 text-center text-gradient text-shadow">How to Play</h2>

        <div className="space-y-8 px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-monad-500/20 w-12 h-12 rounded-full flex items-center justify-center text-monad-300 font-bold text-lg pulse gradient-border">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Connect Your Wallet</h3>
              <p className="text-gray-300">
                Connect your MetaMask wallet to the Monad testnet to access all game features.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-pink/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-pink font-bold text-lg pulse gradient-border">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Create or Join a Match</h3>
              <p className="text-gray-300">
                Create a new match by staking MON tokens or join an existing open challenge.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-green/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-green font-bold text-lg pulse gradient-border">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Play and Win</h3>
              <p className="text-gray-300">
                Use your mouse or touch to control your paddle. First to 5 points wins the match and the staked tokens.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-monad-300/20 w-12 h-12 rounded-full flex items-center justify-center text-monad-300 font-bold text-lg pulse gradient-border">
              4
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Collect NFTs</h3>
              <p className="text-gray-300">
                Mint unique paddle NFTs with different attributes. Trade them in the marketplace to build your collection.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-10 mb-2">
          <Link to="/about">
            <Button variant="link" className="text-gradient enhanced-glass enhanced-button gradient-border px-4 py-2 rounded-full">
              Learn more about the game <ChevronRight className="h-4 w-4 ml-1 text-neon-pink" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
