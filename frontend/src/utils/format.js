// src/utils/format.js
import { formatEther } from 'viem';

export const formatSTT = (bigintValue, decimals = 4) => {
  if (bigintValue === undefined || bigintValue === null) return "0.00";
  const formatted = formatEther(bigintValue);
  const parts = formatted.split('.');
  if (parts.length === 1) return `${parts[0]}.00`;
  
  let rest = parts[1].substring(0, decimals);
  while (rest.length < 2) rest += '0';
  
  // Trim trailing zeros but keep at least 2
  rest = rest.replace(/0+$/, '');
  while (rest.length < 2) rest += '0';
  
  return `${parts[0]}.${rest}`;
};

export const formatAddress = (address, chars = 4) => {
  if (!address) return "—";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

export const formatTimeAgo = (unixTimestamp) => {
  const ts = typeof unixTimestamp === 'bigint' ? Number(unixTimestamp) : unixTimestamp;
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

export const formatDate = (unixTimestamp) => {
  const ts = typeof unixTimestamp === 'bigint' ? Number(unixTimestamp) : unixTimestamp;
  const date = new Date(ts * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '');
};

export const formatCountdown = (secondsRemaining) => {
  if (secondsRemaining <= 0) return "Ended";
  const h = Math.floor(secondsRemaining / 3600);
  const m = Math.floor((secondsRemaining % 3600) / 60);
  const s = secondsRemaining % 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
};

export const calculateMinBid = (currentHighestBid, reservePrice) => {
  if (currentHighestBid === 0n) return reservePrice;
  return (currentHighestBid * 105n) / 100n;
};

export const calculateFees = (salePrice) => {
  const platformFee = (salePrice * 250n) / 10000n;
  const sellerReceives = salePrice - platformFee;
  return { platformFee, sellerReceives };
};
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const FALLBACK_GATEWAY = 'https://ipfs.io/ipfs/'

export const resolveImageUrl = (tokenURI) => {
  if (!tokenURI || tokenURI === '') return null
  // Already a usable HTTP/HTTPS URL
  if (tokenURI.startsWith('http://') || 
      tokenURI.startsWith('https://')) return tokenURI
  // Base64 data URL — usable directly
  if (tokenURI.startsWith('data:')) return tokenURI
  // IPFS URI — convert to gateway URL
  if (tokenURI.startsWith('ipfs://')) {
    const hash = tokenURI.replace('ipfs://', '')
    return `${IPFS_GATEWAY}${hash}`
  }
  // Raw IPFS hash (no prefix)
  if (tokenURI.length === 46 && tokenURI.startsWith('Qm')) {
    return `${IPFS_GATEWAY}${tokenURI}`
  }
  if (tokenURI.length === 59 && tokenURI.startsWith('bafy')) {
    return `${IPFS_GATEWAY}${tokenURI}`
  }
  return null
}

export const resolveFallbackImageUrl = (tokenURI) => {
  if (!tokenURI || tokenURI === '') return null
  if (tokenURI.startsWith('ipfs://')) {
    const hash = tokenURI.replace('ipfs://', '')
    return `${FALLBACK_GATEWAY}${hash}`
  }
  return null
}
