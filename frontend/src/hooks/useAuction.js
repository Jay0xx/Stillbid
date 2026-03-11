// src/hooks/useAuction.js
import { useReadContract } from 'wagmi';
import { AUCTION_HOUSE_ADDRESS, AUCTION_HOUSE_ABI } from '../config/contracts';
import { useMemo } from 'react';

export const useAuction = (auctionId) => {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: AUCTION_HOUSE_ADDRESS,
    abi: AUCTION_HOUSE_ABI,
    functionName: 'getAuction',
    args: [BigInt(auctionId || 0)],
    query: {
      refetchInterval: 10000,
      enabled: !!auctionId,
    }
  });

  const auction = useMemo(() => {
    if (!data) return null;
    return {
      auctionId: data.auctionId,
      nftContract: data.nftContract,
      tokenId: data.tokenId,
      seller: data.seller,
      reservePrice: data.reservePrice,
      highestBid: data.highestBid,
      highestBidder: data.highestBidder,
      startTime: data.startTime,
      endTime: data.endTime,
      settled: data.settled,
      active: data.active,
    };
  }, [data]);

  const derived = useMemo(() => {
    if (!auction) return {
      minBid: 0n,
      isActive: false,
      hasEnded: false,
      isSettled: false,
      reserveMet: false,
      timeRemaining: 0,
    };

    const now = BigInt(Math.floor(Date.now() / 1000));
    const hasEnded = auction.endTime < now;
    const isSettled = auction.settled;
    const isActive = auction.active && !isSettled && !hasEnded;
    const reserveMet = auction.highestBid >= auction.reservePrice;
    
    const minBid = auction.highestBid === 0n 
      ? auction.reservePrice 
      : (auction.highestBid * 105n) / 100n;

    const timeRemaining = Number(auction.endTime) - Number(now) > 0 
      ? Number(auction.endTime) - Number(now) 
      : 0;

    return {
      minBid,
      isActive,
      hasEnded,
      isSettled,
      reserveMet,
      timeRemaining,
    };
  }, [auction]);

  return {
    auction,
    isLoading,
    isError,
    refetch,
    ...derived,
  };
};
