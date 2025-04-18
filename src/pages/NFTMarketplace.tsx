import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import NFTMintForm from '@/components/NFTMintForm';
import NFTCard from '@/components/NFTCard';
import { NFTListing } from '@/lib/types';
import { Loader2, RefreshCw } from 'lucide-react';

const NFTMarketplace = () => {
  console.log('Rendering NFTMarketplace component');
  const { address, walletState, connect, isCorrectChain, switchToMonadTestnet } = useWallet();
  const [ownedNFTs, setOwnedNFTs] = useState<any[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTListing[]>([]);
  const [isLoadingOwned, setIsLoadingOwned] = useState(false);
  const [isLoadingListed, setIsLoadingListed] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadOwnedNFTs = async () => {
    if (!address) return;

    try {
      setIsLoadingOwned(true);
      console.log('Loading owned NFTs for address:', address);
      const nfts = await pingPongContract.getOwnedNFTs(address);
      console.log('Owned NFTs:', nfts);
      console.log('Number of owned NFTs found:', nfts.length);

      if (nfts.length === 0) {
        console.log('No owned NFTs found. This could be because:');
        console.log('1. You haven\'t minted any NFTs yet');
        console.log('2. Your NFTs have token IDs higher than the search range');
        console.log('3. There was an error communicating with the blockchain');
      }

      setOwnedNFTs(nfts);
    } catch (error) {
      console.error('Error loading owned NFTs:', error);
    } finally {
      setIsLoadingOwned(false);
    }
  };

  const loadListedNFTs = async () => {
    try {
      setIsLoadingListed(true);
      console.log('Loading listed NFTs');
      const nfts = await pingPongContract.getAllListedNFTs();
      console.log('Listed NFTs:', nfts);
      console.log('Number of listed NFTs found:', nfts.length);

      if (nfts.length === 0) {
        console.log('No listed NFTs found. This could be because:');
        console.log('1. No NFTs have been listed for sale yet');
        console.log('2. Listed NFTs have token IDs higher than the search range');
        console.log('3. There was an error communicating with the blockchain');
      }

      setListedNFTs(nfts);
    } catch (error) {
      console.error('Error loading listed NFTs:', error);
    } finally {
      setIsLoadingListed(false);
    }
  };

  // Function to refresh both owned and listed NFTs
  const refreshAllNFTs = async () => {
    // Clear the cache to force a fresh load
    if (pingPongContract.clearCache) {
      pingPongContract.clearCache();
    }

    // First load listed NFTs, then owned NFTs to ensure proper order
    await loadListedNFTs();
    await loadOwnedNFTs();

    // Set default tab to marketplace to show listed NFTs
    setActiveTab('marketplace');
  };

  // Track active tab
  const [activeTab, setActiveTab] = useState('mint');

  useEffect(() => {
    console.log('NFTMarketplace component mounted');
    console.log('Wallet state:', walletState);
    console.log('Is correct chain:', isCorrectChain);
    console.log('Address:', address);

    // Clear the cache to ensure fresh data
    if (pingPongContract.clearCache) {
      console.log('Clearing NFT cache on component mount');
      pingPongContract.clearCache();
    }

    if (walletState === 'connected' && isCorrectChain) {
      console.log('Loading NFTs...');
      loadOwnedNFTs();
      loadListedNFTs();
    }

    // Return cleanup function
    return () => {
      console.log('NFTMarketplace component unmounted');
    };
  }, [walletState, isCorrectChain, address]);

  const handleRefresh = () => {
    refreshAllNFTs();
  };

  const isOwner = (nftOwner: string) => {
    return address && nftOwner.toLowerCase() === address.toLowerCase();
  };

  // Simple error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by error handler:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass p-8 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong</h2>
          <p className="text-gray-300 mb-4">There was an error loading the NFT Marketplace</p>
          <Button onClick={() => setHasError(false)} className="glass-button glow-button">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold glow-text text-monad-300">NFT Marketplace</h1>
        <p className="text-gray-400 mt-2 neon-text">
          Mint, buy, and sell Ping Pong paddle NFTs with unique attributes
        </p>
      </div>

      {walletState !== 'connected' ? (
        <div className="glass p-8 text-center">
          <p className="text-gray-300 mb-4">Connect your wallet to access the NFT marketplace</p>
          <button
            onClick={connect}
            className="glass-button glow-button px-4 py-2 rounded-md"
          >
            Connect Wallet
          </button>
        </div>
      ) : !isCorrectChain ? (
        <div className="glass p-8 text-center">
          <p className="text-gray-300 mb-4">Please switch to the Monad Testnet to access the NFT marketplace</p>
          <button
            onClick={switchToMonadTestnet}
            className="glass-button glow-button px-4 py-2 rounded-md"
          >
            Switch to Monad Testnet
          </button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass w-full mb-6">
            <TabsTrigger value="marketplace" className="flex-1">Marketplace</TabsTrigger>
            <TabsTrigger value="my-nfts" className="flex-1">My NFTs</TabsTrigger>
            <TabsTrigger value="mint" className="flex-1">Mint NFT</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neon-blue">Available NFTs</h2>
              <Button
                variant="outline"
                size="sm"
                className="glass-button"
                onClick={loadListedNFTs}
                disabled={isLoadingListed}
              >
                {isLoadingListed ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>

            {isLoadingListed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass overflow-hidden border-monad-500/30 rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-monad-500/20 rounded mb-4 w-3/4"></div>
                    <div className="h-32 bg-monad-500/10 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-monad-500/20 rounded w-full"></div>
                      <div className="h-4 bg-monad-500/20 rounded w-3/4"></div>
                      <div className="h-4 bg-monad-500/20 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listedNFTs.length === 0 ? (
              <div className="glass p-8 text-center">
                <p className="text-gray-300">No NFTs are currently listed for sale</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listedNFTs.map((nft) => (
                  <NFTCard
                    key={nft.tokenId.toString()}
                    tokenId={nft.tokenId}
                    owner={nft.owner}
                    attributes={nft.attributes}
                    price={nft.price}
                    isOwner={isOwner(nft.owner)}
                    onAction={handleRefresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-nfts" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neon-pink">My NFTs</h2>
              <Button
                variant="outline"
                size="sm"
                className="glass-button"
                onClick={loadOwnedNFTs}
                disabled={isLoadingOwned}
              >
                {isLoadingOwned ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>

            {isLoadingOwned ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass overflow-hidden border-monad-500/30 rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-monad-500/20 rounded mb-4 w-3/4"></div>
                    <div className="h-32 bg-monad-500/10 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-monad-500/20 rounded w-full"></div>
                      <div className="h-4 bg-monad-500/20 rounded w-3/4"></div>
                      <div className="h-4 bg-monad-500/20 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ownedNFTs.length === 0 ? (
              <div className="glass p-8 text-center">
                <p className="text-gray-300">You don't own any NFTs yet</p>
                <p className="text-gray-400 mt-2">Mint your first NFT or buy one from the marketplace</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedNFTs.map((nft) => (
                  <NFTCard
                    key={nft.tokenId.toString()}
                    tokenId={nft.tokenId}
                    owner={nft.owner}
                    attributes={nft.attributes}
                    price={nft.price}
                    isOwner={true}
                    onAction={handleRefresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mint" className="space-y-6">
            <div className="max-w-md mx-auto">
              <NFTMintForm onSuccess={handleRefresh} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default NFTMarketplace;
