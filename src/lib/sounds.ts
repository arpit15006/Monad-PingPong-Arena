// Sound effects utility for the game

// Define sound URLs
const SOUND_URLS = {
  paddleHit: '/sounds/paddle-hit.mp3',
  wallHit: '/sounds/wall-hit.mp3',
  score: '/sounds/score.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  buttonClick: '/sounds/button-click.mp3',
  nftMint: '/sounds/nft-mint.mp3',
  nftBuy: '/sounds/nft-buy.mp3',
  matchStart: '/sounds/match-start.mp3',
  matchJoin: '/sounds/match-join.mp3'
};

// Preload sounds
const soundCache: Record<string, HTMLAudioElement> = {};

// Initialize sounds
export const initSounds = () => {
  Object.entries(SOUND_URLS).forEach(([key, url]) => {
    try {
      const audio = new Audio(url);
      audio.preload = 'auto';
      soundCache[key] = audio;
      
      // Load the audio file
      audio.load();
      
      // Mute initially to allow autoplay on some browsers
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(e => {
        // Ignore autoplay errors - will work on user interaction
        console.log(`Sound preload note: ${e.message}`);
      });
    } catch (error) {
      console.error(`Failed to load sound: ${url}`, error);
    }
  });
};

// Sound settings
let soundEnabled = true;

// Play a sound
export const playSound = (soundName: keyof typeof SOUND_URLS, volume = 1.0) => {
  if (!soundEnabled) return;
  
  try {
    const sound = soundCache[soundName];
    if (sound) {
      // Create a clone to allow overlapping sounds
      const soundClone = sound.cloneNode() as HTMLAudioElement;
      soundClone.volume = volume;
      soundClone.play().catch(e => {
        console.warn(`Could not play sound ${soundName}: ${e.message}`);
      });
    }
  } catch (error) {
    console.error(`Error playing sound ${soundName}:`, error);
  }
};

// Toggle sound on/off
export const toggleSound = () => {
  soundEnabled = !soundEnabled;
  return soundEnabled;
};

// Get sound state
export const isSoundEnabled = () => soundEnabled;

// Initialize sounds on module load
initSounds();

export default {
  playSound,
  toggleSound,
  isSoundEnabled
};
