// src/components/NFTImage.jsx
import { useState, useEffect } from 'react'
import { resolveImageUrl, resolveFallbackUrl } 
  from '../utils/imageUtils'

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
           012.828 0L20 14m-6-6h.01M6 20h12a2 
           2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 
           00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
)

export default function NFTImage({ 
  tokenURI, 
  alt, 
  className,
  placeholderClassName 
}) {
  const [imgSrc, setImgSrc] = useState(null)
  const [triedFallback, setTriedFallback] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    setTriedFallback(false)
    const resolved = resolveImageUrl(tokenURI)
    setImgSrc(resolved)
  }, [tokenURI])

  const handleError = () => {
    if (!triedFallback) {
      const fallback = resolveFallbackUrl(tokenURI)
      if (fallback && fallback !== imgSrc) {
        setTriedFallback(true)
        setImgSrc(fallback)
        return
      }
    }
    setFailed(true)
  }

  const placeholderClass = placeholderClassName || 
    "w-full h-full bg-[#F3F4F6] flex items-center justify-center"

  if (!imgSrc || failed) {
    return <Placeholder className={placeholderClass} />
  }

  return (
    <img
      src={imgSrc}
      alt={alt || 'NFT'}
      className={className}
      onError={handleError}
    />
  )
}
