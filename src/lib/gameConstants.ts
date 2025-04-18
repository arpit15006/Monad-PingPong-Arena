// Game canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// Paddle dimensions and effects
export const PADDLE_WIDTH = 15;
export const PADDLE_HEIGHT = 100;
export const PADDLE_DEPTH = 25; // Increased for better 3D effect
export const PADDLE_PERSPECTIVE = 0.4; // Controls the 3D perspective effect (increased)
export const PADDLE_SHADOW_BLUR = 25; // Increased shadow blur
export const PADDLE_GLOW_INTENSITY = 0.7; // Controls the glow intensity

// Ball properties
export const BALL_RADIUS = 12; // Slightly larger ball
export const BALL_SHADOW_BLUR = 20; // Increased shadow blur
export const BALL_TRAIL_LENGTH = 5; // Number of trail segments
export const BALL_TRAIL_OPACITY = 0.4; // Opacity of the trail

// Game mechanics
export const WINNING_SCORE = 5;
export const BALL_SPEED_INCREMENT = 0.05; // Speed increases by 5% each hit
export const MAX_BALL_SPEED = 15;

// Network settings
export const NETWORK_SYNC_INTERVAL = 16; // ms between network updates
export const MIN_DELTA_FOR_SYNC = 0.5; // Minimum paddle movement to sync

// Table design
export const TABLE_GRID_SIZE = 40; // Size of grid cells
export const TABLE_GRID_OPACITY = 0.1; // Opacity of grid lines
export const TABLE_CENTER_LINE_WIDTH = 3; // Width of center line
export const TABLE_CENTER_LINE_DASH = [10, 15]; // Dash pattern for center line
export const TABLE_BORDER_WIDTH = 5; // Width of table border
export const TABLE_BORDER_RADIUS = 15; // Rounded corners for the table

// Colors
export const COLORS = {
  background: '#0A1128', // Darker blue background
  gridLines: '#FFFFFF',
  centerLine: 'rgba(255, 255, 255, 0.4)',
  tableBorder: 'rgba(59, 130, 246, 0.3)', // Blue border
  
  // Player 1 (left) colors
  paddle1Main: '#3B82F6', // Blue
  paddle1Light: '#60A5FA', // Light blue
  paddle1Dark: '#1D4ED8', // Dark blue
  paddle1Glow: 'rgba(59, 130, 246, 0.7)', // Blue glow
  
  // Player 2 (right) colors
  paddle2Main: '#EC4899', // Pink
  paddle2Light: '#F472B6', // Light pink
  paddle2Dark: '#BE185D', // Dark pink
  paddle2Glow: 'rgba(236, 72, 153, 0.7)', // Pink glow
  
  // Ball colors
  ballGradient1: '#EC4899', // Pink
  ballGradient2: '#BE185D', // Dark pink
  ballGlow: 'rgba(236, 72, 153, 0.7)', // Pink glow
  
  // Score and text colors
  scoreText: 'rgba(255, 255, 255, 0.2)',
  playerText: 'rgba(255, 255, 255, 0.8)',
  gameOverOverlay: 'rgba(0, 0, 0, 0.8)',
  gameOverText: '#FFFFFF',
};
