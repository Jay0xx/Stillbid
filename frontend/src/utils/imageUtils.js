// src/utils/imageUtils.js

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const FALLBACK_GATEWAY = 'https://ipfs.io/ipfs/'

export function resolveImageUrl(tokenURI) {
  if (!tokenURI || tokenURI === '') return null
  // Already HTTP — use directly
  if (tokenURI.startsWith('http://') || 
      tokenURI.startsWith('https://')) {
    return tokenURI
  }
  // Base64 data URL — use directly
  if (tokenURI.startsWith('data:')) {
    return tokenURI
  }
  // IPFS URI — convert to Pinata gateway
  if (tokenURI.startsWith('ipfs://')) {
    const hash = tokenURI.replace('ipfs://', '')
    return `${PINATA_GATEWAY}${hash}`
  }
  // Raw IPFS hash starting with Qm (CIDv0)
  if (tokenURI.startsWith('Qm') && tokenURI.length === 46) {
    return `${PINATA_GATEWAY}${tokenURI}`
  }
  // Raw IPFS hash starting with bafy (CIDv1)
  if (tokenURI.startsWith('bafy')) {
    return `${PINATA_GATEWAY}${tokenURI}`
  }
  return null
}

export function resolveFallbackUrl(tokenURI) {
  if (!tokenURI || tokenURI === '') return null
  if (tokenURI.startsWith('ipfs://')) {
    const hash = tokenURI.replace('ipfs://', '')
    return `${FALLBACK_GATEWAY}${hash}`
  }
  if (tokenURI.startsWith('Qm') && tokenURI.length === 46) {
    return `${FALLBACK_GATEWAY}${tokenURI}`
  }
  if (tokenURI.startsWith('bafy')) {
    return `${FALLBACK_GATEWAY}${tokenURI}`
  }
  return null
}
