// src/hooks/useWatchlist.js
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stillbid_watchlist'

export default function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 
        JSON.stringify(watchlist))
    } catch {}
  }, [watchlist])

  const addToWatchlist = useCallback((auctionId, 
    priceAtWatch) => {
    setWatchlist(prev => {
      const id = auctionId.toString()
      if (prev.find(w => w.id === id)) return prev
      return [...prev, {
        id,
        addedAt: Date.now(),
        priceAtWatch: priceAtWatch?.toString() || '0',
      }]
    })
  }, [])

  const removeFromWatchlist = useCallback((auctionId) => {
    setWatchlist(prev => 
      prev.filter(w => w.id !== auctionId.toString())
    )
  }, [])

  const isWatching = useCallback((auctionId) => {
    return watchlist.some(
      w => w.id === auctionId.toString()
    )
  }, [watchlist])

  const getWatchEntry = useCallback((auctionId) => {
    return watchlist.find(
      w => w.id === auctionId.toString()
    ) || null
  }, [watchlist])

  const toggleWatch = useCallback((auctionId, 
    currentPrice) => {
    const id = auctionId.toString()
    setWatchlist(prev => {
      if (prev.find(w => w.id === id)) {
        return prev.filter(w => w.id !== id)
      }
      return [...prev, {
        id,
        addedAt: Date.now(),
        priceAtWatch: currentPrice?.toString() || '0',
      }]
    })
  }, [])

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isWatching,
    getWatchEntry,
    toggleWatch,
    watchCount: watchlist.length,
  }
}
