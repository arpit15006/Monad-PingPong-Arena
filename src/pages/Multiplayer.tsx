import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import MatchList from '@/components/MatchList';
import { Loader2 } from 'lucide-react';

const Multiplayer = () => {
  const navigate = useNavigate();
  const { address, walletState, isCorrectChain, switchToMonadTestnet, connect } = useWallet();

  // Create match state
  const [opponentAddress, setOpponentAddress] = useState('');
  const [stake, setStake] = useState('0.01');
  const [isCreating, setIsCreating] = useState(false);

  // Join match state
  const [gameId, setGameId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Clear input on tab change
  useEffect(() => {
    // Reset inputs when user connects wallet
    if (walletState === 'connected') {
      setOpponentAddress('');
      setGameId('');
    }
  }, [walletState]);

  // Validate address
  const isValidAddress = (address: string) => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  const handleCreateMatch = async () => {
    if (walletState !== 'connected') {
      toast.error('Please connect your wallet to create a match');
      return;
    }

    if (!isCorrectChain) {
      switchToMonadTestnet();
      return;
    }

    if (!opponentAddress) {
      toast.error('Please enter an opponent address');
      return;
    }

    if (!isValidAddress(opponentAddress)) {
      toast.error('Please enter a valid Monad address');
      return;
    }

    // Check if opponent address is the same as the user's address
    if (opponentAddress.toLowerCase() === address?.toLowerCase()) {
      toast.error("You can't play against yourself");
      return;
    }

    try {
      setIsCreating(true);
      const gameId = await pingPongContract.createMatch(opponentAddress, stake);

      // Navigate to the game page
      toast.success(`Match created successfully! Game ID: ${gameId}`);
      navigate(`/play/${gameId}?stake=${stake}`);
    } catch (error: any) {
      console.error('Error creating match:', error);
      toast.error(error.message || 'Failed to create match. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMatch = async () => {
    if (walletState !== 'connected') {
      toast.error('Please connect your wallet to join a match');
      return;
    }

    if (!isCorrectChain) {
      switchToMonadTestnet();
      return;
    }

    if (!gameId) {
      toast.error('Please enter a game ID');
      return;
    }

    try {
      setIsJoining(true);

      // Get game details to check stake amount
      const gameDetails = await pingPongContract.getGame(gameId);
      console.log('Game details:', {
        player1: gameDetails.player1,
        player2: gameDetails.player2,
        stake: ethers.formatEther(gameDetails.stake),
        isFinished: gameDetails.isFinished,
        isCancelled: gameDetails.isCancelled
      });

      // Check if the user is the creator of the match
      if (gameDetails.player1.toLowerCase() === address?.toLowerCase()) {
        toast.error('You created this match, you cannot join it.');
        setIsJoining(false);
        return;
      }

      // Check if the match is cancelled
      if (gameDetails.isCancelled) {
        toast.error('This match has been cancelled.');
        setIsJoining(false);
        return;
      }

      // Check if the match is finished
      if (gameDetails.isFinished) {
        toast.error('This match has already finished.');
        setIsJoining(false);
        return;
      }

      // Check if the current user is the invited player2
      if (gameDetails.player2.toLowerCase() !== address?.toLowerCase()) {
        toast.error('You are not the invited player for this match.');
        setIsJoining(false);
        return;
      }

      const stakeAmount = ethers.formatEther(gameDetails.stake);

      // Join the match
      await pingPongContract.joinMatch(gameId, stakeAmount);

      // Navigate to the game page
      navigate(`/play/${gameId}?stake=${stakeAmount}`);
    } catch (error: any) {
      console.error('Error joining match:', error);
      toast.error(error.message || 'Failed to join match. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold glow-text text-monad-300">Multiplayer</h1>
        <p className="text-gray-400 mt-2 neon-text">
          Create or join matches against other players
        </p>
      </div>

      {walletState !== 'connected' ? (
        <div className="max-w-md mx-auto glass-card p-6 text-center space-y-4">
          <p className="text-gray-300">
            Please connect your wallet to access multiplayer features
          </p>
          <Button
            className="bg-monad hover:bg-monad-600"
            onClick={connect}
          >
            Connect Wallet
          </Button>
        </div>
      ) : !isCorrectChain ? (
        <div className="max-w-md mx-auto glass-card p-6 text-center space-y-4">
          <p className="text-gray-300 neon-text">
            Please switch to the Monad testnet to access multiplayer features
          </p>
          <Button
            className="bg-monad hover:bg-monad-600"
            onClick={switchToMonadTestnet}
          >
            Switch to Monad Testnet
          </Button>
        </div>
      ) : (
        <>
          <Tabs defaultValue="create" className="max-w-3xl mx-auto">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="create">Create Match</TabsTrigger>
              <TabsTrigger value="join">Join Match</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <div className="glass-card p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Opponent Address</label>
                  <Input
                    value={opponentAddress}
                    onChange={(e) => setOpponentAddress(e.target.value)}
                    placeholder="0x..."
                    className="bg-gray-950"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the Monad address of the player you want to challenge
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stake Amount (MON)</label>
                  <Select
                    value={stake}
                    onValueChange={setStake}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stake amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.01">0.01 MON</SelectItem>
                      <SelectItem value="0.1">0.1 MON</SelectItem>
                      <SelectItem value="0.5">0.5 MON</SelectItem>
                      <SelectItem value="1">1 MON</SelectItem>
                      <SelectItem value="5">5 MON</SelectItem>
                      <SelectItem value="10">10 MON</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Amount of MON tokens to stake on this match. Winner takes all.
                  </p>
                </div>

                <Button
                  className="w-full glass-button glow-button"
                  onClick={handleCreateMatch}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Match...</>
                  ) : (
                    'Create Match'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="join" className="mt-6">
              <div className="glass-card p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game ID</label>
                  <Input
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    placeholder="Enter game ID"
                    className="bg-gray-950"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the ID of the game you want to join
                  </p>
                </div>

                <Button
                  className="w-full bg-neon-pink hover:bg-neon-pink/80"
                  onClick={handleJoinMatch}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining Match...</>
                  ) : (
                    'Join Match'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="max-w-4xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">Open Matches</h2>
            <MatchList />
          </div>
        </>
      )}
    </div>
  );
};

export default Multiplayer;
