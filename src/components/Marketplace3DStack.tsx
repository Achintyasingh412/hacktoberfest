import React, { useState, useRef } from 'react';
import { MarketplaceItem, Resident } from '../types';
import { SpeakButton } from './SpeakButton';
import { Clock, Award, MapPin, CheckCircle2, AlertCircle, Sparkles, History, ArrowRight, RotateCcw, ThumbsUp, X } from 'lucide-react';

interface Marketplace3DStackProps {
  items: MarketplaceItem[];
  currentUser: Resident;
  onPlaceBid: (item: MarketplaceItem, customAmount?: number) => void;
  onConfirmPickup: (item: MarketplaceItem) => void;
  onViewDetails: (item: MarketplaceItem) => void;
  bidAmountMap: Record<string, number>;
  setBidAmountMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  formatCountdown: (endTimeStr: string) => string;
  isEndingSoon: (endTimeStr: string) => boolean;
  defaultFallbackImage: string;
}

export const Marketplace3DStack: React.FC<Marketplace3DStackProps> = ({
  items,
  currentUser,
  onPlaceBid,
  onConfirmPickup,
  onViewDetails,
  bidAmountMap,
  setBidAmountMap,
  formatCountdown,
  isEndingSoon,
  defaultFallbackImage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeItems = items.filter((i) => i.status === 'active');
  const currentItem = activeItems[currentIndex % Math.max(1, activeItems.length)];

  if (activeItems.length === 0 || !currentItem) {
    return (
      <div className="bg-[#874F41] border border-[#90AEAD]/40 rounded-2xl p-12 text-center text-[#FBE9D0]/80 shadow-xl max-w-xl mx-auto">
        <Sparkles className="w-12 h-12 mx-auto text-[#90AEAD] mb-3 opacity-60 animate-pulse" />
        <h3 className="font-serif text-xl font-bold text-[#FBE9D0]">3D Perspective Stack Empty</h3>
        <p className="text-xs text-[#FBE9D0]/70 max-w-sm mx-auto mt-1">
          No active auctions currently available in the 3D deck. Try resetting the stack or listing a new item.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Deck Stack</span>
        </button>
      </div>
    );
  }

  const nextCard = (dir: 'left' | 'right') => {
    setExitDirection(dir);
    setTimeout(() => {
      setExitDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }, 300);
  };

  // Mouse / Touch handlers for flick gesture
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 110;
    if (dragOffset.x > threshold) {
      nextCard('right');
    } else if (dragOffset.x < -threshold) {
      nextCard('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const isSeller = currentItem.sellerId === currentUser.id || currentItem.sellerId === currentUser.uid;
  const isWinner = currentItem.winnerId === currentUser.id || currentItem.winnerId === currentUser.uid;
  const isLeading = currentItem.highestBidderId === currentUser.id || currentItem.highestBidderId === currentUser.uid;
  const endingSoon = isEndingSoon(currentItem.endTime);
  const minNextBid = currentItem.bids.length === 0 ? currentItem.startingBid : currentItem.currentBid + 5;
  const customBidVal = bidAmountMap[currentItem.id] || minNextBid;

  return (
    <div className="w-full max-w-xl mx-auto py-4 px-2 flex flex-col items-center select-none">
      {/* Stack Header & Counter */}
      <div className="w-full flex items-center justify-between mb-4 text-xs font-mono text-[#90AEAD]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#E64833]" />
          <span>3D Perspective Stack Deck</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Card {currentIndex + 1} of {activeItems.length}</span>
          <button
            onClick={() => setCurrentIndex(0)}
            className="p-1 rounded-lg bg-[#874F41] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] transition-colors cursor-pointer"
            title="Reset Stack"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Perspective Card Deck Container */}
      <div 
        className="relative w-full h-[520px] sm:h-[540px] flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {/* Background Card Stack Shadow Layers */}
        {activeItems.length > 1 && (
          <div 
            className="absolute w-[92%] h-[90%] bg-[#874F41]/60 border border-[#90AEAD]/30 rounded-3xl shadow-lg transform translate-y-6 scale-[0.92] pointer-events-none transition-all duration-300"
          />
        )}
        {activeItems.length > 2 && (
          <div 
            className="absolute w-[86%] h-[85%] bg-[#874F41]/30 border border-[#90AEAD]/20 rounded-3xl shadow-md transform translate-y-12 scale-[0.86] pointer-events-none transition-all duration-300"
          />
        )}

        {/* Top Interactive 3D Card */}
        <div
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`absolute w-full max-w-md bg-[#874F41] border-2 border-[#90AEAD] rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between transition-transform duration-300 cursor-grab active:cursor-grabbing text-[#FBE9D0] ${
            exitDirection === 'left'
              ? '-translate-x-[150%] -rotate-12 opacity-0'
              : exitDirection === 'right'
              ? 'translate-x-[150%] rotate-12 opacity-0'
              : ''
          }`}
          style={{
            transform: exitDirection
              ? undefined
              : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0px) rotate(${dragOffset.x * 0.06}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
          }}
        >
          <div>
            {/* Card Image Banner */}
            <div
              onClick={() => onViewDetails(currentItem)}
              className="relative h-52 w-full bg-[#244855] overflow-hidden border-b border-[#90AEAD]/50 cursor-pointer group"
            >
              <img
                src={currentItem.imageUrl || defaultFallbackImage}
                alt={currentItem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = defaultFallbackImage;
                }}
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-xl bg-[#244855]/95 border border-[#90AEAD]/60 text-[#FBE9D0] shadow-md">
                  {currentItem.category}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                {endingSoon ? (
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-xl bg-[#E64833] text-[#FBE9D0] shadow-md animate-pulse flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatCountdown(currentItem.endTime)}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-xl bg-[#244855]/95 border border-[#90AEAD]/60 text-[#90AEAD] shadow-md">
                    {formatCountdown(currentItem.endTime)}
                  </span>
                )}
              </div>
              <div className="absolute bottom-2.5 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[11px] font-mono text-[#FBE9D0] flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#E64833]" />
                <span>Seller: {currentItem.sellerName} ({currentItem.sellerRoom})</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3
                  onClick={() => onViewDetails(currentItem)}
                  className="font-serif text-xl font-bold text-[#FBE9D0] hover:text-[#E64833] transition-colors cursor-pointer line-clamp-1"
                >
                  {currentItem.title}
                </h3>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-[#90AEAD] uppercase">Current Bid</div>
                  <div className="text-xl font-bold font-mono text-[#FBE9D0] tabular-nums">
                    ₹{currentItem.currentBid}
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-[#FBE9D0]/80 line-clamp-2 leading-relaxed flex-1">
                  {currentItem.description}
                </p>
                <SpeakButton
                  id={`stack-item-${currentItem.id}`}
                  text={`${currentItem.title}. ${currentItem.description}`}
                  size="xs"
                  className="shrink-0"
                />
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 bg-[#244855] border border-[#90AEAD]/40 rounded-xl text-[11px] font-mono text-[#90AEAD]">
                  Bids: <strong className="text-[#FBE9D0]">{currentItem.bids.length}</strong>
                </span>
                {isSeller && (
                  <span className="px-2.5 py-1 bg-[#E64833]/25 border border-[#E64833] rounded-xl text-[11px] font-mono text-[#FBE9D0] font-semibold">
                    Your Listing
                  </span>
                )}
                {isLeading && !isSeller && (
                  <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-400 rounded-xl text-[11px] font-mono text-emerald-300 font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>You're Leading!</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="p-4 bg-[#244855]/90 border-t border-[#90AEAD]/40 flex items-center gap-3">
            <button
              onClick={() => nextCard('left')}
              className="flex-1 py-2.5 px-3 bg-[#874F41] hover:bg-[#E64833]/80 border border-[#90AEAD]/40 text-[#FBE9D0] text-xs font-mono rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Flick Card Away / Pass"
            >
              <span>👈 Flick Away</span>
            </button>

            <button
              onClick={() => onViewDetails(currentItem)}
              className="py-2.5 px-3 bg-[#244855] hover:bg-[#874F41] border border-[#90AEAD]/50 text-[#FBE9D0] text-xs font-mono rounded-xl transition-colors cursor-pointer shadow-sm active:scale-95"
              title="View Bids & Details"
            >
              <History className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onPlaceBid(currentItem, minNextBid);
                nextCard('right');
              }}
              disabled={isSeller}
              className={`flex-1 py-2.5 px-3 font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                isSeller 
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed border border-zinc-600'
                  : 'bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] border border-[#FBE9D0]/30'
              }`}
              title="Quick Bid ₹5+ & Flick Next"
            >
              <span>Bid ₹{minNextBid} 👉</span>
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Gesture Hint */}
      <div className="text-center text-[11px] font-mono text-[#90AEAD] mt-4">
        💡 Drag or flick card left/right, or use buttons to cycle through the 3D perspective deck.
      </div>
    </div>
  );
};
