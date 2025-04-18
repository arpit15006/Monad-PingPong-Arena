
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, Award, Code, Box, User, Heart, ShoppingBag, Shield } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12 mb-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold glow-text text-monad-300">About Monad PingPong Arena</h1>
        <p className="text-gray-400 mt-2">
          A blockchain-based ping pong game on the Monad testnet
        </p>
      </div>

      {/* Overview */}
      <section className="max-w-3xl mx-auto glass p-8">
        <h2 className="text-2xl font-bold mb-4 text-neon-blue">Overview</h2>
        <p className="text-gray-300">
          Monad PingPong Arena is a blockchain-integrated ping pong game built on the Monad testnet.
          It combines the classic arcade game with Web3 functionality, allowing players to create matches,
          stake MON tokens, and compete for rewards. The game is fully decentralized, with all match results
          and player statistics stored on the blockchain.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto glass p-8">
        <h2 className="text-2xl font-bold mb-6 text-neon-blue">Key Features</h2>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-blue/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-blue glow-button">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Blockchain Integration</h3>
              <p className="text-gray-300">
                Full integration with the Monad testnet blockchain. Create matches, stake tokens,
                and record game results directly on-chain.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-pink/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-pink glow-button">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Multiplayer Gameplay</h3>
              <p className="text-gray-300">
                Challenge other players to matches with custom stake amounts. Compete in
                real-time matches and climb the global leaderboard.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-green/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-green glow-button">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Smart Contract Powered</h3>
              <p className="text-gray-300">
                The game is powered by a smart contract on the Monad testnet, ensuring
                fair gameplay, transparent match history, and secure token staking.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-blue/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-blue glow-button">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">NFT Marketplace</h3>
              <p className="text-gray-300">
                Mint, buy, and sell unique Ping Pong paddle NFTs with different attributes that
                can enhance your gameplay. Each NFT has unique strength and speed properties.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 bg-neon-pink/20 w-12 h-12 rounded-full flex items-center justify-center text-neon-pink glow-button">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">On-Chain Ownership</h3>
              <p className="text-gray-300">
                True ownership of your in-game assets through NFTs. Your paddle NFTs are stored on the
                blockchain, giving you complete control and the ability to trade them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="max-w-3xl mx-auto glass p-8">
        <h2 className="text-2xl font-bold mb-4 text-neon-blue">Technology</h2>
        <p className="text-gray-300 mb-4">
          Monad PingPong Arena is built with modern web technologies and blockchain integration:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
          <li>React + Vite for the frontend framework</li>
          <li>Tailwind CSS for styling and dark mode support</li>
          <li>HTML5 Canvas for smooth, animated gameplay</li>
          <li>Ethers.js for blockchain interactions</li>
          <li>PeerJS for multiplayer peer-to-peer connections</li>
          <li>ERC-721 standard for NFT implementation</li>
          <li>Smart contract deployed on the Monad testnet</li>
        </ul>
      </section>

      {/* Smart Contract */}
      <section className="max-w-3xl mx-auto glass p-8">
        <h2 className="text-2xl font-bold mb-4 text-neon-blue">Smart Contract</h2>
        <p className="text-gray-300 mb-4">
          The game is powered by a smart contract deployed on the Monad testnet.
          The contract handles match creation, token staking, result reporting, and player statistics.
        </p>
        <div className="bg-gray-900/50 p-4 rounded-md font-mono text-sm my-4 break-all border border-monad-500/30">
          Contract Address: 0x88282cc7c75c3726c7e09e73954dc34bff8731dc
        </div>
        <p className="text-gray-300 mt-4 mb-6">
          Smart contract features include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-300 pl-4">
          <li>Creating and joining matches with token stakes</li>
          <li>Reporting match results with winner declaration</li>
          <li>Automatic reward distribution to winners</li>
          <li>Match history tracking and leaderboard functionality</li>
          <li>NFT minting with customizable attributes (strength, speed)</li>
          <li>NFT marketplace for buying and selling paddles</li>
          <li>On-chain metadata storage for NFT attributes</li>
        </ul>
        <div className="mt-6">
          <a
            href="https://testnet.monadexplorer.com/address/0x88282cc7c75c3726c7e09e73954dc34bff8731dc"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-neon-blue hover:underline"
          >
            View contract on Monad Explorer <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* About the Developer */}
      <section className="max-w-3xl mx-auto glass p-8">
        <h2 className="text-2xl font-bold mb-4 text-neon-blue">About the Developer</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-monad-500/20 border-2 border-monad-300/40
                        flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(74,54,236,0.3)]">
            <User className="w-16 h-16 text-monad-300" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-bold glow-text text-monad-300">Hello, I'm Arpit Patel!</h3>
            <p className="text-gray-300">
              I'm a passionate developer with a strong interest in blockchain technology, gaming,
              and creating innovative digital experiences. I've always loved gaming, and combining
              that passion with the cutting-edge potential of blockchain has been a dream project for me.
            </p>
            <p className="text-gray-300">
              I wanted to build something that blends fun gameplay with the power of decentralized systems,
              and Monad Ping Pong is the result of that vision.
            </p>
            <p className="text-gray-300">
              This game is not just about playing ping pong — it's about exploring new possibilities in gaming,
              including true ownership of in-game assets, transparent competition, and fair rewards.
              Throughout this project, I've worked hard to ensure that players have a seamless,
              enjoyable experience while interacting with blockchain technology in a way that feels
              natural and exciting.
            </p>
            <p className="text-gray-300">
              I hope you enjoy the game as much as I enjoyed building it, and I look forward to seeing
              you on the leaderboard!
            </p>
            <div className="flex justify-start mt-2">
              <Button variant="outline" size="sm" className="glass-button" asChild>
                <a href="https://www.linkedin.com/in/arpit-kumar-patel-260238324" target="_blank" rel="noreferrer">
                  <Heart className="h-4 w-4 mr-2 text-neon-pink" /> Connect with me
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto">
        <div className="glass-card p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-3 glow-text text-monad-300">Ready to Play?</h2>
            <p className="text-gray-300 mb-6">
              Try your skills in the Monad PingPong Arena and compete for rewards on the blockchain.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="glass-button glow-button">
                <Link to="/play-bot">Play vs Bot</Link>
              </Button>
              <Button asChild className="glass-button glow-button">
                <Link to="/multiplayer">Multiplayer</Link>
              </Button>
              <Button asChild variant="outline" className="glass-button">
                <Link to="/leaderboard">View Leaderboard</Link>
              </Button>
              <Button asChild variant="outline" className="glass-button bg-neon-blue/10 border-neon-blue/30 text-neon-blue">
                <Link to="/nft-marketplace">NFT Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto text-center text-gray-500 text-sm py-6 border-t border-monad-500/20">
        <p>
          Monad PingPong Arena © 2025 | Built for the Monad Blockchain | Built by Arpit Patel |
        </p>
        <div className="flex justify-center mt-2">
          <a
            href="https://github.com/arpit15006/Monad-PingPong-Arena.git"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-monad-300 transition-colors"
          >
            <Github className="h-4 w-4" /> Source Code
          </a>
        </div>
      </footer>
    </div>
  );
};

export default About;
