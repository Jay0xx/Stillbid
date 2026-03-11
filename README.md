# Stillbid

**Bid. Win. Own.**

Stillbid is a minimal, high-performance Live NFT Auction House built on the **Somnia** blockchain. It leverages Somnia's millisecond block times and reactivity layer to provide a seamless, real-time bidding experience.

## ✨ Features

- **Live On-Chain Auctions**: Real-time bidding with millisecond precision.
- **Stillbid Branding**: A calm, minimal, and premium design language.
- **Mint & List**: Create your own NFTs and put them up for auction in a single transaction flow.
- **Reactive Settlement**: Automated cross-chain verification and settlement triggers.
- **Dashboard**: Track your active auctions and bidding history.
- **Responsive UI**: Built with React, Tailwind CSS, and Lucide Icons.

## 🛠️ Technology Stack

- **Blockchain**: Somnia Testnet (Chain ID: 50312)
- **Frontend**: React, Vite
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2, Viem, RainbowKit
- **Icons**: Lucide React
- **Smart Contracts**: Solidity (Hardhat)

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18)
- A Web3 wallet (e.g., MetaMask) connected to Somnia Testnet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jay0xx/Stillbid.git
   cd Stillbid
   ```

2. Install dependencies:
   ```bash
   # In the root (for Hardhat)
   npm install
   
   # In the frontend directory
   cd frontend
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your private keys and contract addresses.

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔗 Somnia Network Details

- **RPC URL**: `https://dream-rpc.somnia.network`
- **Chain ID**: `50312`
- **Explorer**: [Somnia Explorer](https://shannon-explorer.somnia.network)

## 📄 License

MIT
