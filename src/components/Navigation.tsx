
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/WalletProvider';
import {
  Menu, X, Home, Gamepad2, Users, Medal, History, Info,
  ChevronDown, Wallet, ExternalLink, ShoppingBag, BarChart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const {
    connect,
    disconnect,
    walletState,
    address,
    balance,
    isCorrectChain,
    switchToMonadTestnet
  } = useWallet();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5 mr-2" /> },
    { name: 'Play vs Bot', path: '/play-bot', icon: <Gamepad2 className="h-5 w-5 mr-2" /> },
    { name: 'Multiplayer', path: '/multiplayer', icon: <Users className="h-5 w-5 mr-2" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Medal className="h-5 w-5 mr-2" /> },
    { name: 'Match History', path: '/history', icon: <History className="h-5 w-5 mr-2" /> },
    { name: 'NFT Marketplace', path: '/nft-marketplace', icon: <ShoppingBag className="h-5 w-5 mr-2" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart className="h-5 w-5 mr-2" /> },
    { name: 'About', path: '/about', icon: <Info className="h-5 w-5 mr-2" /> },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl enhanced-glass border-b border-monad-500/30 px-4 py-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center group">
          <div className="relative overflow-hidden rounded-lg mr-3 gradient-border logo-container">
            <img src="/logo.jpeg" alt="Monad PingPong Logo" className="h-12 w-12 object-cover" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-gradient text-shadow group-hover:animate-pulse transition-all duration-300">MONAD</span>{' '}
            <span className="text-gradient-green text-shadow group-hover:animate-pulse transition-all duration-300">PINGPONG</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 nav-item",
                pathname === item.path
                  ? "enhanced-glass text-white border border-monad-300/30 neon-glow-blue active"
                  : "text-gray-300 hover:bg-monad-500/20 hover:text-white hover:border hover:border-monad-300/20"
              )}
              onClick={closeMenu}
            >
              <span className="flex items-center">
                {item.icon}
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Wallet Connection Button - Desktop */}
        <div className="hidden md:block">
          {walletState === 'connected' ? (
            <div className="flex items-center space-x-2">
              {!isCorrectChain && (
                <Button
                  onClick={switchToMonadTestnet}
                  variant="destructive"
                  size="sm"
                  className="glow-button"
                >
                  Switch to Monad Testnet
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="enhanced-glass enhanced-button text-gradient flex items-center border border-monad-300/30 neon-glow-blue"
                  >
                    <Wallet className="mr-2 h-4 w-4 text-neon-blue" />
                    {shortenAddress(address || '')}
                    <ChevronDown className="ml-2 h-4 w-4 text-neon-pink" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 enhanced-glass gradient-border">
                  <DropdownMenuItem
                    className="flex items-center cursor-pointer"
                    onClick={() => window.open(`https://testnet.monadexplorer.com/address/${address}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Explorer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center cursor-pointer"
                    onClick={disconnect}
                  >
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              onClick={connect}
              className="enhanced-glass enhanced-button gradient-border neon-glow-green text-gradient-green min-w-[160px] px-4 py-2 flex items-center justify-center text-center"
              disabled={walletState === 'connecting' || walletState === 'not-installed'}
            >
              <div className="flex items-center justify-center w-full">
                <Wallet className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{walletState === 'connecting' ? 'Connecting...' : 'Connect Wallet'}</span>
              </div>
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          {walletState === 'connected' && (
            <Button
              variant="outline"
              size="icon"
              className="mr-2 glass-button text-monad-300"
              onClick={() => {}}
            >
              <Wallet className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={toggleMenu}
            className="glass-button text-neon-green"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-game-bg/95 backdrop-blur-xl border-b border-monad-500/20 py-2 px-4 shadow-lg">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex px-3 py-2 rounded-md text-base font-medium transition-colors items-center",
                  pathname === item.path
                    ? "bg-monad-500/30 text-white border border-monad-300/30"
                    : "text-gray-300 hover:bg-monad-500/20 hover:text-white"
                )}
                onClick={closeMenu}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {/* Wallet connection for mobile */}
            {walletState === 'connected' ? (
              <div className="space-y-2 pt-2 border-t border-monad-500/20">
                <div className="px-3 py-2 text-sm">
                  <div className="font-medium text-monad-300">Wallet</div>
                  <div className="text-gray-400">{shortenAddress(address || '')}</div>
                  <div className="text-gray-400">Balance: {parseFloat(balance).toFixed(4)} MON</div>
                </div>
                {!isCorrectChain && (
                  <Button
                    onClick={switchToMonadTestnet}
                    variant="destructive"
                    size="sm"
                    className="mx-3 glow-button"
                  >
                    Switch to Monad Testnet
                  </Button>
                )}
                <Button
                  onClick={disconnect}
                  variant="outline"
                  size="sm"
                  className="mx-3 glass-button"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="px-3 py-2">
                <Button
                  onClick={() => {
                    connect();
                    closeMenu();
                  }}
                  className="w-full glass-button glow-button flex items-center justify-center py-2 text-center"
                  disabled={walletState === 'connecting' || walletState === 'not-installed'}
                >
                  <div className="flex items-center justify-center w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">{walletState === 'connecting' ? 'Connecting...' : 'Connect Wallet'}</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
