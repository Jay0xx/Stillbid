// src/hooks/useNFTMetadata.js
import { useState, useEffect } from 'react'

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const FALLBACK_GATEWAY = 'https://ipfs.io/ipfs/'

function toGatewayUrl(uri, gateway = PINATA_GATEWAY) {
  if (!uri || uri === '') return null
  if (uri.startsWith('http://') || 
      uri.startsWith('https://')) return uri
  if (uri.startsWith('data:')) return uri
  if (uri.startsWith('ipfs://')) {
    return `${gateway}${uri.replace('ipfs://', '')}`
  }
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `${gateway}${uri}`
  }
  return null
}

export default function useNFTMetadata(tokenURI) {
  const [metadata, setMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tokenURI || tokenURI === '') {
      setMetadata(null)
      return
    }

    let cancelled = false

    const fetchMetadata = async () => {
      setIsLoading(true)
      setError(null)

      // Try to fetch JSON from primary gateway
      const primaryUrl = toGatewayUrl(tokenURI, PINATA_GATEWAY)
      const fallbackUrl = toGatewayUrl(tokenURI, FALLBACK_GATEWAY)

      let json = null

      // Try primary gateway first
      try {
        const res = await fetch(primaryUrl)
        if (res.ok) {
          const text = await res.text()
          // Check if response is JSON (metadata) 
          // vs raw image (old format)
          try {
            json = JSON.parse(text)
          } catch {
            // Not JSON — tokenURI points directly to image (old format)
            // Treat the URI itself as the image
            if (!cancelled) {
              setMetadata({
                name: null,
                description: null,
                image: tokenURI,
                resolvedImage: primaryUrl,
              })
              setIsLoading(false)
            }
            return
          }
        }
      } catch {
        // Primary failed — try fallback
        try {
          const res = await fetch(fallbackUrl)
          if (res.ok) {
            const text = await res.text()
            try {
              json = JSON.parse(text)
            } catch {
              if (!cancelled) {
                setMetadata({
                  name: null,
                  description: null,
                  image: tokenURI,
                  resolvedImage: fallbackUrl,
                })
                setIsLoading(false)
              }
              return
            }
          }
        } catch {
          if (!cancelled) {
            setError('Could not fetch metadata')
            setIsLoading(false)
          }
          return
        }
      }

      if (json && !cancelled) {
        const resolvedImage = json.image 
          ? toGatewayUrl(json.image, PINATA_GATEWAY) 
          : null
        setMetadata({
          name: json.name || null,
          description: json.description || null,
          image: json.image || null,
          resolvedImage: resolvedImage,
          attributes: json.attributes || [],
          raw: json,
        })
      }

      if (!cancelled) setIsLoading(false)
    }

    fetchMetadata()
    return () => { cancelled = true }
  }, [tokenURI])

  return { metadata, isLoading, error }
}
