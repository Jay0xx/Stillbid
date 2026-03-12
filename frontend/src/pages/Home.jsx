// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import useNFTMetadata from '../hooks/useNFTMetadata'
import WatchButton from '../components/WatchButton'

import { useNavigate } from 'react-router-dom';
import { useReadContract, useReadContracts, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query'
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, AUCTION_HOUSE_ABI, MOCK_NFT_ABI } from '../config/contracts';
import { LayoutGrid, Clock, Tag, ExternalLink } from 'lucide-react';
import NFTImage from '../components/NFTImage'

const AuctionCard = ({ auction, navigate }) => {
  const { metadata } = useNFTMetadata(
    auction.resolvedTokenURI || ''
  )
  const [timeLeft, setTimeLeft] = useState('');

  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Number(auction.endTime) - now;

      if (remaining <= 0) {
        setTimeLeft('Ending...');
        setIsEndingSoon(true);
        return;
      }

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      
      setTimeLeft(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      setIsEndingSoon(remaining < 3600);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  return (
    <div 
      className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden transition-all duration-200 hover:border-[#111111] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] group"
      onClick={() => navigate(`/auction/${auction.auctionId.toString()}`)}
    >
      <div className="h-[220px] bg-[#F3F4F6] flex items-center justify-center relative">
        <NFTImage
          tokenURI={auction.resolvedTokenURI || ''}
          alt={auction.nftName || 'NFT'}
          className="w-full h-full object-cover"
          placeholderClassName="w-full h-full bg-[#F3F4F6] 
            flex items-center justify-center"
        />
      <div className="absolute top-2 right-2 z-10">
        <WatchButton
          auctionId={auction.auctionId}
          currentPrice={auction.highestBid}
          size="sm"
        />
      </div>
      <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-[#111111] uppercase tracking-wider">
        Token #{auction.tokenId.toString()}
      </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-[#111111] text-base truncate group-hover:text-[#111111]">
          {metadata?.name || auction.nftName || 'Unnamed NFT'}
        </h3>
        
        <div className="mt-2">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide">Current Bid</p>
          <p className="font-bold text-[#111111] text-lg">
            {auction.highestBid > 0 ? formatEther(auction.highestBid) : formatEther(auction.reservePrice)} STT
          </p>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <div className={`flex items-center gap-1.5 text-sm ${isEndingSoon && timeLeft !== 'Ending...' ? 'text-orange-500' : 'text-[#6B7280]'}`}>
            <Clock size={14} />
            <span>{timeLeft}</span>
          </div>
          <div className="bg-[#F3F4F6] text-[#111111] text-xs px-2 py-0.5 rounded-full font-medium">
            {auction.highestBidder !== '0x0000000000000000000000000000000000000000' ? 'Active Bid' : 'No Bids'}
          </div>
        </div>

        <button className="w-full mt-4 bg-[#111111] text-white text-sm font-medium py-2 rounded-md hover:bg-[#333333] transition-colors">
          Place Bid
        </button>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] animate-pulse">
    <div className="h-[220px] bg-[#F3F4F6]" />
    <div className="p-4">
      <div className="h-4 bg-[#F3F4F6] rounded w-3/4" />
      <div className="mt-4">
        <div className="h-2 bg-[#F3F4F6] rounded w-1/4" />
        <div className="h-6 bg-[#F3F4F6] rounded w-1/2 mt-2" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-4 bg-[#F3F4F6] rounded w-1/3" />
        <div className="h-4 bg-[#F3F4F6] rounded w-1/4" />
      </div>
      <div className="h-9 bg-[#F3F4F6] rounded w-full mt-4" />
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    document.title = "Stillbid — Live Auctions";
  }, []);

  const publicClient = usePublicClient()
  const [auctions, setAuctions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAuctions = async () => {
    if (!publicClient) return
    setIsLoading(true)
    try {
      // Do NOT use getActiveAuctions() — Somnia RPC
      // returns 0x for it consistently.
      // Instead read auctionCounter and scan all IDs.
      let auctionCounter
      try {
        auctionCounter = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
          abi: AUCTION_HOUSE_ABI,
          functionName: 'auctionCounter',
        })
      } catch {
        setAuctions([])
        setIsLoading(false)
        return
      }

      // auctionCounter starts at 1 and post-increments
      // so total auctions = auctionCounter - 1
      const total = Number(auctionCounter) - 1
      if (total <= 0) {
        setAuctions([])
        setIsLoading(false)
        return
      }

      const allIds = Array.from(
        { length: total },
        (_, i) => BigInt(i + 1)
      )

      // Fetch all auctions individually —
      // Somnia does not support multicall3
      const auctionResults = await Promise.all(
        allIds.map(id =>
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
            abi: AUCTION_HOUSE_ABI,
            functionName: 'getAuction',
            args: [id],
          }).then(result => ({ 
            status: 'success', result 
          })).catch(() => ({ 
            status: 'failure' 
          }))
        )
      )

      const now = Math.floor(Date.now() / 1000)

      // Filter for active auctions only in JS
      const validAuctions = auctionResults
        .filter(r =>
          r.status === 'success' &&
          r.result.active &&
          Number(r.result.endTime) > now
        )
        .map(r => r.result)

      if (validAuctions.length === 0) {
        setAuctions([])
        setIsLoading(false)
        return
      }

      // Fetch tokenURIs individually
      const uriResults = await Promise.all(
        validAuctions.map(a =>
          publicClient.readContract({
            address: a.nftContract,
            abi: MOCK_NFT_ABI,
            functionName: 'tokenURI',
            args: [a.tokenId],
          }).then(result => result).catch(() => '')
        )
      )

      const auctionsWithImages = validAuctions.map(
        (a, i) => ({
          ...a,
          resolvedTokenURI: uriResults[i] || '',
        })
      )

      setAuctions(auctionsWithImages)

    } catch (err) {
      console.error('fetchAuctions error:', err)
      setAuctions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on mount and poll every 15 seconds
  useEffect(() => {
    fetchAuctions()
    const interval = setInterval(fetchAuctions, 15000)
    return () => clearInterval(interval)
  }, [publicClient])

  const filteredAuctions = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let result = [...auctions];

    if (filter === 'Ending Soon') {
      result = result
        .filter(a => Number(a.endTime) - now < 3600 && Number(a.endTime) - now > 0)
        .sort((a, b) => Number(a.endTime) - Number(b.endTime));
    } else if (filter === 'New') {
      result = result
        .sort((a, b) => Number(b.startTime) - Number(a.startTime));
    }

    return result;
  }, [auctions, filter]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-20">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-bold text-2xl text-[#111111]">Live Auctions</h1>
            <p className="text-[#6B7280] text-sm mt-1">Explore real-time NFT auctions on Somnia</p>
          </div>
          <div className="text-[#6B7280] text-sm font-medium">
            {isLoading ? '--' : filteredAuctions.length} active
          </div>
        </div>
        
        <div className="h-[1px] bg-[#E5E7EB] w-full mt-6" />

        <div className="mt-8 mb-2">
          <p className="text-xs tracking-widest text-[#6B7280] uppercase">STILLBID</p>
          <p className="text-sm text-[#6B7280] mt-1">Live NFT auctions on Somnia.</p>
        </div>

        <div className="mt-6 mb-8 flex gap-3">
          {['All', 'Ending Soon', 'New'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all border ${
                filter === f 
                ? 'bg-[#111111] text-white border-[#111111]' 
                : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111111]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredAuctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.auctionId.toString()} auction={auction} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-[#E5E7EB] rounded-xl bg-white">
            <Tag size={40} className="text-[#E5E7EB] mb-4" />
            <p className="text-[#6B7280] text-lg">No live auctions right now.</p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-4 px-6 py-2 border border-[#111111] text-[#111111] rounded-md font-medium hover:bg-[#111111] hover:text-white transition-all"
            >
              Create one &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
