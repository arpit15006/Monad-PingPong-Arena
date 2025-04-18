export type WalletState = 'disconnected' | 'connecting' | 'connected' | 'not-installed';

export interface Game {
  player1: string;
  player2: string;
  stake: bigint;
  winner: string;
  isFinished: boolean;
  isCancelled: boolean;
}

export interface MatchResult {
  gameId: bigint;
  player1: string;
  player2: string;
  winner: string;
  stake: bigint;
  timestamp: bigint;
}

export interface PlayerStats {
  played: bigint;
  won: bigint;
}

export interface GameState {
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  paddle1Y: number;
  paddle2Y: number;
  score1: number;
  score2: number;
  gameOver: boolean;
  winner: 1 | 2 | null;
  timestamp?: number;
}

export interface GameProps {
  opponent?: string;
  gameId?: string;
  isMultiplayer?: boolean;
  isPeerConnected?: boolean;
  botSpeed?: number;
  gameStarted?: boolean;
  onGameEnd?: (winner: 1 | 2) => void;
  isHost?: boolean;
}

export interface PeerData {
  type: 'paddle' | 'ball' | 'score' | 'gameOver' | 'heartbeat';
  data: any;
  timestamp: number;
}

export type PeerConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export enum NFTType {
  Paddle = 0,
  Avatar = 1,
  TrailEffect = 2
}

export enum PaddleType {
  Basic = 0,
  Power = 1,
  CurveMaster = 2,
  Precision = 3
}

export enum AvatarType {
  Casual = 0,
  Pro = 1,
  Robot = 2,
  Alien = 3,
  Retro = 4
}

export enum TrailType {
  Fireball = 0,
  NeonStreak = 1,
  PixelFlame = 2,
  Frostball = 3
}

export enum Rarity {
  Common = 0,
  Uncommon = 1,
  Rare = 2,
  Epic = 3,
  Legendary = 4
}

export interface NFTAttributes {
  // Base attributes
  nftType: NFTType;
  typeId: number;
  rarity: Rarity;
  level: bigint;
  xp: bigint;
  winsUsed: bigint;

  // Paddle-specific attributes
  power?: bigint;
  spinControl?: bigint;
  durability?: bigint;
  upgradeLevel?: bigint;

  // Avatar-specific attributes
  hasSpecialEmotes?: boolean;
  hasXpBoost?: boolean;
  hasLeaderboardMultiplier?: boolean;

  // Trail-specific attributes
  editionNumber?: bigint;
  totalEditions?: bigint;
  isLimitedEdition?: boolean;
}

export interface NFTListing {
  tokenId: bigint;
  price: bigint;
  owner: string;
  attributes: NFTAttributes;
  customURI?: string;
  ownerHistory?: string[];
}
