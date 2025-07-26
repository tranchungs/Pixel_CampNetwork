# 🎮 Pixel Game

**Collaborative Multiplayer Pixel Art on Blockchain**

A revolutionary gaming experience that combines real-time collaborative pixel art creation with strategic combat mechanics and NFT minting, built on Camp Network blockchain.

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-Play_Now-brightgreen)](https://pixel-camp-network.vercel.app/)
[![Documentation]](https://pixel-game-campnetwork.gitbook.io/pixel-game-campnetwork-docs/)
[![Video Demo](https://www.youtube.com/watch?v=4C6m8BbEcEo)](#)

## 🎯 Overview

Pixel Game transforms simple pixel placement into a rich, multi-layered entertainment experience where creativity meets strategy, community meets competition, and gaming moments become valuable digital assets.

### ✨ Key Features

- 🎨 **Real-Time Collaborative Canvas** - 500x500 shared pixel canvas with instant synchronization
- ⚔️ **Strategic Combat System** - Purchase and deploy bombs (💣) and rockets (🚀)
- 💎 **NFT Minting** - Mint canvas areas as permanent blockchain collectibles
- 🖼️ **Template System** - Upload images to trace complex artwork
- 🎯 **Daily Rewards** - Claim daily bonuses and build your arsenal
- 📱 **Cross-Platform** - Seamless experience on mobile and desktop

## 🚀 Live Demo

**🎮 Play Now:** https://pixel-camp-network.vercel.app/

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **react-together** (Multisynq) for real-time collaboration
- **Tailwind CSS** for styling
- **Canvas API** for optimized rendering

### Blockchain

- **Camp Network** (Basecamp testnet)
- **Camp Origin SDK** for Web3 integration
- **Solidity** smart contracts
- **Viem & Wagmi** for blockchain interactions

### Infrastructure

- **Vercel** for deployment
- **GitHub** for version control
- **GitBook** for documentation

## 🎮 How to Play

### 1. **Connect Wallet**

- Click the Camp Network modal to connect your wallet
- Supports Camp Network's authentication system

### 2. **Choose Your Mode**

- **On-chain**: Permanent blockchain transactions
- **Off-chain**: Fast, free experimentation

### 3. **Start Creating**

- Select colors from 60+ vibrant palette
- Click pixels to place your art
- Watch real-time collaboration unfold

### 4. **Strategic Combat**

- Purchase bombs (💣) and rockets (🚀)
- Deploy weapons to clear areas
- Create explosive visual effects

### 5. **Mint NFTs**

- Select canvas areas using camera tool (📸)
- Mint your favorite moments as permanent NFTs
- Own your collaborative achievements forever

## 🏗️ Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Camp Network wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/pixel-game.git
cd pixel-game

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Camp Network RPC and contract addresses

# Start development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_CAMP_NETWORK_RPC=https://rpc.camp-network-testnet.gelato.digital
NEXT_PUBLIC_CONTRACT_ADDRESS=0x40C1c12be203d7F439960B8E7D0e56239e46913f
```

## 📄 Smart Contract

### Contract Address

**Basecamp Testnet:** `0x40C1c12be203d7F439960B8E7D0e56239e46913f`

### Key Functions

```solidity
// Pixel placement
function placePixel(uint256 x, uint256 y, string color) external

// Weapon system
function buyBomb() external payable
function buyRocket() external payable
function bombArea(uint256 centerX, uint256 centerY, uint256 radius) external
function fireRocket(uint256 centerX, uint256 centerY, uint256 radius) external

// NFT minting
function mintNFT(string memory tokenURI) external returns (uint256)

// Daily rewards
function claimDaily() external payable
function canClaimToday(address user) external view returns (bool)
```

## 🎥 Demo Video

[📺 Watch the full demo on YouTube](#)

_See Pixel Game in action - from collaborative art creation to strategic combat and NFT minting!_

## 📚 Documentation

**Complete Documentation:** https://pixel-game-campnetwork.gitbook.io/pixel-game-campnetwork-docs/

- [Getting Started](https://pixel-game-campnetwork.gitbook.io/pixel-game-campnetwork-docs/getting-started)
- [Features Overview](https://pixel-game-campnetwork.gitbook.io/pixel-game-campnetwork-docs/features)
- [For Developers](https://pixel-game-campnetwork.gitbook.io/pixel-game-campnetwork-docs/others/for-developers)
