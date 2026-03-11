// c:\Users\a\.gemini\antigravity\scratch\mock-nft\frontend\src\pages\Dashboard.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { config as wagmiConfig } from '../config/wagmi';
import { 
  CONTRACT_ADDRESSES, 
  AUCTION_HOUSE_ABI, 
  MOCK_NFT_ABI, 
  MOCK_NFT_ADDRESS,
  AUCTION_HOUSE_ADDRESS 
} from '../config/contracts';
import { formatSTT } from '../utils/format';
import { Layout, History, Clock, TrendingUp } from 'lucide-react';
import NFTImage from '../components/NFTImage'

const ALCHEMY_NFT_URL =
  'https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTsForOwner'

// Gas configuration for Somnia Testnet
const LOW_GAS_CONFIG = {
  maxFeePerGas: undefined,
  maxPriorityFeePerGas: undefined,
};

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const { writeContractAsync } = useWriteContract();

  const [activeTab, setActiveTab] = useState('auctions')
  const [walletNFTs, setWalletNFTs] = useState([])
  const [isFetchingAssets, setIsFetchingAssets] = useState(false)
  const [assetsFetchError, setAssetsFetchError] = useState(null)
  const [assetsSearchQuery, setAssetsSearchQuery] = useState('')

  // Remove state variables
  const [removingAuctionId, setRemovingAuctionId] = useState(null)
  const [removeError, setRemoveError] = useState(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null)

  useEffect(() => {
    document.title = "Stillbid — Dashboard";
  }, []);

  // In a real app, we'd use an indexer. Here we'll scan all active auctions 
  // and filter by the connected user's address.
  const { data: allActiveIds, refetch } = useReadContracts({
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

  const { data: uriData } = useReadContracts({
    contracts: myAuctions.map(a => ({
      address: a.nftContract,
      abi: MOCK_NFT_ABI,
      functionName: 'tokenURI',
      args: [a.tokenId],
    }))
  });

  const myAuctionsWithURI = useMemo(() => {
    return myAuctions.map((a, index) => ({
      ...a,
      tokenURI: uriData?.[index]?.status === 'success' ? uriData[index].result : ''
    }));
  }, [myAuctions, uriData]);

  const handleRemoveAuction = async (auction) => {
    setRemovingAuctionId(auction.auctionId)
    setRemoveError(null)
    try {
      let hash
      if (auction.highestBid === 0n || 
          auction.highestBid === 0) {
        // No bids — cancel
        hash = await writeContractAsync({
          address: AUCTION_HOUSE_ADDRESS,
          abi: AUCTION_HOUSE_ABI,
          functionName: 'cancelAuction',
          args: [BigInt(auction.auctionId)],
          maxFeePerGas: LOW_GAS_CONFIG.maxFeePerGas,
          maxPriorityFeePerGas: 
            LOW_GAS_CONFIG.maxPriorityFeePerGas,
        })
      } else {
        // Has bids — force end
        hash = await writeContractAsync({
          address: AUCTION_HOUSE_ADDRESS,
          abi: AUCTION_HOUSE_ABI,
          functionName: 'forceEndAuction',
          args: [BigInt(auction.auctionId)],
          maxFeePerGas: LOW_GAS_CONFIG.maxFeePerGas,
          maxPriorityFeePerGas: 
            LOW_GAS_CONFIG.maxPriorityFeePerGas,
        })
      }
      await waitForTransactionReceipt(wagmiConfig, { hash })
      setShowRemoveConfirm(null)
      setRemovingAuctionId(null)
      // Refresh auctions list
      refetch()
    } catch (err) {
      setRemoveError(
        err?.shortMessage || 'Transaction failed.'
      )
      setRemovingAuctionId(null)
    }
  }

  const fetchWalletAssets = async () => {
    if (!address) return
    setIsFetchingAssets(true)
    setAssetsFetchError(null)
    try {
      const res = await fetch(
        `${ALCHEMY_NFT_URL}?owner=${address}` +
        `&withMetadata=true&pageSize=100`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const nfts = (data.ownedNfts || []).map(nft => ({
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        name: nft.name ||
          `${nft.contract.name || 'NFT'} #${nft.tokenId}`,
        image: nft.image?.thumbnailUrl ||
               nft.image?.cachedUrl ||
               nft.image?.originalUrl || null,
        collectionName: nft.contract.name ||
          nft.contract.address.slice(0, 6) + '...',
        tokenType: nft.tokenType,
        isStillbid: nft.contract.address.toLowerCase() ===
          MOCK_NFT_ADDRESS.toLowerCase(),
      }))
      setWalletNFTs(nfts.filter(n => n.tokenType === 'ERC721'))
    } catch (err) {
      setAssetsFetchError(
        'Could not load assets. Please try again.'
      )
    } finally {
      setIsFetchingAssets(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'assets' && address) {
      fetchWalletAssets()
    }
  }, [activeTab, address])

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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5E7EB] mb-8">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-3 text-sm cursor-pointer ${activeTab === 'auctions' ? 'border-b-2 border-[#111111] text-[#111111] font-medium -mb-px' : 'text-[#6B7280] hover:text-[#111111]'}`}
          >
            My Auctions
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-3 text-sm cursor-pointer ${activeTab === 'bids' ? 'border-b-2 border-[#111111] text-[#111111] font-medium -mb-px' : 'text-[#6B7280] hover:text-[#111111]'}`}
          >
            My Bids
          </button>
          <button
            onClick={() => setActiveTab('watching')}
            className={`px-4 py-3 text-sm cursor-pointer ${activeTab === 'watching' ? 'border-b-2 border-[#111111] text-[#111111] font-medium -mb-px' : 'text-[#6B7280] hover:text-[#111111]'}`}
          >
            Watching
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-3 text-sm cursor-pointer ${activeTab === 'assets' ? 'border-b-2 border-[#111111] text-[#111111] font-medium -mb-px' : 'text-[#6B7280] hover:text-[#111111]'}`}
          >
            Assets
          </button>
        </div>

        {/* My Auctions Tab */}
        {activeTab === 'auctions' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#6B7280] mb-6 mb-2">My Live Auctions</h2>
            <div className="h-[1px] bg-[#E5E7EB] mb-8" />

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />)}
              </div>
            ) : myAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAuctionsWithURI.map((a) => (
                  <div 
                    key={a.auctionId.toString()} 
                    className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#111111] transition-all cursor-pointer group shadow-sm flex flex-col"
                  >
                    <div 
                      className="h-40 bg-[#F9FAFB] flex items-center justify-center border-b border-[#F3F4F6]"
                      onClick={() => navigate(`/auction/${a.auctionId}`)}
                    >
                       <NFTImage
                         tokenURI={a.tokenURI || ''}
                         alt={a.nftName || 'NFT'}
                         className="w-full h-full object-cover rounded-md"
                         placeholderClassName="w-full h-full bg-[#F3F4F6] flex items-center justify-center rounded-md"
                       />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2" onClick={() => navigate(`/auction/${a.auctionId}`)}>
                        <h3 className="font-bold text-[#111111]">Auction #{a.auctionId.toString()}</h3>
                        <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-tighter">Live</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-3 truncate" onClick={() => navigate(`/auction/${a.auctionId}`)}>{a.nftContract}</p>
                      <div className="flex justify-between items-end mb-4" onClick={() => navigate(`/auction/${a.auctionId}`)}>
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
                      
                      {/* Actions */}
                      <div className="mt-auto pt-4 border-t border-[#F3F4F6] flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/auction/${a.auctionId}`);
                          }}
                          className="flex-1 border border-[#E5E7EB] text-[#111111] text-xs px-3 py-1.5 rounded-md hover:border-[#111111] transition-colors"
                        >
                          View
                        </button>
                        {a.active && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRemoveConfirm(a);
                            }}
                            disabled={removingAuctionId === a.auctionId}
                            className="border border-[#EF4444] text-[#EF4444] 
                              text-xs px-3 py-1.5 rounded-md 
                              hover:bg-[#FEF2F2] transition-colors
                              disabled:cursor-not-allowed 
                              disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
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
        )}

        {/* My Bids Tab */}
        {activeTab === 'bids' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl py-24 text-center">
            <Layout size={40} className="mx-auto text-[#E5E7EB] mb-4" />
            <p className="text-[#6B7280] font-medium">No bids placed yet.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Your bid history will appear here.</p>
          </div>
        )}

        {/* Watching Tab */}
        {activeTab === 'watching' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl py-24 text-center">
            <Layout size={40} className="mx-auto text-[#E5E7EB] mb-4" />
            <p className="text-[#6B7280] font-medium">You're not watching any auctions.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Auctions you watch will appear here.</p>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div>

            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-[#111111]">
                  Your NFT Assets
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  All ERC-721 NFTs in your connected wallet
                </p>
              </div>
              <button
                onClick={fetchWalletAssets}
                disabled={isFetchingAssets}
                className="text-xs text-[#6B7280] hover:text-[#111111] border border-[#E5E7EB] rounded-md px-3 py-1.5 disabled:cursor-not-allowed transition-colors"
              >
                {isFetchingAssets ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Search bar */}
            {walletNFTs.length > 0 && (
              <input
                type="text"
                placeholder="Search by name or collection..."
                value={assetsSearchQuery}
                onChange={(e) => setAssetsSearchQuery(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-md px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white mb-6"
              />
            )}

            {/* Stillbid NFTs section */}
            {!isFetchingAssets &&
              walletNFTs.filter(n => n.isStillbid).length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-[#111111] uppercase tracking-widest">
                    Stillbid
                  </span>
                  <span className="bg-[#111111] text-white text-xs px-2 py-0.5 rounded-full">
                    {walletNFTs.filter(n => n.isStillbid).length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {walletNFTs
                    .filter(n => n.isStillbid)
                    .filter(n =>
                      assetsSearchQuery === '' ||
                      n.name.toLowerCase().includes(
                        assetsSearchQuery.toLowerCase()
                      )
                    )
                    .map(nft => (
                      <div
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                        className="white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#111111] transition-all duration-200 bg-white"
                      >
                        {/* Image */}
                        <div className="h-40 bg-[#F3F4F6] overflow-hidden">
                          {nft.image ? (
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8 text-[#D1D5DB]"
                                fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-sm font-medium text-[#111111] truncate">
                            {nft.name}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Token #{nft.tokenId}
                          </p>
                          <span className="inline-block mt-2 text-xs bg-[#111111] text-white px-2 py-0.5 rounded-full">
                            Stillbid
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Divider between sections */}
            {!isFetchingAssets &&
              walletNFTs.filter(n => n.isStillbid).length > 0 &&
              walletNFTs.filter(n => !n.isStillbid).length > 0 && (
              <div className="border-t border-[#E5E7EB] mb-8" />
            )}

            {/* Other NFTs section */}
            {!isFetchingAssets &&
              walletNFTs.filter(n => !n.isStillbid).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-[#111111] uppercase tracking-widest">
                    Other NFTs
                  </span>
                  <span className="bg-[#F3F4F6] text-[#111111] text-xs px-2 py-0.5 rounded-full">
                    {walletNFTs.filter(n => !n.isStillbid).length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {walletNFTs
                    .filter(n => !n.isStillbid)
                    .filter(n =>
                      assetsSearchQuery === '' ||
                      n.name.toLowerCase().includes(
                        assetsSearchQuery.toLowerCase()
                      ) ||
                      n.collectionName.toLowerCase().includes(
                        assetsSearchQuery.toLowerCase()
                      )
                    )
                    .map(nft => (
                      <div
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                        className="border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#111111] transition-all duration-200 bg-white"
                      >
                        {/* Image */}
                        <div className="h-40 bg-[#F3F4F6] overflow-hidden">
                          {nft.image ? (
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8 text-[#D1D5DB]"
                                fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-sm font-medium text-[#111111] truncate">
                            {nft.name}
                          </p>
                          <p className="text-xs text-[#6B7280] truncate mt-0.5">
                            {nft.collectionName}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Token #{nft.tokenId}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {isFetchingAssets && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i}
                    className="border border-[#E5E7EB] rounded-lg overflow-hidden animate-pulse">
                    <div className="h-40 bg-[#F3F4F6]" />
                    <div className="p-3">
                      <div className="h-3 bg-[#F3F4F6] rounded w-3/4 mb-2" />
                      <div className="h-3 bg-[#F3F4F6] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {assetsFetchError && !isFetchingAssets && (
              <div className="bg-[#FFF7ED] border border-[#FED7AA] text-[#92400E] rounded-md p-4 text-sm text-center">
                {assetsFetchError}
                <button
                  onClick={fetchWalletAssets}
                  className="block mx-auto mt-2 text-xs underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isFetchingAssets &&
              !assetsFetchError &&
              walletNFTs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-[#111111] font-medium text-sm">
                  No NFTs found in this wallet.
                </p>
                <p className="text-[#6B7280] text-xs mt-1">
                  NFTs you mint or win on Stillbid will appear here.
                </p>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-4 bg-[#111111] text-white px-4 py-2 rounded-md text-sm hover:bg-[#333333] transition-colors"
                >
                  Mint your first NFT →
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/20 
          flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-[#E5E7EB] 
            rounded-lg p-6 max-w-sm w-full">

            {/* Title */}
            <h3 className="font-semibold text-[#111111] text-base">
              {showRemoveConfirm.highestBid === 0n ||
               showRemoveConfirm.highestBid === 0
                ? 'Cancel Auction'
                : 'Remove Auction'}
            </h3>

            {/* Body */}
            <p className="text-sm text-[#6B7280] mt-2">
              {showRemoveConfirm.highestBid === 0n ||
               showRemoveConfirm.highestBid === 0
                ? 'This will cancel your auction and return the NFT to your wallet. This cannot be undone.'
                : 'This auction has active bids. Removing it will immediately refund the highest bidder and return the NFT to your wallet. This cannot be undone.'
              }
            </p>

            {/* Warning for has-bids case */}
            {showRemoveConfirm.highestBid > 0n && (
              <div className="mt-3 bg-[#FFF7ED] border 
                border-[#FED7AA] rounded-md p-3 text-xs 
                text-[#92400E]">
                Highest bidder will be refunded{' '}
                <span className="font-semibold">
                  {formatSTT(showRemoveConfirm.highestBid)} STT
                </span>{' '}
                automatically.
              </div>
            )}

            {/* Error */}
            {removeError && (
              <p className="mt-3 text-xs text-[#EF4444]">
                {removeError}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowRemoveConfirm(null)
                  setRemoveError(null)
                }}
                disabled={
                  removingAuctionId === 
                  showRemoveConfirm.auctionId
                }
                className="flex-1 border border-[#E5E7EB] 
                  text-[#111111] rounded-md py-2 text-sm
                  hover:border-[#111111] transition-colors
                  disabled:cursor-not-allowed 
                  disabled:text-[#6B7280]"
              >
                Keep Auction
              </button>
              <button
                onClick={() => 
                  handleRemoveAuction(showRemoveConfirm)
                }
                disabled={
                  removingAuctionId === 
                  showRemoveConfirm.auctionId
                }
                className="flex-1 bg-[#EF4444] text-white 
                  rounded-md py-2 text-sm font-medium
                  hover:bg-[#DC2626] transition-colors
                  disabled:bg-[#FCA5A5] 
                  disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {removingAuctionId === 
                  showRemoveConfirm.auctionId ? (
                  <>
                    <span className="w-3 h-3 border-2 
                      border-white/40 border-t-white 
                      rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  showRemoveConfirm.highestBid === 0n ||
                  showRemoveConfirm.highestBid === 0
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

export default Dashboard;
