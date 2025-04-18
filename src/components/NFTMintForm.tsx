import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useWallet } from '@/providers/WalletProvider';
import pingPongContract from '@/lib/contract';
import { toast } from 'sonner';
import { Shield, Zap, Sparkles, User, Flame } from 'lucide-react';
import { NFTType, PaddleType, AvatarType, TrailType, Rarity } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { playSound } from '@/lib/sounds';
import { playAnimation, AnimationType, createParticleExplosion } from '@/lib/animations';

interface NFTMintFormProps {
  onSuccess?: () => void;
}

const NFTMintForm = ({ onSuccess }: NFTMintFormProps) => {
  const { address } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [nftType, setNftType] = useState<NFTType>(NFTType.Paddle);
  const [tokenURI, setTokenURI] = useState('');

  // Paddle attributes
  const [paddleType, setPaddleType] = useState<PaddleType>(PaddleType.Basic);
  const [paddleRarity, setPaddleRarity] = useState<Rarity>(Rarity.Common);
  const [power, setPower] = useState(50);
  const [spinControl, setSpinControl] = useState(50);
  const [durability, setDurability] = useState(50);

  // Avatar attributes
  const [avatarType, setAvatarType] = useState<AvatarType>(AvatarType.Casual);
  const [avatarRarity, setAvatarRarity] = useState<Rarity>(Rarity.Common);

  // Trail effect attributes
  const [trailType, setTrailType] = useState<TrailType>(TrailType.Fireball);
  const [trailRarity, setTrailRarity] = useState<Rarity>(Rarity.Common);
  const [limitedEdition, setLimitedEdition] = useState(false);
  const [totalEditions, setTotalEditions] = useState(100);

  const getPaddleTypeName = (type: PaddleType): string => {
    switch (type) {
      case PaddleType.Basic: return "Basic Paddle";
      case PaddleType.Power: return "Power Paddle";
      case PaddleType.CurveMaster: return "CurveMaster";
      case PaddleType.Precision: return "Precision Blade";
    }
  };

  const getAvatarTypeName = (type: AvatarType): string => {
    switch (type) {
      case AvatarType.Casual: return "Casual Player";
      case AvatarType.Pro: return "Pro Champion";
      case AvatarType.Robot: return "Robot";
      case AvatarType.Alien: return "Alien";
      case AvatarType.Retro: return "Retro Pong Guy";
    }
  };

  const getTrailTypeName = (type: TrailType): string => {
    switch (type) {
      case TrailType.Fireball: return "Fireball";
      case TrailType.NeonStreak: return "Neon Streak";
      case TrailType.PixelFlame: return "Pixel Flame";
      case TrailType.Frostball: return "Frostball";
    }
  };

  const getRarityName = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.Common: return "Common";
      case Rarity.Uncommon: return "Uncommon";
      case Rarity.Rare: return "Rare";
      case Rarity.Epic: return "Epic";
      case Rarity.Legendary: return "Legendary";
    }
  };

  const getRarityColor = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.Common: return "text-gray-400";
      case Rarity.Uncommon: return "text-green-400";
      case Rarity.Rare: return "text-blue-400";
      case Rarity.Epic: return "text-purple-400";
      case Rarity.Legendary: return "text-yellow-400";
    }
  };

  const getNFTPrice = (nftType: NFTType, rarity: Rarity): string => {
    const basePrices = {
      [NFTType.Paddle]: 0.01,
      [NFTType.Avatar]: 0.01,
      [NFTType.TrailEffect]: 0.005
    };

    const rarityMultipliers = {
      [Rarity.Common]: 1,
      [Rarity.Uncommon]: 2,
      [Rarity.Rare]: 5,
      [Rarity.Epic]: 10,
      [Rarity.Legendary]: 20
    };

    return (basePrices[nftType] * rarityMultipliers[rarity]).toFixed(3);
  };

  // Reference to the form container for animations
  const formRef = useRef<HTMLDivElement>(null);

  const handleMint = async () => {
    if (!address) {
      toast.error('Please connect your wallet to mint an NFT');
      return;
    }

    // Default tokenURI if not provided
    const finalTokenURI = tokenURI || `https://monad-pong.example/metadata/${Date.now()}`;

    try {
      setIsMinting(true);

      // Play button click sound
      playSound('buttonClick', 0.4);

      let tx;

      // Get the price based on NFT type and rarity (for display only)
      const price = getNFTPrice(nftType, nftType === NFTType.Paddle ? paddleRarity : nftType === NFTType.Avatar ? avatarRarity : trailRarity);
      console.log(`Minting NFT with estimated value: ${price} MON (free for hackathon demo)`);

      // Different minting logic based on NFT type
      if (nftType === NFTType.Paddle) {
        console.log(`Minting Paddle NFT: ${getPaddleTypeName(paddleType)}, Rarity: ${getRarityName(paddleRarity)}`);
        console.log(`Attributes - Power: ${power}, Spin Control: ${spinControl}, Durability: ${durability}`);

        // Use the regular mintNFT function (free for hackathon demo)
        tx = await pingPongContract.mintNFT(finalTokenURI, power, spinControl);
      }
      else if (nftType === NFTType.Avatar) {
        console.log(`Minting Avatar NFT: ${getAvatarTypeName(avatarType)}, Rarity: ${getRarityName(avatarRarity)}`);

        // For avatars, we'll use different attribute values
        const avatarPower = 30 + (avatarRarity * 10); // Base value + rarity bonus
        const avatarSpeed = 40 + (avatarRarity * 10); // Base value + rarity bonus

        // Use the regular mintNFT function (free for hackathon demo)
        tx = await pingPongContract.mintNFT(finalTokenURI, avatarPower, avatarSpeed);
      }
      else if (nftType === NFTType.TrailEffect) {
        console.log(`Minting Trail Effect NFT: ${getTrailTypeName(trailType)}, Rarity: ${getRarityName(trailRarity)}`);
        console.log(`Limited Edition: ${limitedEdition}, Total Editions: ${limitedEdition ? totalEditions : 'Unlimited'}`);

        // For trail effects, we'll use different attribute values
        const trailPower = 20 + (trailRarity * 5); // Lower base value + smaller rarity bonus
        const trailSpeed = 60 + (trailRarity * 8); // Higher base value + different rarity bonus

        // Use the regular mintNFT function (free for hackathon demo)
        tx = await pingPongContract.mintNFT(finalTokenURI, trailPower, trailSpeed);
      }

      console.log('Mint transaction sent:', tx.hash);

      // Play NFT mint sound and animation
      playSound('nftMint', 0.7);

      // Animation removed

      toast.success('NFT minted successfully!');

      // Reset form
      resetForm();

      // Wait a moment before refreshing to allow blockchain to update
      setTimeout(() => {
        if (onSuccess) {
          // Call onSuccess to refresh NFTs and switch to marketplace tab
          onSuccess();

          // Show a toast encouraging the user to list their NFT
          toast.info("Your NFT has been minted! You can now list it for sale in the marketplace.");
        }
      }, 2000);
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error(`Failed to mint NFT: ${error.message || 'Unknown error'}`);
    } finally {
      setIsMinting(false);
    }
  };

  const resetForm = () => {
    setTokenURI('');

    // Reset paddle attributes
    setPaddleType(PaddleType.Basic);
    setPaddleRarity(Rarity.Common);
    setPower(50);
    setSpinControl(50);
    setDurability(50);

    // Reset avatar attributes
    setAvatarType(AvatarType.Casual);
    setAvatarRarity(Rarity.Common);

    // Reset trail effect attributes
    setTrailType(TrailType.Fireball);
    setTrailRarity(Rarity.Common);
    setLimitedEdition(false);
    setTotalEditions(100);
  };

  return (
    <div ref={formRef} className="glass p-6 rounded-lg border border-monad-500/30 relative overflow-hidden">
      <Tabs defaultValue="paddle" onValueChange={(value) => setNftType(value === "paddle" ? NFTType.Paddle : value === "avatar" ? NFTType.Avatar : NFTType.TrailEffect)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="paddle" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Paddle
          </TabsTrigger>
          <TabsTrigger value="avatar" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Avatar
          </TabsTrigger>
          <TabsTrigger value="trail" className="flex items-center gap-2">
            <Flame className="h-4 w-4" /> Trail Effect
          </TabsTrigger>
        </TabsList>

        {/* Paddle NFT Form */}
        <TabsContent value="paddle" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-monad-300 glow-text">Paddle NFT</h3>
            <span className={`px-2 py-1 rounded text-sm ${getRarityColor(paddleRarity)}`}>
              {getRarityName(paddleRarity)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paddle Type</Label>
              <Select value={paddleType.toString()} onValueChange={(value) => setPaddleType(parseInt(value))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select paddle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaddleType.Basic.toString()}>{getPaddleTypeName(PaddleType.Basic)}</SelectItem>
                  <SelectItem value={PaddleType.Power.toString()}>{getPaddleTypeName(PaddleType.Power)}</SelectItem>
                  <SelectItem value={PaddleType.CurveMaster.toString()}>{getPaddleTypeName(PaddleType.CurveMaster)}</SelectItem>
                  <SelectItem value={PaddleType.Precision.toString()}>{getPaddleTypeName(PaddleType.Precision)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={paddleRarity.toString()} onValueChange={(value) => setPaddleRarity(parseInt(value))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Rarity.Common.toString()}>{getRarityName(Rarity.Common)}</SelectItem>
                  <SelectItem value={Rarity.Uncommon.toString()}>{getRarityName(Rarity.Uncommon)}</SelectItem>
                  <SelectItem value={Rarity.Rare.toString()}>{getRarityName(Rarity.Rare)}</SelectItem>
                  <SelectItem value={Rarity.Epic.toString()}>{getRarityName(Rarity.Epic)}</SelectItem>
                  <SelectItem value={Rarity.Legendary.toString()}>{getRarityName(Rarity.Legendary)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-neon-blue" /> Power
                </Label>
                <span className="text-neon-blue">{power}</span>
              </div>
              <Slider
                value={[power]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => setPower(value[0])}
                className="[&>span]:bg-neon-blue"
              />
              <p className="text-xs text-gray-400">Impacts ball speed on return</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-neon-pink" /> Spin Control
                </Label>
                <span className="text-neon-pink">{spinControl}</span>
              </div>
              <Slider
                value={[spinControl]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => setSpinControl(value[0])}
                className="[&>span]:bg-neon-pink"
              />
              <p className="text-xs text-gray-400">Affects ball curvature</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-neon-green" /> Durability
                </Label>
                <span className="text-neon-green">{durability}</span>
              </div>
              <Slider
                value={[durability]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => setDurability(value[0])}
                className="[&>span]:bg-neon-green"
              />
              <p className="text-xs text-gray-400">How many matches before needing repair</p>
            </div>
          </div>
        </TabsContent>

        {/* Avatar NFT Form */}
        <TabsContent value="avatar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-monad-300 glow-text">Avatar NFT</h3>
            <span className={`px-2 py-1 rounded text-sm ${getRarityColor(avatarRarity)}`}>
              {getRarityName(avatarRarity)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Avatar Type</Label>
              <Select value={avatarType.toString()} onValueChange={(value) => setAvatarType(parseInt(value))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select avatar type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AvatarType.Casual.toString()}>{getAvatarTypeName(AvatarType.Casual)}</SelectItem>
                  <SelectItem value={AvatarType.Pro.toString()}>{getAvatarTypeName(AvatarType.Pro)}</SelectItem>
                  <SelectItem value={AvatarType.Robot.toString()}>{getAvatarTypeName(AvatarType.Robot)}</SelectItem>
                  <SelectItem value={AvatarType.Alien.toString()}>{getAvatarTypeName(AvatarType.Alien)}</SelectItem>
                  <SelectItem value={AvatarType.Retro.toString()}>{getAvatarTypeName(AvatarType.Retro)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={avatarRarity.toString()} onValueChange={(value) => setAvatarRarity(parseInt(value))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Rarity.Common.toString()}>{getRarityName(Rarity.Common)}</SelectItem>
                  <SelectItem value={Rarity.Uncommon.toString()}>{getRarityName(Rarity.Uncommon)}</SelectItem>
                  <SelectItem value={Rarity.Rare.toString()}>{getRarityName(Rarity.Rare)}</SelectItem>
                  <SelectItem value={Rarity.Epic.toString()}>{getRarityName(Rarity.Epic)}</SelectItem>
                  <SelectItem value={Rarity.Legendary.toString()}>{getRarityName(Rarity.Legendary)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 p-4 bg-gray-800/30 rounded-md">
              <h4 className="font-medium">Avatar Features</h4>
              <ul className="space-y-2 mt-2">
                <li className="flex items-center gap-2">
                  <div className={avatarRarity >= Rarity.Uncommon ? "text-neon-green" : "text-gray-500"}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className={avatarRarity >= Rarity.Uncommon ? "text-white" : "text-gray-500"}>Special Emotes</span>
                  {avatarRarity >= Rarity.Uncommon && <span className="ml-auto text-xs text-neon-green">Included</span>}
                </li>
                <li className="flex items-center gap-2">
                  <div className={avatarRarity >= Rarity.Rare ? "text-neon-blue" : "text-gray-500"}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className={avatarRarity >= Rarity.Rare ? "text-white" : "text-gray-500"}>XP Boost</span>
                  {avatarRarity >= Rarity.Rare && <span className="ml-auto text-xs text-neon-blue">Included</span>}
                </li>
                <li className="flex items-center gap-2">
                  <div className={avatarRarity >= Rarity.Epic ? "text-neon-pink" : "text-gray-500"}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className={avatarRarity >= Rarity.Epic ? "text-white" : "text-gray-500"}>Leaderboard Multiplier</span>
                  {avatarRarity >= Rarity.Epic && <span className="ml-auto text-xs text-neon-pink">Included</span>}
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* Trail Effect NFT Form */}
        <TabsContent value="trail" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-monad-300 glow-text">Trail Effect NFT</h3>
            <span className={`px-2 py-1 rounded text-sm ${getRarityColor(trailRarity)}`}>
              {getRarityName(trailRarity)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Effect Type</Label>
              <Select value={trailType.toString()} onValueChange={(value) => setTrailType(parseInt(value))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select effect type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TrailType.Fireball.toString()}>{getTrailTypeName(TrailType.Fireball)}</SelectItem>
                  <SelectItem value={TrailType.NeonStreak.toString()}>{getTrailTypeName(TrailType.NeonStreak)}</SelectItem>
                  <SelectItem value={TrailType.PixelFlame.toString()}>{getTrailTypeName(TrailType.PixelFlame)}</SelectItem>
                  <SelectItem value={TrailType.Frostball.toString()}>{getTrailTypeName(TrailType.Frostball)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={trailRarity.toString()} onValueChange={(value) => setTrailRarity(parseInt(value))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Rarity.Common.toString()}>{getRarityName(Rarity.Common)}</SelectItem>
                  <SelectItem value={Rarity.Uncommon.toString()}>{getRarityName(Rarity.Uncommon)}</SelectItem>
                  <SelectItem value={Rarity.Rare.toString()}>{getRarityName(Rarity.Rare)}</SelectItem>
                  <SelectItem value={Rarity.Epic.toString()}>{getRarityName(Rarity.Epic)}</SelectItem>
                  <SelectItem value={Rarity.Legendary.toString()}>{getRarityName(Rarity.Legendary)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="limitedEdition"
                checked={limitedEdition}
                onChange={(e) => setLimitedEdition(e.target.checked)}
                className="rounded text-neon-blue focus:ring-neon-blue"
              />
              <Label htmlFor="limitedEdition" className="cursor-pointer">Limited Edition</Label>
            </div>

            {limitedEdition && (
              <div className="space-y-2">
                <Label htmlFor="totalEditions">Total Editions</Label>
                <Input
                  id="totalEditions"
                  type="number"
                  min="1"
                  max="1000"
                  value={totalEditions}
                  onChange={(e) => setTotalEditions(parseInt(e.target.value))}
                  className="glass-input"
                />
              </div>
            )}

            <div className="p-4 bg-gray-800/30 rounded-md">
              <p className="text-sm text-gray-300">
                Trail effects are purely cosmetic but highly desirable. They add visual flair to your gameplay without affecting game mechanics.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2 mt-6">
        <Label htmlFor="tokenURI">Token URI (Optional)</Label>
        <Input
          id="tokenURI"
          value={tokenURI}
          onChange={(e) => setTokenURI(e.target.value)}
          placeholder="https://example.com/metadata.json"
          className="glass-input"
        />
        <p className="text-xs text-gray-400">
          Leave blank to use a default URI. This will be used for the NFT's metadata.
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Estimated Value</span>
          <span className="text-lg font-bold text-neon-green">
            {getNFTPrice(nftType, nftType === NFTType.Paddle ? paddleRarity : nftType === NFTType.Avatar ? avatarRarity : trailRarity)} MON
          </span>
        </div>
        <div className="p-2 bg-yellow-900/30 border border-yellow-600/30 rounded-md mb-4">
          <p className="text-xs text-yellow-300 italic">
            <strong>Hackathon Note:</strong> For this demo, NFT minting is free. In the production version, each NFT would cost the displayed amount.
          </p>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Higher rarity NFTs have better attributes and features, making them more valuable for trading and gameplay.
        </p>

        <Button
          onClick={handleMint}
          disabled={isMinting}
          className="w-full enhanced-glass enhanced-button gradient-border neon-glow-green"
        >
          {isMinting ? 'Minting...' : 'Mint NFT (Free Demo)'}
        </Button>
      </div>
    </div>
  );
};

export default NFTMintForm;
