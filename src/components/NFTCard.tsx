import { useState, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ethers } from 'ethers';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import { toast } from 'sonner';
import { NFTAttributes } from '@/lib/types';
import { Shield, Zap, Tag, User, Flame, ShoppingBag } from 'lucide-react';
import { NFTType, Rarity } from '@/lib/types';
import { playSound } from '@/lib/sounds';

interface NFTCardProps {
  tokenId: string | bigint;
  owner: string;
  attributes: NFTAttributes;
  price: string | bigint;
  isOwner: boolean;
  onAction?: () => void;
}

const NFTCard = ({ tokenId, owner, attributes, price, isOwner, onAction }: NFTCardProps) => {
  const { address } = useWallet();
  const [isListing, setIsListing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [listPrice, setListPrice] = useState('0.001');

  const formattedPrice = typeof price === 'bigint'
    ? ethers.formatEther(price)
    : price;

  const isListed = formattedPrice !== '0' && formattedPrice !== '0.0';

  // Reference to the card element for animations
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Price changed:', e.target.value);
    setListPrice(e.target.value || '0.001');
  };

  const handleList = async () => {
    try {
      // Get the price directly from the DOM
      let priceToUse = '0.001'; // Default fallback price

      // Get the input element based on whether we're listing or updating
      const inputId = isListed ? `update-price-input-${tokenId}` : `price-input-${tokenId}`;
      const inputElement = document.getElementById(inputId) as HTMLInputElement;

      if (inputElement && inputElement.value && inputElement.value.trim() !== '') {
        priceToUse = inputElement.value.trim();
        console.log('Got price from DOM input:', priceToUse);
      } else {
        console.log('Using default price:', priceToUse);
      }

      // Replace comma with dot for international formats
      priceToUse = priceToUse.replace(',', '.');

      // Basic validation
      const priceValue = parseFloat(priceToUse);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid positive number');
        return;
      }

      // Play sound and set state
      playSound('buttonClick', 0.4);
      setIsListing(true);

      console.log(`Listing NFT with ID ${tokenId.toString()} for ${priceToUse} MON`);

      // Call contract
      await pingPongContract.listNFT(tokenId.toString(), priceToUse);

      // Success feedback
      playSound('nftMint', 0.5);
      toast.success(`NFT ${isListed ? 'price updated' : 'listed'} for ${priceToUse} MON successfully!`);

      // Reset input fields
      if (inputElement) inputElement.value = '0.001';

      // Refresh NFT data
      if (onAction) onAction();
    } catch (error) {
      console.error('Error in NFT listing process:', error);
      toast.error('Failed to list NFT. Please try again.');
    } finally {
      setIsListing(false);
    }
  };

  const handleBuy = async () => {
    try {
      playSound('buttonClick', 0.4);
      setIsBuying(true);
      await pingPongContract.buyNFT(tokenId.toString(), formattedPrice);
      playSound('nftBuy', 0.7);
      if (onAction) onAction();
    } catch (error) {
      console.error('Error buying NFT:', error);
      toast.error('Failed to buy NFT. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getNFTTypeName = (type: NFTType): string => {
    switch (type) {
      case NFTType.Paddle: return "Paddle";
      case NFTType.Avatar: return "Avatar";
      case NFTType.TrailEffect: return "Trail Effect";
      default: return "Unknown";
    }
  };

  const getRarityName = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.Common: return "Common";
      case Rarity.Uncommon: return "Uncommon";
      case Rarity.Rare: return "Rare";
      case Rarity.Epic: return "Epic";
      case Rarity.Legendary: return "Legendary";
      default: return "Unknown";
    }
  };

  const getRarityColor = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.Common: return "text-gray-400";
      case Rarity.Uncommon: return "text-green-400";
      case Rarity.Rare: return "text-blue-400";
      case Rarity.Epic: return "text-purple-400";
      case Rarity.Legendary: return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const getNFTTypeIcon = (type: NFTType) => {
    switch (type) {
      case NFTType.Paddle: return <Shield className="h-5 w-5 text-neon-blue" />;
      case NFTType.Avatar: return <User className="h-5 w-5 text-neon-pink" />;
      case NFTType.TrailEffect: return <Flame className="h-5 w-5 text-neon-green" />;
      default: return <Shield className="h-5 w-5 text-neon-blue" />;
    }
  };

  return (
    <Card ref={cardRef} className="enhanced-glass gradient-border overflow-hidden nft-card card-hover transition-all relative">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {getNFTTypeIcon(attributes.nftType)}
            <span className="text-gradient text-shadow">
              {getNFTTypeName(attributes.nftType)} #{tokenId.toString()}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${getRarityColor(attributes.rarity)}`}>
              {getRarityName(attributes.rarity)}
            </span>
          </div>
          {isListed && !isOwner && (
            <span className="text-neon-green text-sm font-normal flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              {formattedPrice} MON
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="enhanced-glass rounded-lg p-4 mb-4 border border-monad-500/30 gradient-border">
          <div className="flex justify-center items-center h-32">
            {/* NFT Image Placeholder */}
            <div className="w-24 h-24 bg-gradient-to-br from-monad-500/30 to-neon-pink/30 rounded-full flex items-center justify-center pulse shadow-lg">
              {attributes.nftType === NFTType.Paddle && (
                <div className="text-4xl text-gradient">
                  🏓
                </div>
              )}
              {attributes.nftType === NFTType.Avatar && (
                <div className="text-4xl text-gradient">
                  👤
                </div>
              )}
              {attributes.nftType === NFTType.TrailEffect && (
                <div className="text-4xl text-gradient-green">
                  🔥
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Owner:</span>
            <span className="text-gray-300">{shortenAddress(owner)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Level:</span>
            <span className="text-neon-green">{attributes.level?.toString() || '1'}</span>
          </div>

          {/* Paddle-specific attributes */}
          {attributes.nftType === NFTType.Paddle && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-neon-blue" /> Power:
                </span>
                <span className="text-neon-blue">{attributes.power?.toString() || attributes.strength?.toString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-neon-pink" /> Spin Control:
                </span>
                <span className="text-neon-pink">{attributes.spinControl?.toString() || attributes.speed?.toString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-neon-green" /> Durability:
                </span>
                <span className="text-neon-green">{attributes.durability?.toString() || '10'}</span>
              </div>
            </>
          )}

          {/* Avatar-specific attributes */}
          {attributes.nftType === NFTType.Avatar && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Special Emotes:</span>
                <span className={attributes.hasSpecialEmotes ? "text-neon-green" : "text-gray-500"}>
                  {attributes.hasSpecialEmotes ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">XP Boost:</span>
                <span className={attributes.hasXpBoost ? "text-neon-blue" : "text-gray-500"}>
                  {attributes.hasXpBoost ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Leaderboard Multiplier:</span>
                <span className={attributes.hasLeaderboardMultiplier ? "text-neon-pink" : "text-gray-500"}>
                  {attributes.hasLeaderboardMultiplier ? "Yes" : "No"}
                </span>
              </div>
            </>
          )}

          {/* Trail-specific attributes */}
          {attributes.nftType === NFTType.TrailEffect && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Limited Edition:</span>
                <span className={attributes.isLimitedEdition ? "text-neon-green" : "text-gray-500"}>
                  {attributes.isLimitedEdition ? "Yes" : "No"}
                </span>
              </div>

              {attributes.isLimitedEdition && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Edition:</span>
                  <span className="text-neon-blue">
                    {attributes.editionNumber?.toString() || '1'}/{attributes.totalEditions?.toString() || '100'}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Wins:</span>
            <span className="text-neon-pink">{attributes.winsUsed?.toString() || '0'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {isOwner && !isListed && (
          <div className="w-full space-y-4 p-4 bg-black/30 rounded-md border border-monad-300/20">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">List NFT for Sale</h3>
              <p className="text-sm text-gray-400">Set a price to list this NFT on the marketplace</p>
            </div>

            <div className="flex flex-col">
              <label htmlFor={`price-input-${tokenId}`} className="text-sm text-gray-300 mb-2 font-medium">
                Price in MON:
              </label>

              <div className="flex items-center space-x-2">
                <input
                  id={`price-input-${tokenId}`}
                  type="text"
                  defaultValue="0.001"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #4c4c4c',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
                <span className="text-neon-green font-bold">MON</span>
              </div>
            </div>

            <Button
              onClick={handleList}
              disabled={isListing}
              className="w-full py-6 enhanced-glass enhanced-button gradient-border neon-glow-green mt-4"
            >
              <Tag className="h-5 w-5 mr-2 text-neon-green" />
              <span className="text-gradient-green text-lg font-bold">{isListing ? 'Listing...' : 'List for Sale'}</span>
            </Button>
          </div>
        )}

        {isOwner && isListed && (
          <div className="w-full space-y-4 p-4 bg-black/30 rounded-md border border-monad-300/20">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">Update NFT Price</h3>
              <p className="text-sm text-gray-400">Current price: <span className="text-neon-pink font-medium">{formattedPrice} MON</span></p>
            </div>

            <div className="flex flex-col">
              <label htmlFor={`update-price-input-${tokenId}`} className="text-sm text-gray-300 mb-2 font-medium">
                New price in MON:
              </label>

              <div className="flex items-center space-x-2">
                <input
                  id={`update-price-input-${tokenId}`}
                  type="text"
                  defaultValue="0.001"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #4c4c4c',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
                <span className="text-neon-pink font-bold">MON</span>
              </div>
            </div>

            <Button
              onClick={handleList}
              disabled={isListing}
              className="w-full py-6 enhanced-glass enhanced-button gradient-border neon-glow-pink mt-4"
            >
              <Tag className="h-5 w-5 mr-2 text-neon-pink" />
              <span className="text-gradient text-lg font-bold">{isListing ? 'Updating...' : 'Update Price'}</span>
            </Button>
          </div>
        )}

        {!isOwner && isListed && (
          <Button
            className="w-full py-6 enhanced-glass enhanced-button gradient-border neon-glow-green"
            onClick={handleBuy}
            disabled={isBuying}
          >
            <ShoppingBag className="h-5 w-5 mr-2 text-neon-green" />
            <span className="text-gradient-green text-lg font-bold">{isBuying ? 'Buying...' : `Buy for ${formattedPrice} MON`}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NFTCard;
