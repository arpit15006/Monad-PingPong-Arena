import { useWallet } from '@/providers/WalletProvider';
import DashboardComponent from '@/components/Dashboard';

const Dashboard = () => {
  const { walletState, connect, isCorrectChain, switchToMonadTestnet } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold glow-text text-monad-300">Game Analytics</h1>
        <p className="text-gray-400 mt-2 neon-text">
          Real-time statistics and insights from the Ping Pong Arena
        </p>
      </div>

      {walletState !== 'connected' ? (
        <div className="glass p-8 text-center">
          <p className="text-gray-300 mb-4">Connect your wallet to view game analytics</p>
          <button
            onClick={connect}
            className="glass-button glow-button px-4 py-2 rounded-md"
          >
            Connect Wallet
          </button>
        </div>
      ) : !isCorrectChain ? (
        <div className="glass p-8 text-center">
          <p className="text-gray-300 mb-4">Please switch to the Monad Testnet to view game analytics</p>
          <button
            onClick={switchToMonadTestnet}
            className="glass-button glow-button px-4 py-2 rounded-md"
          >
            Switch to Monad Testnet
          </button>
        </div>
      ) : (
        <DashboardComponent />
      )}
    </div>
  );
};

export default Dashboard;
