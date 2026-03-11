// src/pages/AuctionDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACT_ADDRESSES, AUCTION_HOUSE_ABI } from '../config/contracts';
import { 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Gavel, 
  History, 
  Share2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [localBids, setLocalBids] = useState([]);

  const { data: auction, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
    abi: AUCTION_HOUSE_ABI,
    functionName: 'getAuction',
    args: [BigInt(id)],
  });

  useEffect(() => {
    if (auction) {
      document.title = `Stillbid — Auction #${id}`;
    } else {
      document.title = "Stillbid — Auction";
    }
  }, [auction, id]);

  const minBid = useMemo(() => {
    if (!auction) return 0n;
    if (auction.highestBid === 0n) return auction.reservePrice;
    return (auction.highestBid * 105n) / 100n;
  }, [auction]);

  // Real-time bidirectional timer
  useEffect(() => {
    if (!auction) return;
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Number(auction.endTime) - now;
      if (remaining <= 0) {
        setTimeLeft({ h: '00', m: '00', s: '00' });
        return;
      }
      setTimeLeft({
        h: Math.floor(remaining / 3600).toString().padStart(2, '0'),
        m: Math.floor((remaining % 3600) / 60).toString().padStart(2, '0'),
        s: (remaining % 60).toString().padStart(2, '0')
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction?.endTime]);

  // Watch for new bids
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
    abi: AUCTION_HOUSE_ABI,
    eventName: 'BidPlaced',
    args: { auctionId: BigInt(id) },
    onLogs: (logs) => {
      refetch();
    },
  });

  const handlePlaceBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) return;
    try {
      setIsBidding(true);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
        abi: AUCTION_HOUSE_ABI,
        functionName: 'placeBid',
        args: [BigInt(id)],
        value: parseEther(bidAmount),
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setBidAmount('');
      refetch();
    } catch (err) {
      console.error(err);
      alert(err.shortMessage || "Bid failed. Ensure it is at least 5% higher than the current bid.");
    } finally {
      setIsBidding(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="animate-spin text-[#111111]" /></div>;
  if (!auction) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-bold">Auction not found.</div>;

  const isExpired = Number(auction.endTime) < (Date.now() / 1000);
  const isOwner = address && auction.seller.toLowerCase() === address.toLowerCase();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111] transition-colors mb-10 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Return to Market
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Left: Media Column */}
          <div className="space-y-6">
            <div className="aspect-square bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="bg-[#111111] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Somnia Verified</span>
                <span className="bg-white/90 backdrop-blur-sm border border-[#E5E7EB] text-[#111111] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">NFT Protocol v1</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] mb-4">On-Chain Metadata</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center group cursor-help">
                  <span className="text-sm text-[#6B7280]">Contract Address</span>
                  <span className="text-sm font-mono text-[#111111] flex items-center gap-1">
                    {auction.nftContract.slice(0, 6)}...{auction.nftContract.slice(-4)}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B7280]">Token ID</span>
                  <span className="text-sm font-bold text-[#111111]">{auction.tokenId.toString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B7280]">Token Standard</span>
                  <span className="text-sm font-bold text-[#111111]">ERC-721</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700 animate-pulse'}`}>
                {isExpired ? 'Auction Ended' : 'Live Auction'}
              </span>
              <span className="text-[#6B7280] text-xs font-medium">#{id}</span>
            </div>

            <h1 className="text-4xl font-black text-[#111111] mb-2 tracking-tight">NFT {auction.nftContract.slice(0, 8)}</h1>
            <p className="text-[#6B7280] text-lg mb-8 lowercase tracking-tight">listed by <span className="font-bold text-[#111111] border-b border-[#111111]/20 pb-0.5">{auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}</span></p>

            {/* Auction Box */}
            <div className="bg-white border-2 border-[#111111] rounded-2xl p-8 shadow-[8px_8px_0px_#111111] mb-10">
              <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-[#F3F4F6]">
                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1">Current Bid</p>
                  <p className="text-3xl font-black text-[#111111]">{formatEther(auction.highestBid || 0n)} <span className="text-sm font-medium">STT</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1">Ending In</p>
                  <div className="flex items-start justify-end gap-1.5 text-3xl font-black text-[#111111]">
                    <span>{timeLeft.h}</span><span className="text-base mt-2">:</span>
                    <span>{timeLeft.m}</span><span className="text-base mt-2">:</span>
                    <span>{timeLeft.s}</span>
                  </div>
                </div>
              </div>

              {!isExpired ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                       <span className="text-[#6B7280]">Your Bid (STT)</span>
                       <span className="text-[#10B981]">Min. {formatEther(minBid)} STT</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-4 text-xl font-black text-[#111111] focus:ring-2 focus:ring-[#111111] focus:border-transparent outline-none transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs font-black text-[#9CA3AF]">STT</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handlePlaceBid}
                    disabled={isBidding || !isConnected}
                    className={`w-full py-5 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg ${!isConnected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#111111] text-white hover:bg-[#333333] active:translate-y-0.5'}`}
                  >
                    {isBidding ? <Loader2 size={20} className="animate-spin" /> : <><Gavel size={20} /> Place High Bid</>}
                  </button>
                  
                  {!isConnected && (
                    <p className="text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Connect wallet to place bids</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-center">
                     <p className="text-sm font-black uppercase tracking-widest">Auction Closed</p>
                   </div>
                   {isOwner && !auction.settled && (
                     <button 
                       onClick={() => navigate(`/settle/${id}`)}
                       className="w-full bg-[#111111] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-colors"
                     >
                       Settle Auction &rarr;
                     </button>
                   )}
                </div>
              )}
            </div>

            {/* Auction Attributes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-[#111111] font-bold italic">
                <ShieldCheck size={18} className="text-[#10B981]" />
                Reactive Settlement Enabled
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                This auction uses Somnia's Reactivity Layer to automatically process and verify bids. Settlement triggers occur on-chain with millisecond precision once the timer expires.
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuctionDetail;
