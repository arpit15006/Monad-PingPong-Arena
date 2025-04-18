import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [animationStage, setAnimationStage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to trigger animation
  useEffect(() => {
    const handleScroll = () => {
      if (animationStage < 2) {
        setAnimationStage(1);

        // After a delay, complete the animation
        setTimeout(() => {
          setAnimationStage(2);
          setTimeout(onComplete, 1000);
        }, 1500);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Auto-progress after 4 seconds if no scroll
    const timer = setTimeout(() => {
      if (animationStage === 0) {
        setAnimationStage(1);

        setTimeout(() => {
          setAnimationStage(2);
          setTimeout(onComplete, 1000);
        }, 1500);
      }
    }, 4000);

    // Add a subtle animation to encourage scrolling
    const pulseTimer = setInterval(() => {
      if (animationStage === 0) {
        const container = containerRef.current;
        if (container) {
          container.classList.add('pulse-subtle');
          setTimeout(() => {
            container.classList.remove('pulse-subtle');
          }, 500);
        }
      }
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
      clearInterval(pulseTimer);
    };
  }, [animationStage, onComplete]);

  return (
    <AnimatePresence>
      {animationStage < 2 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: animationStage === 1 ? 0.8 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          ref={containerRef}
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 1, y: 0 }}
              animate={{
                scale: animationStage === 1 ? 0.8 : 1,
                y: animationStage === 1 ? -50 : 0
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="relative z-10"
            >
              <img
                src="/mainimg.jpg"
                alt="Monad Ping Pong Arena"
                className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] object-contain splash-logo"
              />

              {/* Animated particles around the logo */}
              <div className="absolute -inset-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-neon-blue rounded-full opacity-70 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.2s' }}></div>
                <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-neon-pink rounded-full opacity-70 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-neon-green rounded-full opacity-70 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
                <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-monad-300 rounded-full opacity-70 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.7s' }}></div>
              </div>
            </motion.div>

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-monad-500/30 via-neon-pink/30 to-monad-500/30 blur-3xl rounded-full"
              initial={{ opacity: 0.5, scale: 1.2 }}
              animate={{
                opacity: animationStage === 1 ? 0.8 : 0.5,
                scale: animationStage === 1 ? 1.5 : 1.2
              }}
              transition={{ duration: 1.5 }}
            />
          </div>

          {animationStage === 0 && (
            <motion.div
              className="absolute bottom-20 text-center text-white text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <p>Scroll down to enter the arena</p>
              <div className="mt-4 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
