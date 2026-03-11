// src/pages/CreateAuction.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  useAccount, 
  useWriteContract, 
  usePublicClient 
} from 'wagmi';
import { 
  parseEther, 
  isAddress, 
  decodeEventLog 
} from 'viem';
import { 
  CONTRACT_ADDRESSES, 
  AUCTION_HOUSE_ABI, 
  MOCK_NFT_ABI 
} from '../config/contracts';
import { 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  Settings, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Coins,
  LayoutList,
  ChevronRight
} from 'lucide-react';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3MzEwZWEyYi1iN2VlLTQxZjAtYmQ4Zi02NzBkYTM1MGNiY2IiLCJlbWFpbCI6ImpvaG5ueXdlc3RtdWxhMjRAb3V0bG9vay5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYzhiNTUzZGUzZjI3MzQ1ZmRjMDIiLCJzY29wZWRLZXlTZWNyZXQiOiJjY2U1MTU0ZGZjMmQ2ZjIxOWM1MmIwMmMzZDlmNDYyNGUxNzZhODlhOWEyOTA4MTU3ZDcyZjdjZjM3YmE4YTA0IiwiZXhwIjoxODA0NzcwOTY4fQ.ZUFCLknn0AW5PKvDWGFlrThLHHoBmKILjD_nxXD4bPg'

const CreateAuction = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    document.title = "Stillbid — Create Auction";
  }, []);

  const [mode, setMode] = useState('mint'); // 'mint' or 'list'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reservePrice: '',
    duration: '86400', // 24h default
    showReserve: true,
    nftContract: '',
    tokenId: ''
  });

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [ipfsHash, setIpfsHash] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const [status, setStatus] = useState('idle'); // 'idle', 'minting', 'approving', 'creating', 'success', 'error'
  const [error, setError] = useState('');
  const [finalAuctionId, setFinalAuctionId] = useState(null);

  // Validation
  const errors = useMemo(() => {
    const errs = {};
    if (mode === 'mint') {
      if (!formData.name) errs.name = 'NFT Name is required';
      if (formData.name.length > 50) errs.name = 'Max 50 characters';
    } else {
      if (!isAddress(formData.nftContract)) errs.nftContract = 'Invalid NFT contract address';
      if (!formData.tokenId || isNaN(formData.tokenId)) errs.tokenId = 'Invalid Token ID';
    }
    if (!formData.reservePrice || isNaN(formData.reservePrice) || Number(formData.reservePrice) < 0) {
      errs.reservePrice = 'Invalid reserve price';
    }
    return errs;
  }, [formData, mode]);

  const isValid = Object.keys(errors).length === 0 && isConnected;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setIpfsHash(null)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
    await uploadImageToIPFS(file)
  }

  const uploadImageToIPFS = async (file) => {
    if (!file) return null
    setIsUploadingImage(true)
    setUploadError(null)
    try {
      const formDataToUpload = new FormData()
      formDataToUpload.append('file', file)
      formDataToUpload.append('pinataMetadata', JSON.stringify({ 
        name: formData.name || 'Stillbid NFT' 
      }))
      formDataToUpload.append('pinataOptions', JSON.stringify({ 
        cidVersion: 1 
      }))
      const res = await fetch(PINATA_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formDataToUpload,
      })
      if (!res.ok) throw new Error('IPFS upload failed')
      const data = await res.json()
      const hash = data.IpfsHash
      setIpfsHash(hash)
      return `ipfs://${hash}`
    } catch (err) {
      setUploadError('Image upload failed. Using placeholder.')
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const executeMintAndList = async () => {
    try {
      setStatus('minting');
      setError('');

      // 1. Mint NFT
      const tokenURI = ipfsHash ? `ipfs://${ipfsHash}` : (imageFile ? imagePreview : 'https://somnia.network/placeholder.png');
      const mintHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MOCK_NFT,
        abi: MOCK_NFT_ABI,
        functionName: 'mint',
        args: [address, tokenURI],
      });

      const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
      
      // Extract TokenId from Transfer event log
      // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
      const transferLog = mintReceipt.logs.find(log => log.address.toLowerCase() === CONTRACT_ADDRESSES.MOCK_NFT.toLowerCase());
      const decodedTransfer = decodeEventLog({
        abi: MOCK_NFT_ABI,
        eventName: 'Transfer',
        data: transferLog.data,
        topics: transferLog.topics,
      });
      const newTokenId = decodedTransfer.args.tokenId;

      // 2. Approve AuctionHouse
      setStatus('approving');
      const approveHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MOCK_NFT,
        abi: MOCK_NFT_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.AUCTION_HOUSE, newTokenId],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // 3. Create Auction
      setStatus('creating');
      const createHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
        abi: AUCTION_HOUSE_ABI,
        functionName: 'createAuction',
        args: [
          CONTRACT_ADDRESSES.MOCK_NFT,
          newTokenId,
          parseEther(formData.reservePrice),
          BigInt(formData.duration)
        ],
      });
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

      // Extract AuctionId from AuctionCreated event
      const auctionLog = createReceipt.logs.find(log => log.address.toLowerCase() === CONTRACT_ADDRESSES.AUCTION_HOUSE.toLowerCase());
      const decodedCreate = decodeEventLog({
        abi: AUCTION_HOUSE_ABI,
        eventName: 'AuctionCreated',
        data: auctionLog.data,
        topics: auctionLog.topics,
      });

      setFinalAuctionId(decodedCreate.args.auctionId.toString());
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setImageFile(null)
      setImagePreview(null)
      setIpfsHash(null)
      setUploadError(null)
      setIsUploadingImage(false)
      setError(err.shortMessage || 'Transaction failed. Please try again.');
    }
  };

  const executeListExisting = async () => {
    try {
      setStatus('approving');
      setError('');

      // 1. Approve AuctionHouse (using minimal ABI for compatibility)
      const approveHash = await writeContractAsync({
        address: formData.nftContract,
        abi: ["function approve(address spacer, uint256 tokenId) public"],
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.AUCTION_HOUSE, BigInt(formData.tokenId)],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // 2. Create Auction
      setStatus('creating');
      const createHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.AUCTION_HOUSE,
        abi: AUCTION_HOUSE_ABI,
        functionName: 'createAuction',
        args: [
          formData.nftContract,
          BigInt(formData.tokenId),
          parseEther(formData.reservePrice),
          BigInt(formData.duration)
        ],
      });
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

      const auctionLog = createReceipt.logs.find(log => log.address.toLowerCase() === CONTRACT_ADDRESSES.AUCTION_HOUSE.toLowerCase());
      const decodedCreate = decodeEventLog({
        abi: AUCTION_HOUSE_ABI,
        eventName: 'AuctionCreated',
        data: auctionLog.data,
        topics: auctionLog.topics,
      });

      setFinalAuctionId(decodedCreate.args.auctionId.toString());
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err.shortMessage || 'Transaction failed. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (mode === 'mint') executeMintAndList();
    else executeListExisting();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        
        {/* Header */}
        <Link to="/" className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111] transition-colors">
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-[#111111]">Create Auction</h1>
          <p className="text-sm text-[#6B7280] mt-1">List an NFT for live auction on Somnia.</p>
        </div>

        {/* Wallet Warning */}
        {!isConnected && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] text-[#92400E] rounded-md p-4 text-sm mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            Connect your wallet to create an auction.
          </div>
        )}

        {/* Mode Toggle */}
        <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden flex mb-6 shadow-sm">
          <button 
            onClick={() => { setMode('mint'); setStatus('idle'); setImageFile(null); setImagePreview(null); setIpfsHash(null); setUploadError(null); setIsUploadingImage(false); }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${mode === 'mint' ? 'border-b-2 border-[#111111] text-[#111111] bg-gray-50/50' : 'text-[#6B7280] border-b-2 border-transparent hover:text-[#111111]'}`}
          >
            Mint & List
          </button>
          <button 
            onClick={() => { setMode('list'); setStatus('idle'); }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${mode === 'list' ? 'border-b-2 border-[#111111] text-[#111111] bg-gray-50/50' : 'text-[#6B7280] border-b-2 border-transparent hover:text-[#111111]'}`}
          >
            List Existing NFT
          </button>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-10 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#111111]">Auction Created!</h2>
            <p className="text-[#6B7280] mt-2 mb-8 lowercase tracking-tight font-medium">Your NFT is now live on the Somnia Auction House.</p>
            <button 
              onClick={() => { navigate(`/auction/${finalAuctionId}`); setImageFile(null); setImagePreview(null); setIpfsHash(null); setUploadError(null); setIsUploadingImage(false); }}
              className="w-full bg-[#111111] text-white py-3 rounded-md font-medium text-sm hover:bg-[#333333] transition-colors flex items-center justify-center gap-2"
            >
              View Auction
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          /* Form Content */
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 shadow-sm space-y-8">
            
            {/* Steps Indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${status === 'minting' || status === 'idle' ? 'bg-[#111111] text-white' : 'bg-green-500 text-white'}`}>
                  {status === 'approving' || status === 'creating' ? <CheckCircle2 size={10} /> : '1'}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${status === 'minting' || status === 'idle' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>NFT Details</span>
              </div>
              <ChevronRight size={14} className="text-[#E5E7EB]" />
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${status === 'approving' || status === 'creating' ? 'bg-[#111111] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>2</span>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${status === 'approving' || status === 'creating' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Listing</span>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="space-y-6">
              {mode === 'mint' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 italic">NFT Name</label>
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Cosmic Drift #001"
                      className="w-full border border-[#E5E7EB] rounded-md px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white font-medium"
                    />
                    {errors.name && <p className="text-[10px] text-[#EF4444] mt-1.5 font-bold uppercase tracking-widest">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] 
                      uppercase tracking-wide mb-1 block">
                      NFT Image (optional)
                    </label>

                    {/* Upload box — Mint & List mode only */}
                    <label
                      htmlFor="nft-image-upload"
                      className="flex flex-col items-center justify-center 
                        w-full h-36 border-2 border-dashed border-[#E5E7EB] 
                        rounded-md cursor-pointer hover:border-[#111111] 
                        transition-colors bg-white"
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="NFT preview"
                          className="h-full w-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg"
                            className="w-8 h-8 text-[#6B7280]"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 
                                 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 
                                 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-sm text-[#6B7280]">
                            Click to upload image
                          </span>
                          <span className="text-xs text-[#6B7280]">
                            PNG, JPG, GIF up to 10MB
                          </span>
                        </div>
                      )}
                    </label>
                    <input
                      id="nft-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {/* Clear button — only show when image is selected */}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null) }}
                        className="mt-2 text-xs text-[#EF4444] hover:underline"
                      >
                        Remove image
                      </button>
                    )}

                    <p className="text-xs text-[#6B7280] mt-1">
                      Leave blank to use a placeholder image.
                    </p>

                    {isUploadingImage && (
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-[#E5E7EB] 
                          border-t-[#111111] rounded-full animate-spin inline-block" />
                        Uploading image to IPFS...
                      </p>
                    )}
                    {ipfsHash && !isUploadingImage && (
                      <p className="text-xs text-[#10B981] mt-1">
                        ✓ Image uploaded to IPFS
                      </p>
                    )}
                    {uploadError && (
                      <p className="text-xs text-[#F59E0B] mt-1">
                        ⚠ {uploadError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 italic">Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe your NFT..."
                      className="w-full border border-[#E5E7EB] rounded-md px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white font-medium resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 italic">NFT Contract Address</label>
                    <input 
                      name="nftContract"
                      value={formData.nftContract}
                      onChange={handleInputChange}
                      placeholder="0x..."
                      className="w-full border border-[#E5E7EB] rounded-md px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white font-mono"
                    />
                    {errors.nftContract && <p className="text-[10px] text-[#EF4444] mt-1.5 font-bold uppercase tracking-widest">{errors.nftContract}</p>}
                    <p className="text-[10px] text-[#6B7280] mt-1.5 font-medium lowercase italic opacity-80">The ERC-721 contract address where your NFT is deployed.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 italic">Token ID</label>
                    <input 
                      name="tokenId"
                      type="number"
                      value={formData.tokenId}
                      onChange={handleInputChange}
                      placeholder="e.g. 42"
                      className="w-full border border-[#E5E7EB] rounded-md px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white font-medium"
                    />
                    {errors.tokenId && <p className="text-[10px] text-[#EF4444] mt-1.5 font-bold uppercase tracking-widest">{errors.tokenId}</p>}
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 italic">Reserve Price (STT)</label>
                  <input 
                    name="reservePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reservePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full border border-[#E5E7EB] rounded-md px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white font-bold"
                  />
                  {errors.reservePrice && <p className="text-[10px] text-[#EF4444] mt-1.5 font-bold uppercase tracking-widest">{errors.reservePrice}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 italic">Duration</label>
                  <select 
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full border border-[#E5E7EB] rounded-md px-4 py-[14px] text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white font-medium appearance-none cursor-pointer"
                  >
                    <option value="3600">1 Hour</option>
                    <option value="21600">6 Hours</option>
                    <option value="43200">12 Hours</option>
                    <option value="86400">24 Hours</option>
                    <option value="259200">3 Days</option>
                    <option value="604800">7 Days</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F3F4F6]">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      name="showReserve"
                      checked={formData.showReserve}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#E5E7EB] rounded-full peer peer-checked:bg-[#111111] transition-all" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111111] tracking-tight">Show reserve price publicly</p>
                    <p className="text-[10px] text-[#6B7280] lowercase italic opacity-80">Bidders will see the milestone they need to hit.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error Banner */}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 text-xs font-bold flex items-center gap-3 animate-pulse">
                <AlertCircle size={18} />
                {error.toUpperCase()}
              </div>
            )}

            {/* Submit Button & Step Tracker */}
            <div className="pt-4 space-y-4">
              <button 
                onClick={handleSubmit}
                disabled={!isValid || status === 'minting' || status === 'approving' || status === 'creating' || isUploadingImage}
                className={`w-full py-4 rounded-md font-bold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 ${!isValid || status !== 'idle' && status !== 'error' || isUploadingImage ? 'bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed shadow-none font-bold' : 'bg-[#111111] text-white hover:bg-[#333333] shadow-lg shadow-black/5 active:scale-[0.98]'}`}
              >
                {isUploadingImage ? <><Loader2 className="animate-spin" size={16} /> Uploading Image...</> : (
                  <>
                    {status === 'minting' && <><Loader2 className="animate-spin" size={16} /> Minting NFT...</>}
                    {status === 'approving' && <><Loader2 className="animate-spin" size={16} /> Approving Transfer...</>}
                    {status === 'creating' && <><Loader2 className="animate-spin" size={16} /> Finalizing Auction...</>}
                    {(status === 'idle' || status === 'error' || status === 'success') && (mode === 'mint' ? 'Mint & Publish' : 'Authorize & List')}
                  </>
                )}
              </button>
              
              {/* Progress Detail */}
              {(status === 'minting' || status === 'approving' || status === 'creating') && (
                <div className="flex justify-between items-center px-2">
                  <span className="text-[9px] font-black text-[#111111] uppercase tracking-[0.3em]">
                    {status === 'minting' ? 'Phase 1/3' : status === 'approving' ? 'Phase 2/3' : 'Phase 3/3'}
                  </span>
                  <div className="flex gap-1">
                    <div className={`w-3 h-1 rounded-full ${status === 'minting' ? 'bg-[#111111]' : 'bg-green-500'}`} />
                    <div className={`w-3 h-1 rounded-full ${status === 'approving' ? 'bg-[#111111]' : status === 'creating' ? 'bg-green-500' : 'bg-[#E5E7EB]'}`} />
                    <div className={`w-3 h-1 rounded-full ${status === 'creating' ? 'bg-[#111111]' : 'bg-[#E5E7EB]'}`} />
                  </div>
                </div>
              )}

              <p className="text-xs text-[#6B7280] text-center mt-6">Powered by Stillbid on Somnia Testnet.</p>
            </div>

            {/* Platform Notice */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111111] mb-2">Protocol Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-[#6B7280]">Platform Fee</span>
                  <span className="text-[#111111]">2.5%</span>
                </div>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-[#6B7280]">Verification Layer</span>
                  <span className="text-[#111111]">Somnia Reactivity</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAuction;
