import React, { useState, useEffect, useRef } from 'react';
import { MarketplaceItem, MarketplaceCategory, Resident } from '../types';
import {
  getMarketplaceItems,
  createMarketplaceListing,
  placeBidOnItem,
  confirmCashOnPickup,
} from '../services/marketplaceService';
import { Marketplace3DStack } from './Marketplace3DStack';
import { SpeakButton } from './SpeakButton';
import {
  ShoppingBag,
  Plus,
  Clock,
  Award,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  History,
  X,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Camera,
  Trash2,
  FileCheck,
  Tag,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Eye,
  Info,
} from 'lucide-react';
import snackDeskImg from '../assets/images/hostel_snack_market_1791051746997.jpg';

interface HostelMarketplaceProps {
  currentUser: Resident;
  onRefreshState: () => void;
  onNotificationTriggered: () => void;
}

const CATEGORIES: MarketplaceCategory[] = [
  'Snacks & Munchies',
  'Beverages',
  'Study & Stationery',
  'Tech & Gadgets',
  'Hostel Essentials',
  'Sports Gear',
];

const PRESET_PHOTO_LIBRARY = [
  {
    name: 'Instant Ramen & Midnight Snacks',
    category: 'Snacks & Munchies' as MarketplaceCategory,
    url: snackDeskImg,
  },
  {
    name: 'Chilled Energy Can',
    category: 'Beverages' as MarketplaceCategory,
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Pro Badminton Grip Tape',
    category: 'Sports Gear' as MarketplaceCategory,
    url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Exam Spiral Notebook & Pen',
    category: 'Study & Stationery' as MarketplaceCategory,
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Hostel LED Study Lamp',
    category: 'Hostel Essentials' as MarketplaceCategory,
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Braided Fast Charging Cable',
    category: 'Tech & Gadgets' as MarketplaceCategory,
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  },
];

// Fallback image if no photo is uploaded or preset selected
const DEFAULT_FALLBACK_IMAGE = snackDeskImg;

// Secure client-side image file processor with canvas optimization
function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 800; // high quality while preserving browser storage
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const HostelMarketplace: React.FC<HostelMarketplaceProps> = ({
  currentUser,
  onRefreshState,
  onNotificationTriggered,
}) => {
  const [items, setItems] = useState<MarketplaceItem[]>(() => getMarketplaceItems());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED' | 'MY_ITEMS' | 'MY_BIDS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Listing creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MarketplaceCategory>('Snacks & Munchies');
  const [newDescription, setNewDescription] = useState('');
  const [newStartingBid, setNewStartingBid] = useState(40);
  const [newDurationHours, setNewDurationHours] = useState(12);

  // File Upload State
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [photoTab, setPhotoTab] = useState<'upload' | 'library' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListingSubmitting, setIsListingSubmitting] = useState(false);
  const [listingError, setListingError] = useState('');

  // Item Detail & Bidding View
  const [detailedItem, setDetailedItem] = useState<MarketplaceItem | null>(null);

  // Bidding state
  const [bidAmountMap, setBidAmountMap] = useState<Record<string, number>>({});
  const [actionFeedback, setActionFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  // Carousel State for sliding card stack
  const [carouselIndex, setCarouselIndex] = useState(0);
  const activeAuctionItems = items.filter((i) => i.status === 'active');

  const handleNextSlide = () => {
    if (activeAuctionItems.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % activeAuctionItems.length);
  };

  const handlePrevSlide = () => {
    if (activeAuctionItems.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + activeAuctionItems.length) % activeAuctionItems.length);
  };

  const [viewMode, setViewMode] = useState<'grid' | '3d-stack'>('3d-stack');

  // Clock ticker for real-time countdowns
  const [, setClockTicker] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTicker(Date.now());
      const updated = getMarketplaceItems();
      setItems(updated);
      if (detailedItem) {
        const freshDetail = updated.find((i) => i.id === detailedItem.id);
        if (freshDetail) setDetailedItem(freshDetail);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [detailedItem]);

  const refreshList = () => {
    const fresh = getMarketplaceItems();
    setItems(fresh);
    if (detailedItem) {
      const match = fresh.find((i) => i.id === detailedItem.id);
      if (match) setDetailedItem(match);
    }
    onRefreshState();
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndSetFile(file);
  };

  const handleDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndSetFile(file);
  };

  const processAndSetFile = async (file: File) => {
    setListingError('');
    try {
      if (file.size > 10 * 1024 * 1024) {
        setListingError('File size is too large (maximum 10MB).');
        return;
      }
      const base64 = await processImageFile(file);
      setUploadedImageBase64(base64);
      setUploadedFileName(file.name);
      setPhotoTab('upload');
    } catch (err: any) {
      setListingError(err?.message || 'Failed to process image file.');
    }
  };

  const handleRemoveUploadedPhoto = () => {
    setUploadedImageBase64('');
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getEffectiveImageForNewListing = () => {
    if (photoTab === 'upload' && uploadedImageBase64) {
      return uploadedImageBase64;
    }
    if (photoTab === 'url' && customUrlInput.trim()) {
      return customUrlInput.trim();
    }
    if (uploadedImageBase64) return uploadedImageBase64;
    return DEFAULT_FALLBACK_IMAGE;
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingError('');

    if (!newTitle.trim()) {
      setListingError('Please enter an item title.');
      return;
    }

    if (newStartingBid < 5) {
      setListingError('Starting bid must be at least ₹5.');
      return;
    }

    if (newDurationHours > 48 || newDurationHours < 1) {
      setListingError('Auction duration must be between 1 and 48 hours (strict max 48 hrs).');
      return;
    }

    const finalImage = getEffectiveImageForNewListing();

    setIsListingSubmitting(true);
    const result = await createMarketplaceListing({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      imageUrl: finalImage,
      startingBid: newStartingBid,
      durationHours: newDurationHours,
      seller: currentUser,
    });
    setIsListingSubmitting(false);

    if (result.success && result.item) {
      setIsCreateModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewStartingBid(40);
      setNewDurationHours(12);
      handleRemoveUploadedPhoto();
      setCustomUrlInput('');
      refreshList();
      onNotificationTriggered();
    } else {
      setListingError(result.error || 'Failed to create marketplace listing.');
    }
  };

  const handlePlaceBid = (item: MarketplaceItem, customAmount?: number) => {
    setActionFeedback(null);
    const minBid = item.bids.length === 0 ? item.startingBid : item.currentBid + 5;
    const amountToBid = customAmount !== undefined ? customAmount : (bidAmountMap[item.id] || minBid);

    const result = placeBidOnItem(item.id, amountToBid, currentUser);
    if (result.success) {
      setActionFeedback({
        id: item.id,
        msg: `Leading bid placed: ₹${amountToBid}! Logged in permanent ledger.`,
        type: 'success',
      });
      refreshList();
      onNotificationTriggered();
    } else {
      setActionFeedback({
        id: item.id,
        msg: result.error || 'Failed to place bid.',
        type: 'error',
      });
    }
  };

  const handleConfirmPickup = (item: MarketplaceItem) => {
    const res = confirmCashOnPickup(item.id, currentUser);
    if (res.success) {
      setActionFeedback({
        id: item.id,
        msg: `Cash on pickup confirmed! ₹${item.winningBid || item.currentBid} paid at ${item.sellerRoom}.`,
        type: 'success',
      });
      refreshList();
      onNotificationTriggered();
    } else {
      setActionFeedback({
        id: item.id,
        msg: res.error || 'Failed to confirm pickup.',
        type: 'error',
      });
    }
  };

  const formatCountdown = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - Date.now();
    if (diff <= 0) return 'AUCTION CONCLUDED';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const isEndingSoon = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - Date.now();
    return diff > 0 && diff < 3600000;
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (statusFilter === 'ACTIVE' && item.status !== 'active') return false;
    if (statusFilter === 'ENDED' && item.status === 'active') return false;
    if (statusFilter === 'MY_ITEMS') {
      const isMine = item.sellerId === currentUser.id || item.sellerId === currentUser.uid;
      if (!isMine) return false;
    }
    if (statusFilter === 'MY_BIDS') {
      const hasMyBid = item.bids.some(
        (b) => b.bidderId === currentUser.id || b.bidderId === currentUser.uid
      );
      if (!hasMyBid) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = `${item.title} ${item.description} ${item.sellerName} ${item.sellerRoom} ${item.category}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const activeCount = items.filter((i) => i.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#874F41] border border-[#90AEAD] rounded-2xl p-6 lg:p-7 text-[#FBE9D0] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase mb-1">
              <span>Peer-to-Peer Hostel Exchange</span>
              <span>·</span>
              <span>Local Photo Uploads</span>
              <span>·</span>
              <span className="text-[#E64833] font-bold">Strict Max 48h Auction</span>
            </div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#FBE9D0]">
              Hostel Mart & Midnight Snack Auction
            </h1>
            <p className="text-xs lg:text-sm text-[#FBE9D0]/85 mt-1.5 leading-relaxed">
              Upload photos directly from your phone or device, list midnight snacks or study equipment, and place live bids with countdown timers. Winner receives the seller's room number for direct <strong>Cash on Pickup</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Quick Metrics */}
            <div className="p-3.5 bg-[#244855]/95 border border-[#90AEAD]/40 rounded-xl text-xs font-mono flex items-center gap-4 shadow-md">
              <div>
                <div className="text-[10px] text-[#90AEAD] uppercase">Live Auctions</div>
                <div className="text-xl font-bold text-[#FBE9D0] tabular-nums">{activeCount}</div>
              </div>
              <div className="h-7 w-px bg-[#90AEAD]/30" />
              <div>
                <div className="text-[10px] text-[#90AEAD] uppercase">Payment Protocol</div>
                <div className="text-xs font-bold text-emerald-400">Cash on Pickup</div>
              </div>
            </div>

            {/* List Item CTA */}
            <button
              onClick={() => {
                setListingError('');
                setIsCreateModalOpen(true);
              }}
              className="py-3 px-5 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>List Item with Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Featured Auction Carousel & Sliding Card Stack */}
      {activeAuctionItems.length > 0 && (() => {
        const currentItem = activeAuctionItems[carouselIndex % activeAuctionItems.length];
        if (!currentItem) return null;
        return (
          <div className="bg-[#874F41] border-2 border-[#90AEAD] rounded-2xl p-5 lg:p-6 text-[#FBE9D0] shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left Image Thumb */}
              <div
                onClick={() => setDetailedItem(currentItem)}
                className="w-full md:w-72 h-44 rounded-xl overflow-hidden bg-[#244855] border border-[#90AEAD]/50 relative group cursor-pointer shrink-0 shadow-md"
              >
                <img
                  src={currentItem.imageUrl || DEFAULT_FALLBACK_IMAGE}
                  alt={currentItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-lg bg-[#244855]/90 border border-[#90AEAD]/60 text-[#FBE9D0] shadow-sm">
                    {currentItem.category}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/75 text-[10px] font-mono text-emerald-300">
                  Live Featured Auction
                </div>
              </div>

              {/* Center Info */}
              <div className="flex-1 space-y-2 text-left">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#90AEAD]">
                  <Sparkles className="w-3.5 h-3.5 text-[#E64833]" />
                  <span>Featured Auction ({carouselIndex + 1} of {activeAuctionItems.length})</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">{formatCountdown(currentItem.endTime)}</span>
                </div>
                <h3
                  onClick={() => setDetailedItem(currentItem)}
                  className="font-serif text-xl font-bold text-[#FBE9D0] hover:text-[#E64833] transition-colors cursor-pointer line-clamp-1"
                >
                  {currentItem.title}
                </h3>
                <p className="text-xs text-[#FBE9D0]/80 line-clamp-2 leading-relaxed">
                  {currentItem.description}
                </p>
                <div className="flex items-center gap-4 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-[#90AEAD]">Current Bid: </span>
                    <span className="text-base font-bold text-[#FBE9D0]">₹{currentItem.currentBid}</span>
                  </div>
                  <div>
                    <span className="text-[#90AEAD]">Seller: </span>
                    <span className="text-[#FBE9D0]">{currentItem.sellerName} ({currentItem.sellerRoom})</span>
                  </div>
                </div>
              </div>

              {/* Right Carousel Controls & CTA */}
              <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevSlide}
                    className="p-2 rounded-xl bg-[#244855] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] transition-colors cursor-pointer shadow-sm"
                    title="Previous Featured Item"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-[#90AEAD] px-1">
                    {carouselIndex + 1} / {activeAuctionItems.length}
                  </span>
                  <button
                    onClick={handleNextSlide}
                    className="p-2 rounded-xl bg-[#244855] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] transition-colors cursor-pointer shadow-sm"
                    title="Next Featured Item"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setDetailedItem(currentItem)}
                  className="w-full py-2 px-4 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-semibold text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap active:scale-[0.98]"
                >
                  View & Place Bid
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filter and Search Bar */}
      <div className="bg-[#874F41]/70 border border-[#90AEAD]/40 rounded-2xl p-4 lg:p-5 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#90AEAD]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ramen, chips, energy drinks, study lamps, room..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/50 rounded-xl text-xs font-sans text-[#FBE9D0] placeholder-[#FBE9D0]/50 focus:outline-none focus:border-[#E64833]"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'ALL', label: 'All Items' },
                { id: 'ACTIVE', label: `Active (${activeCount})` },
                { id: 'ENDED', label: 'Concluded' },
                { id: 'MY_ITEMS', label: 'My Listings' },
                { id: 'MY_BIDS', label: 'My Bids' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[#E64833] text-[#FBE9D0] border-[#E64833] font-bold shadow-sm'
                    : 'bg-[#244855] text-[#90AEAD] border-[#90AEAD]/30 hover:border-[#90AEAD]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#90AEAD] text-[#244855] border-[#90AEAD] font-bold shadow-sm'
                : 'bg-[#244855]/60 text-[#FBE9D0]/80 border-[#90AEAD]/20 hover:border-[#90AEAD]/50'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#90AEAD] text-[#244855] border-[#90AEAD] font-bold shadow-sm'
                  : 'bg-[#244855]/60 text-[#FBE9D0]/80 border-[#90AEAD]/20 hover:border-[#90AEAD]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle Bar */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between bg-[#874F41]/70 border border-[#90AEAD]/40 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="text-xs font-mono text-[#90AEAD]">
            Showing {filteredItems.length} auction items
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('3d-stack')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '3d-stack'
                  ? 'bg-[#E64833] text-[#FBE9D0] font-bold shadow-sm'
                  : 'bg-[#244855] text-[#90AEAD] hover:text-[#FBE9D0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Deck Stack</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[#E64833] text-[#FBE9D0] font-bold shadow-sm'
                  : 'bg-[#244855] text-[#90AEAD] hover:text-[#FBE9D0]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>
        </div>
      )}

      {/* Auction Items Grid / 3D Stack */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#874F41] border border-[#90AEAD]/40 rounded-2xl p-12 text-center text-[#FBE9D0]/80 shadow-xl">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#90AEAD] mb-3 opacity-60" />
          <h3 className="font-serif text-lg font-bold text-[#FBE9D0]">No Marketplace Listings Found</h3>
          <p className="text-xs text-[#FBE9D0]/70 max-w-md mx-auto mt-1">
            No active auctions match your current filters. Be the first to list snacks, energy drinks, or study gear with photo uploads!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>List an Item with Photo</span>
          </button>
        </div>
      ) : viewMode === '3d-stack' ? (
        <Marketplace3DStack
          items={filteredItems}
          currentUser={currentUser}
          onPlaceBid={(item, amount) => handlePlaceBid(item, amount)}
          onConfirmPickup={(item) => handleConfirmPickup(item)}
          onViewDetails={(item) => setDetailedItem(item)}
          bidAmountMap={bidAmountMap}
          setBidAmountMap={setBidAmountMap}
          formatCountdown={formatCountdown}
          isEndingSoon={isEndingSoon}
          defaultFallbackImage={DEFAULT_FALLBACK_IMAGE}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isSeller = item.sellerId === currentUser.id || item.sellerId === currentUser.uid;
            const isWinner = item.winnerId === currentUser.id || item.winnerId === currentUser.uid;
            const isLeading = item.highestBidderId === currentUser.id || item.highestBidderId === currentUser.uid;
            const isClosed = item.status !== 'active';
            const endingSoon = isEndingSoon(item.endTime);
            const minNextBid = item.bids.length === 0 ? item.startingBid : item.currentBid + 5;
            const customBidVal = bidAmountMap[item.id] || minNextBid;

            return (
              <div
                key={item.id}
                className="bg-[#874F41] border border-[#90AEAD] rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden hover:border-[#FBE9D0] transition-all text-[#FBE9D0] hover:shadow-2xl"
              >
                <div>
                  {/* Item Image with local preview fallback */}
                  <div
                    onClick={() => setDetailedItem(item)}
                    className="relative h-48 w-full bg-[#244855] overflow-hidden border-b border-[#90AEAD]/40 cursor-pointer group"
                    title="Click to view full photo and bid details"
                  >
                    <img
                      src={item.imageUrl || DEFAULT_FALLBACK_IMAGE}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                      }}
                    />

                    {/* Category Tag */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm bg-[#244855]/90 border border-[#90AEAD]/60 text-[#FBE9D0] shadow-sm">
                        {item.category}
                      </span>
                    </div>

                    {/* Status / Countdown Ribbon */}
                    <div className="absolute top-2.5 right-2.5">
                      {item.status === 'active' ? (
                        <div
                          className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-sm border shadow-md flex items-center gap-1.5 ${
                            endingSoon
                              ? 'bg-[#E64833] border-[#FBE9D0] text-[#FBE9D0] animate-pulse'
                              : 'bg-[#244855]/95 border-[#90AEAD] text-[#90AEAD]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatCountdown(item.endTime)}</span>
                        </div>
                      ) : item.status === 'completed' ? (
                        <div className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-sm border bg-emerald-900/90 border-emerald-400 text-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid & Picked Up</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-sm border bg-[#244855]/90 border-amber-400 text-amber-200">
                          Auction Closed
                        </div>
                      )}
                    </div>

                    {/* Seller attribution strip */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 flex items-center justify-between text-[11px] font-mono text-[#FBE9D0]/90">
                      <span>Seller: {item.sellerName}</span>
                      <span className="text-[#90AEAD]">REG-{item.sellerRegDigits}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Title */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          onClick={() => setDetailedItem(item)}
                          className="font-serif text-lg font-bold text-[#FBE9D0] leading-snug line-clamp-1 hover:text-[#E64833] transition-colors cursor-pointer"
                        >
                          {item.title}
                        </h3>
                        <button
                          onClick={() => setDetailedItem(item)}
                          className="text-[#90AEAD] hover:text-[#FBE9D0] p-0.5 cursor-pointer shrink-0"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#FBE9D0]/80 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Current Bid Display */}
                    <div className="p-3 bg-[#244855] border border-[#90AEAD]/40 rounded-sm flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-[#90AEAD] uppercase">
                          {item.bids.length === 0 ? 'Starting Bid' : 'Current Leading Bid'}
                        </div>
                        <div className="font-serif text-2xl font-bold text-[#FBE9D0] tabular-nums mt-0.5">
                          ₹{item.currentBid}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-mono text-[#90AEAD] uppercase">
                          {item.bids.length} {item.bids.length === 1 ? 'Bid' : 'Bids'}
                        </div>
                        <div className="text-xs font-mono text-[#FBE9D0]/90 mt-0.5">
                          {item.highestBidderName ? (
                            <span className={isLeading ? 'text-emerald-400 font-bold' : ''}>
                              {isLeading ? 'You (Leading)' : `${item.highestBidderName.split(' ')[0]} (REG-${item.highestBidderRegDigits})`}
                            </span>
                          ) : (
                            <span className="text-[#90AEAD]">Open for 1st Bid</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Warden Inspection Note */}
                    {item.wardenInspectionNote && (
                      <div className="p-2.5 bg-[#244855]/70 border border-[#90AEAD]/30 rounded-sm text-[11px] font-serif italic text-[#FBE9D0]/90 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#E64833] shrink-0 mt-0.5" />
                        <div className="line-clamp-2">
                          "{item.wardenInspectionNote}"
                        </div>
                      </div>
                    )}

                    {/* Action Feedback Toast */}
                    {actionFeedback && actionFeedback.id === item.id && (
                      <div
                        className={`p-2 rounded-sm text-xs flex items-center gap-2 ${
                          actionFeedback.type === 'success'
                            ? 'bg-emerald-950 border border-emerald-400 text-emerald-200'
                            : 'bg-[#E64833]/25 border border-[#E64833] text-[#FBE9D0]'
                        }`}
                      >
                        {actionFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="font-medium text-[11px]">{actionFeedback.msg}</span>
                      </div>
                    )}

                    {/* WINNER REVEAL & CASH ON PICKUP PROTOCOL */}
                    {isClosed && (
                      <div className="p-3 bg-[#244855] border-2 border-[#E64833] rounded-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-[#E64833] font-bold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Official Winner
                          </span>
                          <span className="font-mono text-xs font-bold text-[#FBE9D0]">
                            Winning Bid: ₹{item.winningBid || item.currentBid}
                          </span>
                        </div>

                        <div className="font-semibold text-sm text-[#FBE9D0]">
                          {item.winnerName ? (
                            <span>
                              {item.winnerName} (REG-{item.winnerRegDigits})
                            </span>
                          ) : (
                            <span className="text-[#90AEAD] italic">No bids placed (Expired)</span>
                          )}
                        </div>

                        {/* Location reveal for winner & seller */}
                        {(isWinner || isSeller) && item.winnerName && (
                          <div className="pt-2 border-t border-[#90AEAD]/30 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-[#FBE9D0] font-mono">
                              <MapPin className="w-3.5 h-3.5 text-[#E64833] shrink-0" />
                              <span>Pickup Location: <strong className="text-emerald-400">{item.sellerRoom}</strong></span>
                            </div>
                            <div className="text-[11px] text-[#FBE9D0]/80">
                              💵 <strong>Cash on Pickup:</strong> Hand over exact cash of <strong>₹{item.winningBid || item.currentBid}</strong> upon collecting item.
                            </div>

                            {item.status !== 'completed' && (
                              <button
                                onClick={() => handleConfirmPickup(item)}
                                className="w-full mt-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-[#FBE9D0] font-semibold text-xs rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm Cash Paid & Handover</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Bidding & Details */}
                <div className="p-4 pt-0 border-t border-[#90AEAD]/30 mt-3 space-y-2.5">
                  {/* Bidding Controls if Active */}
                  {item.status === 'active' && (
                    <>
                      {isSeller ? (
                        <div className="p-2.5 bg-[#244855]/60 border border-[#90AEAD]/20 rounded-sm text-center text-xs font-mono text-[#90AEAD]">
                          You are the seller of this auction listing.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Quick Increment Bids */}
                          <div className="flex items-center gap-1.5">
                            {[10, 25, 50].map((inc) => {
                              const target = item.currentBid + inc;
                              return (
                                <button
                                  key={inc}
                                  type="button"
                                  onClick={() => handlePlaceBid(item, target)}
                                  className="flex-1 py-1 px-1 bg-[#244855] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] text-[11px] font-mono rounded-sm transition-colors cursor-pointer"
                                >
                                  +₹{inc} (₹{target})
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom Bid Input */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#90AEAD]">₹</span>
                              <input
                                type="number"
                                min={minNextBid}
                                value={customBidVal}
                                onChange={(e) =>
                                  setBidAmountMap({
                                    ...bidAmountMap,
                                    [item.id]: parseInt(e.target.value) || minNextBid,
                                  })
                                }
                                className="w-full pl-6 pr-2 py-1.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-xs font-mono text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                              />
                            </div>
                            <button
                              onClick={() => handlePlaceBid(item)}
                              className="py-1.5 px-3 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-semibold text-xs rounded-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap active:scale-[0.98]"
                            >
                              Place Bid
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Bid History & Detail Trigger */}
                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#90AEAD]">
                    <button
                      onClick={() => setDetailedItem(item)}
                      className="hover:text-[#FBE9D0] underline decoration-[#90AEAD]/40 cursor-pointer flex items-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      <span>View Details & Bids ({item.bids.length})</span>
                    </button>
                    <span>Closes: {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW LISTING MODAL WITH LOCAL FILE UPLOAD */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#874F41] border border-[#90AEAD] shadow-2xl rounded-2xl p-6 lg:p-7 text-[#FBE9D0] max-h-[92vh] overflow-y-auto relative">
            
            {/* Top Navigation "Go Back" Bar */}
            <div className="flex items-center justify-between border-b border-[#90AEAD]/40 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#244855] hover:bg-[#244855]/80 border border-[#90AEAD]/50 hover:border-[#E64833] text-[#FBE9D0] text-xs font-mono rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#E64833]" />
                <span>← Back to Marketplace</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#FBE9D0]/70 hover:text-[#FBE9D0] transition-colors p-1 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Title */}
            <div className="mb-5">
              <div className="text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase">
                Hostel Exchange & Snack Board
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#FBE9D0] mt-1">
                List Item for Live Auction
              </h2>
              <p className="text-xs text-[#FBE9D0]/80 mt-1">
                Upload photos from your phone or laptop. Winner collects in person with cash on pickup.
              </p>
            </div>

            {listingError && (
              <div className="mb-4 p-3 bg-[#E64833]/25 border border-[#E64833] text-xs text-[#FBE9D0] rounded-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#E64833] shrink-0 mt-0.5" />
                <span>{listingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* PHOTO UPLOAD & PRESET SECTION */}
              <div className="bg-[#244855]/90 border border-[#90AEAD]/60 rounded-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#90AEAD] uppercase flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#E64833]" />
                    <span>ITEM PHOTO (LOCAL FILE OR LIBRARY) *</span>
                  </label>
                  <span className="text-[10px] text-[#FBE9D0]/60">JPEG, PNG, WEBP</span>
                </div>

                {/* Upload Mode Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#244855] border border-[#90AEAD]/30 rounded-sm text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setPhotoTab('upload')}
                    className={`py-1.5 px-2 rounded-sm transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      photoTab === 'upload' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#90AEAD] hover:text-[#FBE9D0]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Device Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('library')}
                    className={`py-1.5 px-2 rounded-sm transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      photoTab === 'library' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#90AEAD] hover:text-[#FBE9D0]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Preset Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('url')}
                    className={`py-1.5 px-2 rounded-sm transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      photoTab === 'url' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#90AEAD] hover:text-[#FBE9D0]'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Image URL</span>
                  </button>
                </div>

                {/* 1. Device Upload / Drag & Drop */}
                {photoTab === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploadedImageBase64 ? (
                      <div className="relative rounded-sm border border-emerald-400 overflow-hidden bg-[#244855] p-2 flex items-center gap-3">
                        <img
                          src={uploadedImageBase64}
                          alt="Uploaded Preview"
                          className="w-16 h-16 rounded-sm object-cover border border-[#90AEAD]/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="text-emerald-400 font-bold flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Photo Ready for Listing</span>
                          </div>
                          <div className="text-[11px] text-[#FBE9D0]/70 truncate mt-0.5">
                            {uploadedFileName || 'device_photo.jpg'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveUploadedPhoto}
                          className="p-2 text-[#E64833] hover:text-white hover:bg-[#E64833] rounded-sm transition-colors cursor-pointer shrink-0"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={handleDropFile}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-sm p-6 text-center transition-all cursor-pointer ${
                          isDraggingFile
                            ? 'border-[#E64833] bg-[#E64833]/15'
                            : 'border-[#90AEAD]/50 hover:border-[#E64833] bg-[#244855]/60 hover:bg-[#244855]'
                        }`}
                      >
                        <Upload className="w-8 h-8 mx-auto text-[#90AEAD] mb-2 opacity-80" />
                        <div className="text-xs font-semibold text-[#FBE9D0]">
                          Click to browse device library or drag photo here
                        </div>
                        <div className="text-[10px] text-[#90AEAD] mt-1 font-mono">
                          Supports phone camera photos, screenshots, and PNG/JPEG
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Preset Photo Library */}
                {photoTab === 'library' && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-[#FBE9D0]/80">
                      Select an authentic hostel amenity or snack photo:
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_PHOTO_LIBRARY.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setUploadedImageBase64(preset.url);
                            setUploadedFileName(preset.name);
                            setNewCategory(preset.category);
                          }}
                          className={`p-1.5 rounded-sm border cursor-pointer transition-all flex flex-col items-center gap-1 ${
                            uploadedImageBase64 === preset.url
                              ? 'border-[#E64833] bg-[#244855] ring-2 ring-[#E64833]'
                              : 'border-[#90AEAD]/30 bg-[#244855]/70 hover:border-[#90AEAD]'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-14 object-cover rounded-sm" />
                          <span className="text-[10px] font-mono text-[#FBE9D0] truncate text-center w-full">
                            {preset.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Image URL */}
                {photoTab === 'url' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://example.com/item-photo.jpg"
                      className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-xs font-mono text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                    />
                    {customUrlInput.trim() && (
                      <div className="h-24 w-full rounded-sm overflow-hidden border border-[#90AEAD]/40">
                        <img
                          src={customUrlInput}
                          alt="URL Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                  ITEM TITLE *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 2X Spicy Samyang Ramen (2-Pack) or Chilled Red Bull"
                  className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-sans text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                    CATEGORY *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MarketplaceCategory)}
                    className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-sans text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#90AEAD] mb-1 flex items-center justify-between">
                    <span>STARTING BID (₹ INR) *</span>
                    <span className="text-[10px] text-[#90AEAD]">Min ₹5</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={newStartingBid}
                    onChange={(e) => setNewStartingBid(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                  />
                </div>
              </div>

              {/* Auction Duration Constraint: Strict max 48 hours */}
              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1 flex items-center justify-between">
                  <span>AUCTION DURATION (HOURS) *</span>
                  <span className="text-[10px] text-[#E64833] font-bold">Strict Max: 48 Hours</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 6, 12, 24, 36, 48].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setNewDurationHours(h)}
                      className={`py-2 px-2 text-xs font-mono rounded-sm border transition-colors cursor-pointer ${
                        newDurationHours === h
                          ? 'bg-[#E64833] border-[#E64833] text-[#FBE9D0] font-bold'
                          : 'bg-[#244855] border-[#90AEAD]/40 text-[#90AEAD] hover:border-[#90AEAD]'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-[#90AEAD] font-mono mt-1">
                  Auction will run for <strong>{newDurationHours} hours</strong> from publish.
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                  CONDITION & NOTES
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Expiry date, unopened seal, reason for selling..."
                  className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-sans text-xs text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
              </div>

              {/* Seller Location Verification */}
              <div className="p-3 bg-[#244855] border border-[#90AEAD]/40 rounded-sm text-xs space-y-1">
                <div className="text-[10px] font-mono text-[#90AEAD] uppercase">
                  Cash on Pickup Location
                </div>
                <div className="font-semibold text-[#FBE9D0]">
                  {currentUser.name} · REG-{currentUser.regDigits}
                </div>
                <div className="text-[#90AEAD] font-mono">
                  Room: {currentUser.room}
                </div>
                <div className="text-[10px] text-[#FBE9D0]/70 italic mt-1">
                  *Your room location will be revealed to the highest bidder when the timer closes for cash collection.
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-3 px-4 bg-[#244855] hover:bg-[#244855]/70 border border-[#90AEAD]/40 text-[#FBE9D0] font-medium text-xs rounded-sm transition-colors cursor-pointer"
                >
                  Cancel & Go Back
                </button>
                <button
                  type="submit"
                  disabled={isListingSubmitting}
                  className="flex-1 py-3 px-4 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-semibold text-sm rounded-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isListingSubmitting ? 'Consulting Warden Gemma...' : 'Publish Live Auction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED ITEM DETAILS & BIDDING INSPECTOR MODAL WITH PROMINENT "GO BACK" */}
      {detailedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#874F41] border border-[#90AEAD] shadow-2xl rounded-sm p-6 text-[#FBE9D0] max-h-[92vh] overflow-y-auto relative space-y-5">
            
            {/* Prominent Go Back Bar */}
            <div className="flex items-center justify-between border-b border-[#90AEAD]/40 pb-3">
              <button
                type="button"
                onClick={() => setDetailedItem(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#244855] hover:bg-[#244855]/80 border border-[#90AEAD]/50 hover:border-[#E64833] text-[#FBE9D0] text-xs font-mono rounded-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#E64833]" />
                <span>← Back to Marketplace</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailedItem(null)}
                className="text-[#FBE9D0]/70 hover:text-[#FBE9D0] transition-colors p-1 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo & Main Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative h-60 rounded-sm overflow-hidden bg-[#244855] border border-[#90AEAD]/50">
                <img
                  src={detailedItem.imageUrl || DEFAULT_FALLBACK_IMAGE}
                  alt={detailedItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-sm bg-[#244855]/95 border border-[#90AEAD]/60 text-[#FBE9D0]">
                    {detailedItem.category}
                  </span>
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#FBE9D0] leading-snug">
                    {detailedItem.title}
                  </h2>
                  <p className="text-xs text-[#FBE9D0]/80 mt-1.5 leading-relaxed">
                    {detailedItem.description}
                  </p>
                </div>

                <div className="p-3 bg-[#244855] border border-[#90AEAD]/40 rounded-sm space-y-1 text-xs font-mono">
                  <div className="text-[10px] text-[#90AEAD] uppercase">Seller Information</div>
                  <div className="font-bold text-[#FBE9D0]">
                    {detailedItem.sellerName} (REG-{detailedItem.sellerRegDigits})
                  </div>
                  <div className="text-[11px] text-[#90AEAD]">
                    Status: {detailedItem.status === 'active' ? '🟢 Active Auction' : '🔴 Closed'}
                  </div>
                </div>

                {/* Countdown Box */}
                <div className="p-3 bg-[#244855] border border-[#90AEAD]/50 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E64833]" />
                    <span className="text-xs font-mono text-[#90AEAD]">Time Remaining:</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-[#FBE9D0]">
                    {formatCountdown(detailedItem.endTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Bid & Action Strip */}
            <div className="p-4 bg-[#244855] border border-[#90AEAD]/60 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#90AEAD] uppercase">Leading Bid Amount</div>
                  <div className="font-serif text-3xl font-bold text-[#FBE9D0] tabular-nums mt-0.5">
                    ₹{detailedItem.currentBid}
                  </div>
                  <div className="text-xs font-mono text-[#90AEAD] mt-0.5">
                    Starting Bid was ₹{detailedItem.startingBid}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-[#90AEAD] uppercase">Current Leader</div>
                  <div className="text-sm font-semibold text-[#FBE9D0] mt-0.5">
                    {detailedItem.highestBidderName ? (
                      <span>{detailedItem.highestBidderName} (REG-{detailedItem.highestBidderRegDigits})</span>
                    ) : (
                      <span className="text-[#90AEAD] italic">No bids placed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bidding Controls if Active */}
              {detailedItem.status === 'active' && (
                <>
                  {detailedItem.sellerId === (currentUser.id || currentUser.uid) ? (
                    <div className="p-2.5 bg-[#874F41]/60 border border-[#90AEAD]/30 rounded-sm text-center text-xs font-mono text-[#90AEAD]">
                      You listed this item. Self-bidding is strictly prohibited by hostel rules.
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#90AEAD]/30 space-y-2">
                      <div className="flex items-center gap-2">
                        {[10, 25, 50].map((inc) => {
                          const target = detailedItem.currentBid + inc;
                          return (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => handlePlaceBid(detailedItem, target)}
                              className="flex-1 py-1.5 px-2 bg-[#874F41] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] text-xs font-mono rounded-sm transition-colors cursor-pointer"
                            >
                              +₹{inc} (₹{target})
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#90AEAD]">₹</span>
                          <input
                            type="number"
                            min={detailedItem.bids.length === 0 ? detailedItem.startingBid : detailedItem.currentBid + 5}
                            value={bidAmountMap[detailedItem.id] || (detailedItem.bids.length === 0 ? detailedItem.startingBid : detailedItem.currentBid + 5)}
                            onChange={(e) =>
                              setBidAmountMap({
                                ...bidAmountMap,
                                [detailedItem.id]: parseInt(e.target.value) || detailedItem.currentBid + 5,
                              })
                            }
                            className="w-full pl-7 pr-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm font-mono text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                          />
                        </div>
                        <button
                          onClick={() => handlePlaceBid(detailedItem)}
                          className="py-2 px-5 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-semibold text-xs sm:text-sm rounded-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap active:scale-[0.98]"
                        >
                          Submit Bid
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Winner / Cash On Pickup Information */}
            {detailedItem.status !== 'active' && (
              <div className="p-4 bg-[#244855] border-2 border-[#E64833] rounded-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-[#E64833] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Auction Winner Locked
                  </span>
                  <span>Final Price: ₹{detailedItem.winningBid || detailedItem.currentBid}</span>
                </div>
                <div className="text-base font-bold text-[#FBE9D0]">
                  {detailedItem.winnerName ? (
                    <span>{detailedItem.winnerName} (REG-{detailedItem.winnerRegDigits})</span>
                  ) : (
                    <span className="text-[#90AEAD] italic">Auction concluded with 0 bids</span>
                  )}
                </div>

                {/* Seller Room location revealed upon winning */}
                {(detailedItem.winnerId === (currentUser.id || currentUser.uid) ||
                  detailedItem.sellerId === (currentUser.id || currentUser.uid)) && detailedItem.winnerName && (
                  <div className="pt-2 border-t border-[#90AEAD]/30 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <MapPin className="w-4 h-4 text-[#E64833] shrink-0" />
                      <span>Cash on Pickup Room: {detailedItem.sellerRoom}</span>
                    </div>
                    <div className="text-[#FBE9D0]/80">
                      Winner visits seller's room directly to pay <strong>₹{detailedItem.winningBid || detailedItem.currentBid}</strong> in cash.
                    </div>
                    {detailedItem.status !== 'completed' && (
                      <button
                        onClick={() => handleConfirmPickup(detailedItem)}
                        className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-[#FBE9D0] font-semibold text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Cash Paid & Handover Completed</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Warden Inspection Note */}
            {detailedItem.wardenInspectionNote && (
              <div className="p-3 bg-[#244855]/80 border border-[#90AEAD]/40 rounded-sm text-xs font-serif italic text-[#FBE9D0] flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 flex-1">
                  <Sparkles className="w-4 h-4 text-[#E64833] shrink-0 mt-0.5" />
                  <div>
                    <strong className="not-italic text-[10px] font-mono uppercase text-[#90AEAD] block mb-0.5">
                      Warden Gemma Fair-Trade Clearance
                    </strong>
                    "{detailedItem.wardenInspectionNote}"
                  </div>
                </div>
                <SpeakButton
                  id={`inspection-${detailedItem.id}`}
                  text={detailedItem.wardenInspectionNote}
                  label="Speak Clearance Note"
                  size="xs"
                  className="shrink-0"
                />
              </div>
            )}

            {/* Bid History Table */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-[#90AEAD] uppercase flex items-center justify-between">
                <span>Transparent Sequence of Bids ({detailedItem.bids.length})</span>
                <span className="text-[10px] text-[#FBE9D0]/60">Immutable Audit Linked</span>
              </div>
              {detailedItem.bids.length === 0 ? (
                <div className="p-4 bg-[#244855]/50 border border-[#90AEAD]/30 rounded-sm text-center text-xs font-mono text-[#90AEAD]">
                  No bids have been recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {detailedItem.bids.map((b, idx) => (
                    <div
                      key={b.id}
                      className={`p-2.5 rounded-sm border flex items-center justify-between text-xs font-mono ${
                        idx === 0
                          ? 'bg-[#244855] border-[#E64833] text-[#FBE9D0] font-bold'
                          : 'bg-[#244855]/60 border-[#90AEAD]/30 text-[#FBE9D0]/80'
                      }`}
                    >
                      <div>
                        <span>{idx === 0 ? '👑 ' : ''}{b.bidderName}</span>
                        <span className="text-[10px] text-[#90AEAD] ml-1.5">(REG-{b.bidderRegDigits})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#90AEAD]">
                          {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-sm font-bold text-[#FBE9D0]">₹{b.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom prominent Go Back button */}
            <div className="pt-2 border-t border-[#90AEAD]/30 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailedItem(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#244855] hover:bg-[#244855]/80 border border-[#90AEAD]/50 hover:border-[#E64833] text-[#FBE9D0] text-xs font-mono rounded-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#E64833]" />
                <span>← Back to Marketplace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
