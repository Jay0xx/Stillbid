// c:\Users\a\.gemini\antigravity\scratch\mock-nft\frontend\src\pages\Dashboard.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { usePublicClient } from 'wagmi'
import { formatAddress } from '../utils/format'
import useNFTMetadata from '../hooks/useNFTMetadata'
import useWatchlist from '../hooks/useWatchlist'
import WatchButton from '../components/WatchButton'
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

// Gas configuration for Somnia Testnet
const LOW_GAS_CONFIG = {
  maxFeePerGas: undefined,
  maxPriorityFeePerGas: undefined,
};

const BidStatusBadge = ({ status }) => {
  const styles = {
    Winning: 'bg-[#F0FDF4] text-[#10B981]',
    Outbid:  'bg-[#FEF2F2] text-[#EF4444]',
    Won:     'bg-[#F0FDF4] text-[#10B981]',
    Lost:    'bg-[#F3F4F6] text-[#6B7280]',
    Expired: 'bg-[#FFF7ED] text-[#F59E0B]',
  }
  const labels = {
    Winning: '👑 Winning',
    Outbid:  'Outbid',
    Won:     '🏆 Won',
    Lost:    'Lost',
    Expired: 'Expired',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 
      rounded-full ${styles[status] || 
      'bg-[#F3F4F6] text-[#6B7280]'}`}>
      {labels[status] || status}
    </span>
  )
}

const BidAuctionCard = ({ bidData, isExpanded, 
  onToggle, onNavigate }) => {
  const { auction, myHighestBid, history, 
          status, auctionId } = bidData
  const { data: tokenURIData } = useReadContracts({
    contracts: [{
      address: auction.nftContract,
      abi: MOCK_NFT_ABI,
      functionName: 'tokenURI',
      args: [auction.tokenId],
    }],
    query: { enabled: !!auction.nftContract }
  })
  const tokenURI = tokenURIData?.[0]?.result || ''
  const { metadata } = useNFTMetadata(tokenURI)

  return (
    <div className="bg-white border border-[#E5E7EB] 
      rounded-lg overflow-hidden">
      
      {/* Main row */}
      <div className="p-4 flex items-center gap-4">
        
        {/* NFT thumbnail */}
        <div className="w-14 h-14 rounded-md overflow-hidden 
          flex-shrink-0 bg-[#F3F4F6]">
          <NFTImage
            tokenURI={tokenURI}
            alt="NFT"
            className="w-full h-full object-cover"
            placeholderClassName="w-full h-full 
              bg-[#F3F4F6] flex items-center 
              justify-center"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 
            flex-wrap">
            <p className="text-sm font-semibold 
              text-[#111111] truncate">
              {metadata?.name || 
               `Auction #${auctionId}`}
            </p>
            <BidStatusBadge status={status} />
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Auction #{auctionId}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-[10px] uppercase 
                tracking-wide text-[#6B7280]">
                Your Highest Bid
              </p>
              <p className="text-sm font-bold 
                text-[#111111]">
                {formatEther(myHighestBid)} STT
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase 
                tracking-wide text-[#6B7280]">
                Current Highest
              </p>
              <p className="text-sm font-bold 
                text-[#111111]">
                {formatEther(auction.highestBid)} STT
              </p>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col gap-2 
          flex-shrink-0 items-end">
          <button
            onClick={() => onNavigate(auctionId)}
            className="border border-[#E5E7EB] 
              text-[#111111] text-xs px-3 py-1.5 
              rounded-md hover:border-[#111111] 
              transition-colors"
          >
            View
          </button>
          <button
            onClick={onToggle}
            className="text-xs text-[#6B7280] 
              hover:text-[#111111] transition-colors"
          >
            {isExpanded ? 'Hide history ↑' : 
              `History (${history.length}) ↓`}
          </button>
        </div>
      </div>

      {/* Expanded bid history */}
      {isExpanded && (
        <div className="border-t border-[#F3F4F6] 
          bg-[#FAFAFA] px-4 py-3">
          <p className="text-xs font-bold uppercase 
            tracking-widest text-[#6B7280] mb-3">
            Your Bid History
          </p>
          {history.length === 0 ? (
            <p className="text-xs text-[#6B7280]">
              No bids found.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((bid, i) => (
                <div key={i}
                  className="flex justify-between 
                    items-center py-2 border-b 
                    border-[#F3F4F6] last:border-0">
                  <div className="flex items-center 
                    gap-2">
                    {i === 0 && (
                      <span className="text-[10px] 
                        bg-[#111111] text-white 
                        px-1.5 py-0.5 rounded 
                        font-medium">
                        Latest
                      </span>
                    )}
                    <span className="text-xs 
                      font-mono text-[#6B7280]">
                      {bid.txHash
                        ? `${bid.txHash.slice(0,6)}...${bid.txHash.slice(-4)}`
                        : `Block #${bid.blockNumber}`
                      }
                    </span>
                  </div>
                  <span className="text-sm font-bold 
                    text-[#111111]">
                    {formatEther(bid.amount)} STT
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expiry reason */}
          <div className="mt-3 pt-3 border-t 
            border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280]">
              {status === 'Winning' && 
                '🟢 You are the current highest bidder. Bid expires if you are outbid.'}
              {status === 'Outbid' && 
                '🔴 You were outbid. Place a higher bid to stay in the auction.'}
              {status === 'Won' && 
                '🏆 You won this auction. The NFT has been transferred to your wallet.'}
              {status === 'Lost' && 
                '⚫ This auction was won by another bidder. Your bid has expired.'}
              {status === 'Expired' && 
                '⏱ This auction ended without a sale. Your bid has expired.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const AssetCard = ({ nft }) => {
  const { metadata } = useNFTMetadata(
    nft.tokenURI || ''
  )
  return (
    <div className="border border-[#E5E7EB] 
      rounded-lg overflow-hidden 
      hover:border-[#111111] transition-all 
      duration-200 bg-white">
      <div className="h-40 bg-[#F3F4F6] 
        overflow-hidden">
        <NFTImage
          tokenURI={nft.tokenURI || ''}
          alt={metadata?.name || 'NFT'}
          className="w-full h-full object-cover"
          placeholderClassName="w-full h-full 
            bg-[#F3F4F6] flex items-center 
            justify-center"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium 
          text-[#111111] truncate">
          {metadata?.name || 
           `Stillbid #${nft.tokenId}`}
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Token #{nft.tokenId}
        </p>
        {metadata?.description && (
          <p className="text-xs text-[#9CA3AF] 
            mt-1 truncate">
            {metadata.description}
          </p>
        )}
        <span className="inline-block mt-2 
          text-xs bg-[#111111] text-white 
          px-2 py-0.5 rounded-full">
          Stillbid
        </span>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient()
  const { 
    watchlist, 
    removeFromWatchlist,
    watchCount 
  } = useWatchlist()

  const [activeTab, setActiveTab] = useState('auctions')
  const [walletNFTs, setWalletNFTs] = useState([])
  const [isFetchingAssets, setIsFetchingAssets] = useState(false)
  const [assetsFetchError, setAssetsFetchError] = useState(null)
  const [assetsSearchQuery, setAssetsSearchQuery] = useState('')

  // Remove state variables
  const [removingAuctionId, setRemovingAuctionId] = useState(null)
  const [removeError, setRemoveError] = useState(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null)

  const [acceptingBidId, setAcceptingBidId] = useState(null)
  const [acceptBidError, setAcceptBidError] = useState(null)
  const [myBids, setMyBids] = useState([])
  const [isFetchingBids, setIsFetchingBids] = useState(false)
  const [bidsError, setBidsError] = useState(null)
  const [expandedBidId, setExpandedBidId] = useState(null)

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

  const dashboardTokenURIs = useReadContracts({
    contracts: (myAuctions || []).map(auction => ({
      address: auction.nftContract,
      abi: MOCK_NFT_ABI,
      functionName: 'tokenURI',
      args: [auction.tokenId],
    })),
    query: { enabled: (myAuctions || []).length > 0 }
  })

  const myAuctionsWithImages = (myAuctions || []).map(
    (auction, i) => ({
      ...auction,
      resolvedTokenURI: 
        dashboardTokenURIs.data?.[i]?.result || ''
    })
  )

  const { data: watchedAuctionsData, 
          isLoading: isLoadingWatched,
          refetch: refetchWatched } = useReadContracts({
    contracts: watchlist.map(w => ({
      address: AUCTION_HOUSE_ADDRESS,
      abi: AUCTION_HOUSE_ABI,
      functionName: 'getAuction',
      args: [BigInt(w.id)],
    })),
    query: { enabled: watchlist.length > 0 }
  })

  const watchedAuctions = useMemo(() => {
    if (!watchedAuctionsData) return []
    return watchedAuctionsData
      .map((res, i) => {
        if (res.status !== 'success') return null
        const entry = watchlist[i]
        const auction = res.result
        const priceAtWatch = BigInt(
          entry?.priceAtWatch || '0'
        )
        const currentPrice = auction.highestBid || 0n
        const priceChange = currentPrice - priceAtWatch
        return {
          ...auction,
          watchEntry: entry,
          priceAtWatch,
          priceChange,
          priceIncreased: priceChange > 0n,
        }
      })
      .filter(Boolean)
  }, [watchedAuctionsData, watchlist])

  const watchedTokenURIs = useReadContracts({
    contracts: watchedAuctions.map(a => ({
      address: a.nftContract,
      abi: MOCK_NFT_ABI,
      functionName: 'tokenURI',
      args: [a.tokenId],
    })),
    query: { enabled: watchedAuctions.length > 0 }
  })

  const watchedWithImages = watchedAuctions.map(
    (auction, i) => ({
      ...auction,
      resolvedTokenURI: 
        watchedTokenURIs.data?.[i]?.result || ''
    })
  )

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

  const handleAcceptBid = async (auction) => {
    setAcceptingBidId(auction.auctionId)
    setAcceptBidError(null)
    try {
      const hash = await writeContractAsync({
        address: AUCTION_HOUSE_ADDRESS,
        abi: AUCTION_HOUSE_ABI,
        functionName: 'acceptBid',
        args: [BigInt(auction.auctionId)],
        maxFeePerGas: LOW_GAS_CONFIG.maxFeePerGas,
        maxPriorityFeePerGas:
          LOW_GAS_CONFIG.maxPriorityFeePerGas,
      })
      await waitForTransactionReceipt(wagmiConfig, { 
        hash 
      })
      setAcceptingBidId(null)
      navigate(`/settle/${auction.auctionId}`)
    } catch (err) {
      setAcceptBidError(
        err?.shortMessage || 'Transaction failed.'
      )
      setAcceptingBidId(null)
    }
  }

  const fetchWalletAssets = async () => {
    if (!address || !publicClient) return
    setIsFetchingAssets(true)
    setAssetsFetchError(null)
    try {
      const totalTokensRaw = await publicClient
        .readContract({
          address: MOCK_NFT_ADDRESS,
          abi: MOCK_NFT_ABI,
          functionName: 'tokenCounter',
        })

      // Normalize to Number — tokenCounter may return
      // bigint or number depending on RPC response
      const totalTokens = Number(totalTokensRaw)

      if (!totalTokens || totalTokens === 0) {
        setWalletNFTs([])
        setIsFetchingAssets(false)
        return
      }

      // MockNFT starts tokenCounter at 0 and
      // increments before assigning — first token
      // is ID 1, last is ID totalTokens
      const tokenIds = Array.from(
        { length: totalTokens },
        (_, i) => BigInt(i + 1)
      )

      const ownerResults = await publicClient
        .multicall({
          contracts: tokenIds.map(id => ({
            address: MOCK_NFT_ADDRESS,
            abi: MOCK_NFT_ABI,
            functionName: 'ownerOf',
            args: [id],
          })),
          allowFailure: true,
        })

      const uriResults = await publicClient
        .multicall({
          contracts: tokenIds.map(id => ({
            address: MOCK_NFT_ADDRESS,
            abi: MOCK_NFT_ABI,
            functionName: 'tokenURI',
            args: [id],
          })),
          allowFailure: true,
        })

      const ownedNFTs = []
      for (let i = 0; i < tokenIds.length; i++) {
        const ownerResult = ownerResults[i]
        if (
          ownerResult.status === 'success' &&
          ownerResult.result?.toLowerCase() ===
            address.toLowerCase()
        ) {
          const tokenId = tokenIds[i]
          const tokenURI =
            uriResults[i].status === 'success'
              ? uriResults[i].result
              : ''
          ownedNFTs.push({
            contractAddress: MOCK_NFT_ADDRESS,
            tokenId: tokenId.toString(),
            tokenURI,
            isStillbid: true,
            collectionName: 'Stillbid',
          })
        }
      }

      setWalletNFTs(ownedNFTs)
      // Empty wallet is NOT an error —
      // the empty state JSX handles it cleanly

    } catch (err) {
      console.error('fetchWalletAssets error:', err)
      setAssetsFetchError(
        'Could not load assets. Please try again.'
      )
    } finally {
      setIsFetchingAssets(false)
    }
  }

  const fetchMyBids = async () => {
    if (!address || !publicClient) return
    setIsFetchingBids(true)
    setBidsError(null)
    try {
      // Read auctionCounter directly — do NOT use
      // getActiveAuctions() as it misses ended auctions
      const auctionCounter = await publicClient
        .readContract({
          address: AUCTION_HOUSE_ADDRESS,
          abi: AUCTION_HOUSE_ABI,
          functionName: 'auctionCounter',
        })

      // auctionCounter starts at 1 and post-increments
      // so total auctions = auctionCounter - 1
      // IDs are 1 ... (auctionCounter - 1)
      const totalAuctions = Number(auctionCounter) - 1
      if (totalAuctions <= 0) {
        setMyBids([])
        setIsFetchingBids(false)
        return
      }

      // Build ALL auction IDs — not just active ones
      const allIds = Array.from(
        { length: totalAuctions },
        (_, i) => BigInt(i + 1)
      )

      // Fetch ALL auctions in one multicall
      const auctionResults = await publicClient
        .multicall({
          contracts: allIds.map(id => ({
            address: AUCTION_HOUSE_ADDRESS,
            abi: AUCTION_HOUSE_ABI,
            functionName: 'getAuction',
            args: [id],
          })),
          allowFailure: true,
        })

      // Fetch ALL user BidPlaced logs in ONE call
      // before the loop — never inside the loop
      let allUserLogs = []
      try {
        const latestBlock = await publicClient
          .getBlockNumber()
        const fromBlock = latestBlock > 50000n
          ? latestBlock - 50000n
          : 0n
        allUserLogs = await publicClient.getLogs({
          address: AUCTION_HOUSE_ADDRESS,
          event: {
            type: 'event',
            name: 'BidPlaced',
            inputs: [
              { indexed: true, name: 'auctionId',
                type: 'uint256' },
              { indexed: true, name: 'bidder',
                type: 'address' },
              { indexed: false, name: 'amount',
                type: 'uint256' },
            ],
          },
          args: { bidder: address },
          fromBlock,
          toBlock: 'latest',
        })
      } catch {
        allUserLogs = []
      }

      const myBidAuctions = []

      for (let i = 0; i < allIds.length; i++) {
        const result = auctionResults[i]
        if (result.status !== 'success') continue
        const auction = result.result
        const auctionId = allIds[i].toString()

        const isHighestBidder =
          auction.highestBidder?.toLowerCase() ===
          address.toLowerCase()

        // Filter pre-fetched logs for this auction
        // Pure JS — no RPC call inside the loop
        const history = allUserLogs
          .filter(log =>
            log.args.auctionId?.toString() === auctionId
          )
          .map(log => ({
            amount: log.args.amount,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
          }))
          .sort((a, b) =>
            Number(b.blockNumber) - Number(a.blockNumber)
          )

        // Include if user is highest bidder OR 
        // has bid logs for this auction
        if (!isHighestBidder && history.length === 0) {
          continue
        }

        const isActive =
          auction.active &&
          Number(auction.endTime) >
            Math.floor(Date.now() / 1000)

        let status = 'Outbid'
        if (isActive && isHighestBidder) {
          status = 'Winning'
        } else if (isActive && !isHighestBidder) {
          status = 'Outbid'
        } else if (auction.settled && isHighestBidder) {
          status = 'Won'
        } else if (
          auction.settled &&
          !isHighestBidder &&
          auction.highestBid > 0n
        ) {
          status = 'Lost'
        } else if (
          !auction.active && !auction.settled
        ) {
          status = 'Expired'
        }

        const myHighestBid =
          history.length > 0
            ? history.reduce(
                (max, b) =>
                  b.amount > max ? b.amount : max,
                0n
              )
            : isHighestBidder
            ? auction.highestBid
            : 0n

        myBidAuctions.push({
          auctionId,
          auction,
          myHighestBid,
          history,
          status,
          isHighestBidder,
        })
      }

      myBidAuctions.sort(
        (a, b) =>
          Number(b.auctionId) - Number(a.auctionId)
      )

      setMyBids(myBidAuctions)
    } catch (err) {
      console.error('fetchMyBids error:', err)
      setBidsError(
        'Could not load bid history. Please try again.'
      )
    } finally {
      setIsFetchingBids(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'assets' && address) {
      fetchWalletAssets()
    }
  }, [activeTab, address])

  useEffect(() => {
    if (activeTab === 'bids' && address) {
      fetchMyBids()
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
            Watching {watchCount > 0 && (
              <span className="ml-1.5 bg-[#111111] text-white 
                text-[10px] px-1.5 py-0.5 rounded-full">
                {watchCount}
              </span>
            )}
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
                {myAuctionsWithImages.map((a) => (
                  <div 
                    key={a.auctionId.toString()} 
                    className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#111111] transition-all cursor-pointer group shadow-sm flex flex-col"
                  >
                    <div 
                      className="h-40 bg-[#F9FAFB] flex items-center justify-center border-b border-[#F3F4F6]"
                      onClick={() => navigate(`/auction/${a.auctionId}`)}
                    >
  <NFTImage
    tokenURI={a.resolvedTokenURI || ''}
    alt={a.nftName || 'NFT'}
    className="w-full h-full object-cover rounded-md"
    placeholderClassName="w-full h-full bg-[#F3F4F6] 
      flex items-center justify-center rounded-md"
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
                        {a.active && (a.highestBid > 0n || 
                          a.highestBid > 0) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptBid(a);
                            }}
                            disabled={acceptingBidId === a.auctionId}
                            className="bg-[#10B981] text-white text-xs 
                              px-3 py-1.5 rounded-md
                              hover:bg-[#059669] transition-colors
                              disabled:bg-[#6EE7B7]
                              disabled:cursor-not-allowed
                              flex items-center gap-1"
                          >
                            {acceptingBidId === a.auctionId ? (
                              <>
                                <span className="w-3 h-3 border-2 
                                  border-white/40 border-t-white 
                                  rounded-full animate-spin" />
                                Accepting...
                              </>
                            ) : (
                              '✓ Accept'
                            )}
                          </button>
                        )}
                      </div>
                      {/* Accept bid error */}
                      {acceptBidError && 
                       acceptingBidId === null && (
                        <p className="text-xs text-[#EF4444] mt-1">
                          {acceptBidError}
                        </p>
                      )}
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
          <div>
            {/* Header */}
            <div className="flex items-center 
              justify-between mb-6">
              <div>
                <h2 className="text-xs font-black uppercase 
                  tracking-[0.2em] text-[#6B7280]">
                  My Bids
                </h2>
                <div className="h-[1px] bg-[#E5E7EB] 
                  mt-2 mb-0" />
              </div>
              <button
                onClick={fetchMyBids}
                disabled={isFetchingBids}
                className="text-xs text-[#6B7280] 
                  hover:text-[#111111] border 
                  border-[#E5E7EB] rounded-md px-3 py-1.5
                  disabled:cursor-not-allowed 
                  transition-colors"
              >
                {isFetchingBids ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Loading skeleton */}
            {isFetchingBids && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i}
                    className="bg-white border 
                      border-[#E5E7EB] rounded-lg p-4 
                      animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 
                        bg-[#F3F4F6] rounded-md" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#F3F4F6] 
                          rounded w-1/2" />
                        <div className="h-3 bg-[#F3F4F6] 
                          rounded w-1/3" />
                        <div className="h-3 bg-[#F3F4F6] 
                          rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {bidsError && !isFetchingBids && (
              <div className="bg-[#FEF2F2] border 
                border-[#FECACA] text-[#991B1B] 
                rounded-md p-4 text-sm text-center">
                {bidsError}
                <button
                  onClick={fetchMyBids}
                  className="block mx-auto mt-2 
                    text-xs underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Bids list */}
            {!isFetchingBids && !bidsError && 
              myBids.length > 0 && (
              <div className="space-y-4">
                {myBids.map(bidData => (
                  <BidAuctionCard
                    key={bidData.auctionId}
                    bidData={bidData}
                    isExpanded={
                      expandedBidId === bidData.auctionId
                    }
                    onToggle={() => setExpandedBidId(
                      expandedBidId === bidData.auctionId
                        ? null
                        : bidData.auctionId
                    )}
                    onNavigate={(id) => 
                      navigate(`/auction/${id}`)
                    }
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isFetchingBids && !bidsError && 
              myBids.length === 0 && (
              <div className="bg-white border 
                border-[#E5E7EB] rounded-xl py-24 
                text-center">
                <Layout size={40} 
                  className="mx-auto text-[#E5E7EB] mb-4" />
                <p className="text-[#6B7280] font-medium">
                  No bids placed yet.
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Auctions you bid on will appear here 
                  with full history.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-[#111111] text-white 
                    px-4 py-2 rounded-md text-sm 
                    hover:bg-[#333333] transition-colors"
                >
                  Browse Auctions →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Watching Tab */}
        {activeTab === 'watching' && (
          <div>

            {/* Header */}
            <div className="flex items-center 
              justify-between mb-6">
              <div>
                <h2 className="text-xs font-black uppercase 
                  tracking-[0.2em] text-[#6B7280]">
                  Watching
                </h2>
                <div className="h-[1px] bg-[#E5E7EB] mt-2" />
              </div>
              <button
                onClick={refetchWatched}
                disabled={isLoadingWatched}
                className="text-xs text-[#6B7280] 
                  hover:text-[#111111] border border-[#E5E7EB] 
                  rounded-md px-3 py-1.5
                  disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingWatched ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Loading skeleton */}
            {isLoadingWatched && watchlist.length > 0 && (
              <div className="grid grid-cols-1 
                sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchlist.map((_, i) => (
                  <div key={i}
                    className="bg-white border border-[#E5E7EB] 
                      rounded-lg overflow-hidden animate-pulse">
                    <div className="h-40 bg-[#F3F4F6]" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-[#F3F4F6] 
                        rounded w-3/4" />
                      <div className="h-3 bg-[#F3F4F6] 
                        rounded w-1/2" />
                      <div className="h-3 bg-[#F3F4F6] 
                        rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Watched auctions grid */}
            {!isLoadingWatched && 
              watchedWithImages.length > 0 && (
              <div className="grid grid-cols-1 
                sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchedWithImages.map((auction) => {
                  const auctionId = 
                    auction.auctionId?.toString()
                  const secondsLeft = Math.max(0, 
                    Number(auction.endTime) - 
                    Math.floor(Date.now() / 1000)
                  )
                  const hours = Math.floor(
                    secondsLeft / 3600
                  )
                  const mins = Math.floor(
                    (secondsLeft % 3600) / 60
                  )
                  const secs = secondsLeft % 60
                  const timeStr = secondsLeft === 0 
                    ? 'Ended' 
                    : `${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`

                  return (
                    <div
                      key={auctionId}
                      className="bg-white border 
                        border-[#E5E7EB] rounded-lg 
                        overflow-hidden hover:border-[#111111] 
                        transition-all duration-200 
                        flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative h-40 
                        bg-[#F3F4F6] overflow-hidden">
                        <NFTImage
                          tokenURI={
                            auction.resolvedTokenURI || ''
                          }
                          alt="NFT"
                          className="w-full h-full 
                            object-cover"
                          placeholderClassName="w-full 
                            h-full bg-[#F3F4F6] flex 
                            items-center justify-center"
                        />
                        {/* Remove from watchlist */}
                        <div className="absolute top-2 
                          right-2">
                          <WatchButton
                            auctionId={auctionId}
                            currentPrice={
                              auction.highestBid
                            }
                            size="sm"
                          />
                        </div>
                        {/* Auction status badge */}
                        <div className="absolute top-2 
                          left-2">
                          {auction.active ? (
                            <span className="bg-green-500 
                              text-white text-[9px] 
                              font-bold px-2 py-0.5 
                              rounded uppercase tracking-wide">
                              Live
                            </span>
                          ) : (
                            <span className="bg-[#6B7280] 
                              text-white text-[9px] 
                              font-bold px-2 py-0.5 
                              rounded uppercase tracking-wide">
                              Ended
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex 
                        flex-col">
                        <p className="text-sm font-semibold 
                          text-[#111111] truncate mb-3">
                          Auction #{auctionId}
                        </p>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 
                          gap-3 mb-3">

                          {/* Current bid */}
                          <div className="bg-[#F9FAFB] 
                            rounded-md p-2">
                            <p className="text-[10px] 
                              uppercase tracking-wide 
                              text-[#6B7280] mb-0.5">
                              Current Bid
                            </p>
                            <p className="text-sm font-bold 
                              text-[#111111]">
                              {formatEther(
                                auction.highestBid || 0n
                              )} STT
                            </p>
                          </div>

                          {/* Price change since watching */}
                          <div className="bg-[#F9FAFB] 
                            rounded-md p-2">
                            <p className="text-[10px] 
                              uppercase tracking-wide 
                              text-[#6B7280] mb-0.5">
                              Since Watching
                            </p>
                            <p className={`text-sm font-bold
                              ${auction.priceIncreased 
                                ? 'text-[#10B981]' 
                                : 'text-[#6B7280]'}`}>
                              {auction.priceIncreased 
                                ? '+' : ''}
                              {formatEther(
                                auction.priceChange || 0n
                              )} STT
                            </p>
                          </div>

                          {/* Countdown */}
                          <div className="bg-[#F9FAFB] 
                            rounded-md p-2">
                            <p className="text-[10px] 
                              uppercase tracking-wide 
                              text-[#6B7280] mb-0.5">
                              Time Left
                            </p>
                            <p className={`text-sm font-bold
                              ${secondsLeft < 3600 && 
                                secondsLeft > 0 
                                ? 'text-[#EF4444]' 
                                : 'text-[#111111]'}`}>
                              {timeStr}
                            </p>
                          </div>

                          {/* Bid count */}
                          <div className="bg-[#F9FAFB] 
                            rounded-md p-2">
                            <p className="text-[10px] 
                              uppercase tracking-wide 
                              text-[#6B7280] mb-0.5">
                              Bids
                            </p>
                            <p className="text-sm font-bold 
                              text-[#111111]">
                              {auction.highestBid > 0n 
                                ? '1+' 
                                : '0'}
                            </p>
                          </div>
                        </div>

                        {/* View button */}
                        <button
                          onClick={() => 
                            navigate(`/auction/${auctionId}`)
                          }
                          className="mt-auto w-full border 
                            border-[#E5E7EB] text-[#111111] 
                            text-xs py-2 rounded-md 
                            hover:border-[#111111] 
                            hover:bg-[#F9FAFB]
                            transition-colors"
                        >
                          View Auction →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state */}
            {!isLoadingWatched && 
              watchlist.length === 0 && (
              <div className="bg-white border 
                border-[#E5E7EB] rounded-xl py-24 
                text-center">
                <p className="text-4xl mb-4">🔭</p>
                <p className="text-[#111111] font-medium">
                  No auctions in your watchlist.
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Click the 👁 icon on any auction 
                  to start watching it.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-[#111111] text-white 
                    px-4 py-2 rounded-md text-sm 
                    hover:bg-[#333333] transition-colors"
                >
                  Browse Auctions →
                </button>
              </div>
            )}

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
              walletNFTs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-[#111111] uppercase tracking-widest">
                    Stillbid
                  </span>
                  <span className="bg-[#111111] text-white text-xs px-2 py-0.5 rounded-full">
                    {walletNFTs.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {walletNFTs
                    .filter(n =>
                      assetsSearchQuery === '' ||
                      n.tokenId.includes(assetsSearchQuery)
                    )
                    .map(nft => (
                      <AssetCard
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                        nft={nft}
                      />
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
