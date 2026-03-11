// src/pages/Settlement.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, AUCTION_HOUSE_ABI, MOCK_NFT_ABI } from '../config/contracts';
import { 
  CheckCircle2, 
  Loader2, 
  ArrowLeft, 
  ExternalLink,
  Shield,
  Clock,
  ChevronRight,
  Gavel,
  Trophy
} from 'lucide-react';
import NFTImage from '../components/NFTImage'

const Settlement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    document.title = "Stillbid — Auction Result";
  }, []);

  const [settlingStatus, setSettlingStatus] = useState('idle'); // 'idle', 'settling', 'success', 'error'
  const [error, setError] = useState('');

  const { data: auction, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
    abi: AUCTION_HOUSE_ABI,
    functionName: 'getAuction',
    args: [BigInt(id)],
  });

  const { data: tokenURIData } = useReadContract({
    address: auction?.nftContract,
    abi: MOCK_NFT_ABI,
    functionName: 'tokenURI',
    args: [auction?.tokenId],
    query: { enabled: !!auction?.nftContract && !!auction?.tokenId }
  })

  const handleSettle = async () => {
    try {
      setSettlingStatus('settling');
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
        abi: AUCTION_HOUSE_ABI,
        functionName: 'settleAuction',
        args: [BigInt(id)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setSettlingStatus('success');
      refetch();
    } catch (err) {
      console.error(err);
      setSettlingStatus('error');
      setError(err.shortMessage || 'Settlement failed. Check if reserve was met.');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="animate-spin text-[#111111]" /></div>;
  if (!auction) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">Auction data not found.</div>;

  const isSold = auction.highestBid >= auction.reservePrice;
  const isSettled = auction.settled;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <div className="max-w-xl mx-auto px-6 py-20">
        
        <Link to={`/auction/${id}`} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111] transition-colors mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Auction
        </Link>

        <div className="bg-white border-2 border-[#111111] rounded-[24px] overflow-hidden shadow-[12px_12px_0px_#111111]">
          
          {/* Status Header */}
          <div className={`p-8 text-center border-b-2 border-[#111111] ${isSold ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="w-20 h-20 bg-white border-2 border-[#111111] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              {isSettled ? (
                <Trophy size={32} className="text-yellow-500" />
              ) : (
                <Clock size={32} className="text-[#111111]" />
              )}
            </div>
            <h1 className="text-3xl font-black text-[#111111] uppercase tracking-tight">
              {isSettled ? 'Auction Settled' : 'Final Review'}
            </h1>
            <p className="text-sm text-[#6B7280] mt-2">
              {isSettled ? 'Settled on Somnia via Stillbid.' : 'Auction has concluded. Pending finalization.'}
            </p>
          </div>

          <div className="p-8 space-y-8">
            
            {/* Logic States */}
            {!isSettled ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-[#6B7280]">
                    <span>Outcome</span>
                    <span className={isSold ? 'text-green-600' : 'text-orange-600'}>{isSold ? 'Successful Sale' : 'Reserve Not Met'}</span>
                  </div>
                  <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-6">
                    <div className="flex justify-between items-end mb-4 pb-4 border-b border-[#E5E7EB]">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#9CA3AF] tracking-widest mb-1">Final Bid</p>
                        <p className="text-2xl font-black text-[#111111]">{formatEther(auction.highestBid)} STT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-[#9CA3AF] tracking-widest mb-1">Reserve</p>
                        <p className="text-sm font-bold text-[#111111]">{formatEther(auction.reservePrice)} STT</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] font-medium italic">
                      <Shield size={14} />
                      Somnia Node verification in progress...
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {settlingStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                      <AlertCircle size={18} />
                      {error.toUpperCase()}
                    </div>
                  )}

                  <button 
                    onClick={handleSettle}
                    disabled={settlingStatus === 'settling'}
                    className={`w-full py-5 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg ${settlingStatus === 'settling' ? 'bg-gray-100 text-gray-400' : 'bg-[#111111] text-white hover:bg-[#333333]'}`}
                  >
                    {settlingStatus === 'settling' ? <><Loader2 size={20} className="animate-spin" /> Finalizing...</> : <><CheckCircle2 size={20} /> Authorize Settlement</>}
                  </button>
                  <p className="text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-widest leading-relaxed">
                    By settling, you authorize the transfer of assets and <br/> distribution of funds on the Somnia main bridge.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#6B7280]">Settlement Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#6B7280] font-medium">Winner</span>
                      <span className="font-mono text-[#111111] font-bold">{auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#6B7280] font-medium">Sale Price</span>
                      <span className="text-[#111111] font-bold">{formatEther(auction.highestBid)} STT</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#6B7280] font-medium">Platform Fee</span>
                      <span className="text-[#111111] font-bold">{(parseFloat(formatEther(auction.highestBid)) * 0.025).toFixed(4)} STT</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#F3F4F6] space-y-4">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-[#111111] text-white py-5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#333333] transition-colors"
                  >
                    Go To Dashboard <ChevronRight size={18} />
                  </button>
                  <div className="text-center">
                    <a href="#" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#6B7280] hover:text-[#111111] transition-colors">
                      View Tx on Explorer <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlement;
