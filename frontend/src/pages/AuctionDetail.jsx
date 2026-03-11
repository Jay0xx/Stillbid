// src/pages/AuctionDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { config as wagmiConfig } from '../config/wagmi';
import { 
  CONTRACT_ADDRESSES, 
  AUCTION_HOUSE_ABI, 
  MOCK_NFT_ABI,
  AUCTION_HOUSE_ADDRESS 
} from '../config/contracts';
import { formatSTT } from '../utils/format';
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
import NFTImage from '../components/NFTImage'

// Gas configuration for Somnia Testnet
const LOW_GAS_CONFIG = {
  maxFeePerGas: undefined,
  maxPriorityFeePerGas: undefined,
};

const AuctionDetail = () => {
  const { id: auctionId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [localBids, setLocalBids] = useState([]);

  // Remove state variables
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [removeError, setRemoveError] = useState(null)

  const { data: auction, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
    abi: AUCTION_HOUSE_ABI,
    functionName: 'getAuction',
    args: [BigInt(auctionId)],
  });

  const { data: tokenURIData } = useReadContract({
    address: auction?.nftContract,
    abi: MOCK_NFT_ABI,
    functionName: 'tokenURI',
    args: [auction?.tokenId],
    query: { 
      enabled: !!(auction?.nftContract) && 
               auction?.tokenId !== undefined &&
               auction?.tokenId !== null
    }
  })

  useEffect(() => {
    if (auction) {
      document.title = `Stillbid — Auction #${auctionId}`;
    } else {
      document.title = "Stillbid — Auction";
    }
  }, [auction, auctionId]);

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
    args: { auctionId: BigInt(auctionId) },
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
        args: [BigInt(auctionId)],
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

  const handleRemoveAuction = async () => {
    setIsRemoving(true)
    setRemoveError(null)
    try {
      let hash
      if (!auction?.highestBid || 
          auction.highestBid === 0n) {
        hash = await writeContractAsync({
          address: AUCTION_HOUSE_ADDRESS,
          abi: AUCTION_HOUSE_ABI,
          functionName: 'cancelAuction',
          args: [BigInt(auctionId)],
          maxFeePerGas: LOW_GAS_CONFIG.maxFeePerGas,
          maxPriorityFeePerGas: 
            LOW_GAS_CONFIG.maxPriorityFeePerGas,
        })
      } else {
        hash = await writeContractAsync({
          address: AUCTION_HOUSE_ADDRESS,
          abi: AUCTION_HOUSE_ABI,
          functionName: 'forceEndAuction',
          args: [BigInt(auctionId)],
          maxFeePerGas: LOW_GAS_CONFIG.maxFeePerGas,
          maxPriorityFeePerGas: 
            LOW_GAS_CONFIG.maxPriorityFeePerGas,
        })
      }
      await waitForTransactionReceipt(wagmiConfig, { hash })
      setIsRemoving(false)
      setShowRemoveConfirm(false)
      navigate('/')
    } catch (err) {
      setRemoveError(
        err?.shortMessage || 'Transaction failed.'
      )
      setIsRemoving(false)
    }
  }

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
  <NFTImage
    tokenURI={tokenURIData || ''}
    alt={auction?.nftName || 'NFT'}
    className="w-full h-full object-cover"
    placeholderClassName="w-full h-full bg-[#F3F4F6] 
      flex items-center justify-center"
  />
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
              <span className="text-[#6B7280] text-xs font-medium">#{auctionId}</span>
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

                  {/* Seller Controls */}
                  {isOwner && (
                    <div className="pt-6 border-t border-[#F3F4F6] mt-6">
                      <button
                        onClick={() => setShowRemoveConfirm(true)}
                        disabled={isRemoving}
                        className="border border-[#EF4444] text-[#EF4444] 
                          rounded-md px-4 py-2 text-sm mt-2 w-full
                          hover:bg-[#FEF2F2] transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {auction?.highestBid === 0n || 
                         !auction?.highestBid
                          ? 'Cancel Auction'
                          : 'Remove Auction'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-center">
                     <p className="text-sm font-black uppercase tracking-widest">Auction Closed</p>
                   </div>
                   {isOwner && !auction.settled && (
                     <button 
                       onClick={() => navigate(`/settle/${auctionId}`)}
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

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/20 
          flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-[#E5E7EB] 
            rounded-lg p-6 max-w-sm w-full">

            <h3 className="font-semibold text-[#111111] text-base">
              {!auction?.highestBid || 
               auction.highestBid === 0n
                ? 'Cancel Auction'
                : 'Remove Auction'}
            </h3>

            <p className="text-sm text-[#6B7280] mt-2">
              {!auction?.highestBid || 
               auction.highestBid === 0n
                ? 'This will cancel your auction and return the NFT to your wallet. This cannot be undone.'
                : 'This will immediately refund the highest bidder and return your NFT to your wallet. This cannot be undone.'
              }
            </p>

            {auction?.highestBid > 0n && (
              <div className="mt-3 bg-[#FFF7ED] border 
                border-[#FED7AA] rounded-md p-3 
                text-xs text-[#92400E]">
                Highest bidder will be refunded{' '}
                <span className="font-semibold">
                  {formatSTT(auction.highestBid)} STT
                </span>{' '}
                automatically.
              </div>
            )}

            {removeError && (
              <p className="mt-3 text-xs text-[#EF4444]">
                {removeError}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false)
                  setRemoveError(null)
                }}
                disabled={isRemoving}
                className="flex-1 border border-[#E5E7EB] 
                  text-[#111111] rounded-md py-2 text-sm
                  hover:border-[#111111] transition-colors
                  disabled:cursor-not-allowed 
                  disabled:text-[#6B7280]"
              >
                Keep Auction
              </button>
              <button
                onClick={handleRemoveAuction}
                disabled={isRemoving}
                className="flex-1 bg-[#EF4444] text-white 
                  rounded-md py-2 text-sm font-medium
                  hover:bg-[#DC2626] transition-colors
                  disabled:bg-[#FCA5A5]
                  disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isRemoving ? (
                  <>
                    <span className="w-3 h-3 border-2 
                      border-white/40 border-t-white 
                      rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  !auction?.highestBid || 
                  auction.highestBid === 0n
                    ? 'Cancel Auction'
                    : 'Remove & Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetail;
