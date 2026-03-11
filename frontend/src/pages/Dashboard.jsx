// src/pages/Dashboard.jsx
import React, { useMemo, useEffect } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, AUCTION_HOUSE_ABI } from '../config/contracts';
import { Layout, History, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Stillbid — Dashboard";
  }, []);

  // In a real app, we'd use an indexer. Here we'll scan all active auctions 
  // and filter by the connected user's address.
  const { data: allActiveIds } = useReadContracts({
    contracts: [{
      address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
      abi: AUCTION_HOUSE_ABI,
      functionName: 'getActiveAuctions',
    }]
  });

  const auctionIds = allActiveIds?.[0]?.result || [];

  const { data: auctionsData, isLoading } = useReadContracts({
    contracts: auctionIds.map(id => ({
      address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
      abi: AUCTION_HOUSE_ABI,
      functionName: 'getAuction',
      args: [id],
    }))
  });

  const myAuctions = useMemo(() => {
    if (!auctionsData || !address) return [];
    return auctionsData
      .filter(res => res.status === 'success')
      .map(res => res.result)
      .filter(a => a.seller.toLowerCase() === address.toLowerCase());
  }, [auctionsData, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAFAFA]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Layout size={24} className="text-[#6B7280]" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">Manage your auctions</h2>
          <p className="text-[#6B7280] text-sm mt-2">Connect your wallet to view your active listings and sales history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-20">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Dashboard</h1>
            <p className="text-[#6B7280] text-sm mt-1">Manage your active listings and settlement status.</p>
          </div>
          <button 
            onClick={() => navigate('/create')}
            className="bg-[#111111] text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            Create New
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 text-[#6B7280] mb-4">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-widest text-opacity-80">Active Listings</span>
            </div>
            <p className="text-4xl font-black text-[#111111]">{myAuctions.length}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 text-[#6B7280] mb-4">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase tracking-widest text-opacity-80">Total Value</span>
            </div>
            <p className="text-4xl font-black text-[#111111]">
              {myAuctions.reduce((acc, a) => acc + parseFloat(formatEther(a.highestBid || 0n)), 0).toFixed(2)} <span className="text-lg font-medium">STT</span>
            </p>
          </div>
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 text-[#6B7280] mb-4">
              <History size={16} />
              <span className="text-xs font-bold uppercase tracking-widest text-opacity-80">Avg. Bid</span>
            </div>
            <p className="text-4xl font-black text-[#111111]">
              {myAuctions.length > 0 ? (myAuctions.reduce((acc, a) => acc + parseFloat(formatEther(a.highestBid || 0n)), 0) / myAuctions.length).toFixed(2) : '0.00'} <span className="text-lg font-medium">STT</span>
            </p>
          </div>
        </div>

        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#6B7280] mb-6 mb-2">My Live Auctions</h2>
        <div className="h-[1px] bg-[#E5E7EB] mb-8" />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />)}
          </div>
        ) : myAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAuctions.map((a) => (
              <div 
                key={a.auctionId.toString()} 
                className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#111111] transition-all cursor-pointer group shadow-sm"
                onClick={() => navigate(`/auction/${a.auctionId}`)}
              >
                <div className="h-40 bg-[#F9FAFB] flex items-center justify-center border-b border-[#F3F4F6]">
                   <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">NFT #{a.tokenId.toString()}</span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#111111]">Auction #{a.auctionId.toString()}</h3>
                    <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-tighter">Live</span>
                  </div>
                  <p className="text-xs text-[#6B7280] mb-3 truncate">{a.nftContract}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-tighter">Highest Bid</p>
                      <p className="text-lg font-black text-[#111111]">{formatEther(a.highestBid)} STT</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-tighter text-right">Time Left</p>
                      <p className="text-sm font-bold text-[#111111]">
                        {Math.max(0, Math.floor((Number(a.endTime) - Date.now()/1000) / 3600))}h left
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-xl py-24 text-center">
            <Layout size={40} className="mx-auto text-[#E5E7EB] mb-4" />
            <p className="text-[#6B7280] font-medium">You don't have any active auctions.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Start by minting or listing an existing NFT.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
