// src/hooks/useAuctionEvents.js
import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { parseAbiItem } from 'viem';
import { AUCTION_HOUSE_ADDRESS, AUCTION_HOUSE_ABI, REACTIVE_SETTLEMENT_ADDRESS, REACTIVE_SETTLEMENT_ABI } from '../config/contracts';

export const useAuctionEvents = (auctionId) => {
  const [bidHistory, setBidHistory] = useState([]);
  const [latestBid, setLatestBid] = useState(null);
  const publicClient = usePublicClient();

  const fetchHistory = useCallback(async () => {
    if (!publicClient || !auctionId) return;

    try {
      const logs = await publicClient.getLogs({
        address: AUCTION_HOUSE_ADDRESS,
        event: parseAbiItem('event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)'),
        args: { auctionId: BigInt(auctionId) },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      const history = await Promise.all(logs.map(async (log) => {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        return {
          bidder: log.args.bidder,
          amount: log.args.amount,
          timestamp: Number(block.timestamp),
          txHash: log.transactionHash,
          reactiveConfirmed: false
        };
      }));

      const sorted = history.sort((a, b) => b.timestamp - a.timestamp);
      setBidHistory(sorted);
      if (sorted.length > 0) setLatestBid(sorted[0]);
    } catch (err) {
      console.error("Failed to fetch bid history:", err);
    }
  }, [publicClient, auctionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useWatchContractEvent({
    address: AUCTION_HOUSE_ADDRESS,
    abi: AUCTION_HOUSE_ABI,
    eventName: 'BidPlaced',
    args: { auctionId: BigInt(auctionId) },
    onLogs: (logs) => {
      logs.forEach(async (log) => {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        const newBid = {
          bidder: log.args.bidder,
          amount: log.args.amount,
          timestamp: Number(block.timestamp),
          txHash: log.transactionHash,
          reactiveConfirmed: false
        };
        setBidHistory(prev => {
          if (prev.find(b => b.txHash === newBid.txHash)) return prev;
          const updated = [newBid, ...prev];
          return updated.sort((a, b) => b.timestamp - a.timestamp);
        });
        setLatestBid(newBid);
      });
    }
  });

  useWatchContractEvent({
    address: REACTIVE_SETTLEMENT_ADDRESS,
    abi: REACTIVE_SETTLEMENT_ABI,
    eventName: 'BidRecorded',
    args: { auctionId: BigInt(auctionId) },
    onLogs: (logs) => {
      logs.forEach((log) => {
        setBidHistory(prev => prev.map(bid => 
          (bid.bidder.toLowerCase() === log.args.bidder.toLowerCase() && bid.amount === log.args.amount)
          ? { ...bid, reactiveConfirmed: true }
          : bid
        ));
      });
    }
  });

  return {
    bidHistory,
    latestBid,
    isWatching: true,
    fetchHistory,
  };
};
