// Animation utilities for the game

import { playSound } from './sounds';

// Types of animations
export enum AnimationType {
  WIN = 'win',
  LOSE = 'lose',
  SCORE = 'score',
  NFT_MINT = 'nft_mint',
  NFT_BUY = 'nft_buy'
}

// Animation configuration
interface AnimationConfig {
  duration: number;
  className: string;
  sound?: string;
  soundVolume?: number;
}

// Animation configurations
const ANIMATIONS: Record<AnimationType, AnimationConfig> = {
  [AnimationType.WIN]: {
    duration: 3000,
    className: 'victory-animation',
    sound: 'win',
    soundVolume: 0.7
  },
  [AnimationType.LOSE]: {
    duration: 3000,
    className: 'defeat-animation',
    sound: 'lose',
    soundVolume: 0.7
  },
  [AnimationType.SCORE]: {
    duration: 1000,
    className: 'score-animation',
    sound: 'score',
    soundVolume: 0.5
  },
  [AnimationType.NFT_MINT]: {
    duration: 2000,
    className: 'nft-mint-animation',
    sound: 'nftMint',
    soundVolume: 0.6
  },
  [AnimationType.NFT_BUY]: {
    duration: 2000,
    className: 'nft-buy-animation',
    sound: 'nftBuy',
    soundVolume: 0.6
  }
};

// Play animation
export const playAnimation = (
  type: AnimationType,
  element?: HTMLElement | null,
  callback?: () => void
) => {
  const config = ANIMATIONS[type];
  
  // Play sound if configured
  if (config.sound) {
    playSound(config.sound as any, config.soundVolume);
  }
  
  // If no element is provided, just play the sound
  if (!element) {
    if (callback) setTimeout(callback, config.duration);
    return;
  }
  
  // Add animation class
  element.classList.add(config.className);
  
  // Remove class after animation completes
  setTimeout(() => {
    element.classList.remove(config.className);
    if (callback) callback();
  }, config.duration);
};

// Create a particle explosion effect
export const createParticleExplosion = (
  x: number,
  y: number,
  container: HTMLElement,
  count = 30,
  colors = ['#ff2a6d', '#05d9e8', '#d1f7ff', '#7700a6']
) => {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random position offset
    const xOffset = (Math.random() - 0.5) * 10;
    const yOffset = (Math.random() - 0.5) * 10;
    
    // Random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Random size
    const size = Math.random() * 8 + 4;
    
    // Set styles
    particle.style.left = `${x + xOffset}px`;
    particle.style.top = `${y + yOffset}px`;
    particle.style.backgroundColor = color;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Add to container
    container.appendChild(particle);
    
    // Animate
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const duration = Math.random() * 1000 + 500;
    
    // Apply animation
    particle.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
      ],
      {
        duration,
        easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
      }
    );
    
    // Remove particle after animation
    setTimeout(() => {
      if (container.contains(particle)) {
        container.removeChild(particle);
      }
    }, duration);
  }
};

export default {
  playAnimation,
  createParticleExplosion,
  AnimationType
};
