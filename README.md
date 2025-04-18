# Monad PingPong Arena

![Monad PingPong Logo](/public/logo.jpeg)

A blockchain-powered ping pong game with NFT integration, built on the Monad testnet for a hackathon submission.

## 🎮 Project Overview

Monad PingPong Arena is a web3 gaming platform that combines classic ping pong gameplay with blockchain technology. Players can compete in single-player mode against a bot or challenge other players in multiplayer matches with cryptocurrency stakes. The game features an NFT marketplace where players can mint, buy, and sell unique paddle NFTs with different attributes that affect gameplay.

## ✨ Key Features

- **Single-player Mode**: Practice against an AI opponent with adjustable difficulty
- **Multiplayer Mode**: Challenge other players to matches with cryptocurrency stakes
- **On-chain Match History**: All match results are recorded on the blockchain
- **NFT Marketplace**: Mint, buy, and sell unique NFTs with on-chain metadata
- **NFT Integration**: Three types of NFTs with different attributes:
- **Paddle NFTs**: Affect gameplay with attributes like power, spin control, and durability
- **Avatar NFTs**: Provide cosmetic and utility features
- **Trail Effect NFTs**: Add visual flair to the game ball
- **Leaderboard**: Track player statistics and rankings
- **Wallet Integration**: Seamless connection with MetaMask wallet

## 🛠️ Technology Stack

### Frontend
- **React + TypeScript**: Core framework for building the UI
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: High-quality UI components
- **HTML5 Canvas**: For rendering the game
- **PeerJS**: For peer-to-peer multiplayer connections
- **Ethers.js**: For blockchain interactions

### Blockchain
- **Monad Testnet**: The blockchain network where the game is deployed
- **Solidity**: Smart contract programming language
- **ERC-721**: Standard for NFT implementation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MetaMask wallet extension


## 🎯 How to Play

1. **Connect Your Wallet**: Click the "Connect Wallet" button in the navigation bar to connect your MetaMask wallet to the Monad testnet.

2. **Single Player Mode**: Select "Play vs Bot" to practice against an AI opponent.

3. **Multiplayer Mode**:
   - Create a new match by specifying an opponent's wallet address and stake amount
   - Or join an existing match that was created for your address
   - Control your paddle with mouse movements
   - First player to reach 5 points wins the match and the staked amount

4. **NFT Marketplace**:
   - Mint new NFTs with unique attributes
   - List your NFTs for sale
   - Browse and purchase NFTs from other players

## 🏆 Game Mechanics

- **Paddle Control**: Move your mouse up and down to control your paddle
- **Scoring**: Score points by getting the ball past your opponent's paddle
- **Match Stakes**: In multiplayer mode, both players stake an equal amount of MONAD Tokens
- **NFT Attributes**: Paddle NFTs affect gameplay mechanics:
- **Power**: Determines ball speed when hit
- **Spin Control**: Affects the angle and curve of the ball
- **Durability**: Determines paddle size and resilience

## 🔗 Smart Contract

The game is powered by a smart contract deployed on the Monad testnet at address:
```
0x88282cc7c75c3726c7e09e73954dc34bff8731dc
```

The contract handles:
- Match creation and joining
- Stake management
- Match result reporting
- NFT minting, listing, and trading
- Player statistics tracking

## 📊 Project Structure

```
monad-pingpong/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── lib/             # Utility functions and types
│   ├── pages/           # Page components
│   ├── providers/       # Context providers
│   ├── styles/          # CSS styles
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── contracts/           # Solidity smart contracts
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## 🎨 UI/UX Features

- **Neon Aesthetic**: Modern, cyberpunk-inspired design with glowing elements
- **Responsive Design**: Adapts to different screen sizes
- **Animated Elements**: Dynamic animations for game events
- **Sound Effects**: Audio feedback for game actions
- **Visual Feedback**: Clear indicators for game state and user actions

## 🔮 Future Roadmap

- **Tournament System**: Organized competitions with prize pools
- **Enhanced NFT Attributes**: More gameplay-affecting properties
- **Mobile Support**: Optimized touch controls for mobile devices
- **Social Features**: Friends list, direct challenges, and chat
- **Achievement System**: Unlock rewards for completing challenges
- **Governance Token**: Community-driven development decisions

## 🙏 Acknowledgments

- The Monad team for providing the blockchain infrastructure
- The React and Vite communities for their excellent tools
- All the testers and early users who provided valuable feedback

---

Built with ❤️ for the Namespacecom hackathon 2025.
