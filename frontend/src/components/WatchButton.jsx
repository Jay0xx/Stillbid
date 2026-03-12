// src/components/WatchButton.jsx
import useWatchlist from '../hooks/useWatchlist'

export default function WatchButton({ 
  auctionId, 
  currentPrice,
  size = 'md',
  className = '' 
}) {
  const { isWatching, toggleWatch } = useWatchlist()
  const watching = isWatching(auctionId)

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleWatch(auctionId, currentPrice)
      }}
      title={watching 
        ? 'Remove from watchlist' 
        : 'Add to watchlist'}
      className={`
        flex items-center justify-center rounded-full
        border transition-all duration-150
        ${watching 
          ? 'bg-[#111111] border-[#111111] text-white' 
          : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#111111] hover:text-[#111111]'
        }
        ${sizes[size]}
        ${className}
      `}
    >
      {watching ? '👁' : '🔭'}
    </button>
  )
}
