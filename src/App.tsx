import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/providers/WalletProvider";
import Navigation from "@/components/Navigation";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import PlayBot from "./pages/PlayBot";
import Multiplayer from "./pages/Multiplayer";
import Leaderboard from "./pages/Leaderboard";
import History from "./pages/History";
import About from "./pages/About";
import Play from "./pages/Play";
import NFTMarketplace from "./pages/NFTMarketplace";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [navVisible, setNavVisible] = useState(false);
  
  // Hide splash screen after animation completes
  const handleSplashComplete = () => {
    setShowSplash(false);
    setNavVisible(true);
    // Reset scroll position
    window.scrollTo(0, 0);
  };
  
  // Prevent scrolling when splash screen is active
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSplash]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <WalletProvider>
          <BrowserRouter>
            {/* Splash Screen */}
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

            <div className="min-h-screen flex flex-col relative">
              {/* Animated Background */}
              <div className="animated-bg">
                {/* Background Particles */}
                <div className="bg-particle" style={{ width: '300px', height: '300px', top: '10%', left: '5%' }}></div>
                <div className="bg-particle" style={{ width: '200px', height: '200px', top: '60%', right: '10%' }}></div>
                <div className="bg-particle" style={{ width: '150px', height: '150px', top: '30%', right: '20%' }}></div>
                <div className="bg-particle" style={{ width: '250px', height: '250px', bottom: '10%', left: '15%' }}></div>
              </div>

              {/* Navigation - only show after splash screen */}
              {navVisible && <Navigation />}

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/play-bot" element={<PlayBot />} />
                  <Route path="/multiplayer" element={<Multiplayer />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/nft-marketplace" element={<NFTMarketplace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/play/:id" element={<Play />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>

                {/* Footer - only show after splash screen */}
                {navVisible && (
                  <footer className="text-center py-6 text-gray-400 text-sm relative overflow-hidden">
                    <div className="gradient-border enhanced-glass py-4 px-6 mx-auto max-w-md rounded-full">
                      <span className="text-gradient">© 2025 Monad Ping Pong</span> | <span className="text-gradient-green">Built on Monad Testnet</span>
                    </div>
                  </footer>
                )}
              </main>
            </div>
          </BrowserRouter>
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
