// src/config/contracts.js

export const MOCK_NFT_ADDRESS = "0x309f89F9e13Ca6073E10Eb0ABB69C7cBDECC8eAE";
export const AUCTION_HOUSE_ADDRESS = "0x208E17C40a0602d38245A25712F7cD3a1693B0Ab";
export const REACTIVE_SETTLEMENT_ADDRESS = "0x780A00E67c7f9B4D03311266304E0Ae2ECE10617";

export const CONTRACT_ADDRESSES = {
  AUCTION_HOUSE: AUCTION_HOUSE_ADDRESS,
  MOCK_NFT: MOCK_NFT_ADDRESS,
  REACTIVE_SETTLEMENT: REACTIVE_SETTLEMENT_ADDRESS,
};

export const SOMNIA_EXPLORER_URL = "https://shannon-explorer.somnia.network";
export const SOMNIA_CHAIN_ID = 50312;

export const MOCK_NFT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "approved", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getApproved",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mint",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export const AUCTION_HOUSE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "auctionId", "type": "uint256" }
    ],
    "name": "AuctionCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "auctionId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "nftContract", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "reservePrice", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256" }
    ],
    "name": "AuctionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "auctionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "AuctionSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "auctionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "bidder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "BidPlaced",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "cancelAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "nftContract", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "reservePrice", "type": "uint256" },
      { "internalType": "uint256", "name": "durationInSeconds", "type": "uint256" }
    ],
    "name": "createAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveAuctions",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "getAuction",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "auctionId", "type": "uint256" },
          { "internalType": "address", "name": "nftContract", "type": "address" },
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "internalType": "address payable", "name": "seller", "type": "address" },
          { "internalType": "uint256", "name": "reservePrice", "type": "uint256" },
          { "internalType": "uint256", "name": "highestBid", "type": "uint256" },
          { "internalType": "address payable", "name": "highestBidder", "type": "address" },
          { "internalType": "uint256", "name": "startTime", "type": "uint256" },
          { "internalType": "uint256", "name": "endTime", "type": "uint256" },
          { "internalType": "bool", "name": "settled", "type": "bool" },
          { "internalType": "bool", "name": "active", "type": "bool" }
        ],
        "internalType": "struct AuctionHouse.Auction",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "placeBid",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "settleAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const REACTIVE_SETTLEMENT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "auctionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "bidder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BidRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "auctionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "bidder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "ReactiveCallback",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "getLatestBid",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "bidder", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct ReactiveSettlement.BidRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "auctionId", "type": "uint256" },
      { "internalType": "address", "name": "bidder", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "recordBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "triggerSettlement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
