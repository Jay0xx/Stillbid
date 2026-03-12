// src/components/NFTImage.jsx
import { useState, useEffect } from 'react'
import useNFTMetadata from '../hooks/useNFTMetadata'

const Placeholder = ({ className }) => (
  <div className={className}>
    <svg xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 text-[#D1D5DB]"
      fill="none" viewBox="0 0 24 24"
      stroke="currentColor">
      <path strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 
           0L16 16m-2-2l1.586-1.586a2 2 0 
           012.828 0L20 14m-6-6h.01M6 20h12
           a2 2 0 002-2V6a2 2 0 00-2-2H6a2 
           2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
)

export default function NFTImage({
  tokenURI,
  alt,
  className,
  placeholderClassName
}) {
  const { metadata, isLoading } = useNFTMetadata(tokenURI)
  const [imgFailed, setImgFailed] = useState(false)
  const [fallbackTried, setFallbackTried] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(null)

  useEffect(() => {
    setImgFailed(false)
    setFallbackTried(false)
    setCurrentSrc(metadata?.resolvedImage || null)
  }, [metadata?.resolvedImage])

  const handleError = () => {
    if (!fallbackTried && metadata?.image) {
      setFallbackTried(true)
      const fallback = metadata.image.startsWith('ipfs://')
        ? `https://ipfs.io/ipfs/${
            metadata.image.replace('ipfs://', '')
          }`
        : null
      if (fallback) {
        setCurrentSrc(fallback)
        return
      }
    }
    setImgFailed(true)
  }

  const ph = placeholderClassName ||
    'w-full h-full bg-[#F3F4F6] flex items-center justify-center'

  if (isLoading) {
    return (
      <div className={ph}>
        <div className="w-6 h-6 border-2 border-[#E5E7EB] 
          border-t-[#D1D5DB] rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentSrc || imgFailed) {
    return <Placeholder className={ph} />
  }

  return (
    <img
      src={currentSrc}
      alt={alt || metadata?.name || 'NFT'}
      className={className}
      onError={handleError}
    />
  )
}
