import { MarketplaceItem, Bid, MarketplaceCategory, Resident } from '../types';
import { appendAuditLog } from './storageService';
import { addNotification } from './notificationService';
import { generateMarketplaceInspectionNote } from './gemmaService';
import snackDeskImg from '../assets/images/hostel_snack_market_1791051746997.jpg';

const STORAGE_KEY = 'hostel_nexus_marketplace_v3';

const SEED_MARKET_ITEMS: MarketplaceItem[] = [
  {
    id: 'market-snack-1',
    title: 'Midnight 2X Spicy Samyang Ramen (2-Pack Sealed)',
    description: 'Directly from city supermarket, stored dry in food-safe tin. Perfect emergency fuel for end-sem nightouts or post-badminton hunger. 100% vegetarian.',
    category: 'Snacks & Munchies',
    imageUrl: snackDeskImg,
    startingBid: 120,
    currentBid: 160,
    highestBidderId: 'REG-108',
    highestBidderName: 'Siddharth Rao',
    highestBidderRegDigits: '108',
    highestBidderRoom: 'N-Block Room 205',
    bids: [
      {
        id: 'bid-101',
        itemId: 'market-snack-1',
        bidderId: 'REG-108',
        bidderName: 'Siddharth Rao',
        bidderRegDigits: '108',
        bidderRoom: 'N-Block Room 205',
        amount: 160,
        timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
      },
      {
        id: 'bid-100',
        itemId: 'market-snack-1',
        bidderId: 'REG-055',
        bidderName: 'Vikram Joshi',
        bidderRegDigits: '055',
        bidderRoom: 'A-Block Room 112',
        amount: 140,
        timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
      },
    ],
    sellerId: 'REG-412',
    sellerName: 'Aarav Mehta',
    sellerRegDigits: '412',
    sellerRoom: 'N-Block Room 304, South Wing',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 5 * 3600000).toISOString(), // 5 hours remaining
    durationHours: 8,
    status: 'active',
    wardenInspectionNote: 'Warden Inspection: Ramen imports sanctioned. Reminder: Water kettle heating allowed only up to 10:30 PM. Cash on pickup at Room 304.',
    wardenVerdictSource: 'gemma-builtin',
  },
  {
    id: 'market-drink-2',
    title: 'Chilled Red Bull Energy Drink (250ml Can)',
    description: 'Unopened cold can from hostel fridge. Kept chilled and unopened. Guaranteed authentic seal.',
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    startingBid: 110,
    currentBid: 140,
    highestBidderId: 'REG-221',
    highestBidderName: 'Aarav Patel',
    highestBidderRegDigits: '221',
    highestBidderRoom: 'N-Block Room 410',
    bids: [
      {
        id: 'bid-102',
        itemId: 'market-drink-2',
        bidderId: 'REG-221',
        bidderName: 'Aarav Patel',
        bidderRegDigits: '221',
        bidderRoom: 'N-Block Room 410',
        amount: 140,
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      },
    ],
    sellerId: 'REG-334',
    sellerName: 'Rohan Verma',
    sellerRegDigits: '334',
    sellerRoom: 'N-Block Room 218, North Wing',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 3 * 3600000).toISOString(), // 3 hours remaining
    durationHours: 4,
    status: 'active',
    wardenInspectionNote: 'Warden Inspection: Beverage auction cleared. Empty can must be deposited in the courtyard recycling bin, not tossed from the balcony.',
    wardenVerdictSource: 'gemma-builtin',
  },
  {
    id: 'market-gear-3',
    title: 'Yonex Super Grap Badminton Grip (Pack of 2 - Neon Yellow)',
    description: 'High sweat absorption polyurethane grips. Ideal for Badminton Court A & B matches in the evening.',
    category: 'Sports Gear',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    startingBid: 70,
    currentBid: 95,
    highestBidderId: 'REG-089',
    highestBidderName: 'Kunal Sen',
    highestBidderRegDigits: '089',
    highestBidderRoom: 'C-Block Room 102',
    bids: [
      {
        id: 'bid-103',
        itemId: 'market-gear-3',
        bidderId: 'REG-089',
        bidderName: 'Kunal Sen',
        bidderRegDigits: '089',
        bidderRoom: 'C-Block Room 102',
        amount: 95,
        timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      },
    ],
    sellerId: 'REG-412',
    sellerName: 'Aarav Mehta',
    sellerRegDigits: '412',
    sellerRoom: 'N-Block Room 304, South Wing',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 18 * 3600000).toISOString(), // 18 hours remaining
    durationHours: 22,
    status: 'active',
    wardenInspectionNote: 'Warden Inspection: Legitimate sports amenity. Don’t wrap grip tape in hostel corridor common areas; keep it inside your quarters.',
    wardenVerdictSource: 'gemma-builtin',
  },
  {
    id: 'market-study-4',
    title: 'Classmate Pulse Spiral Grid Notebook + Uniball Eye Pen',
    description: '300 pages unwrapped ruled paper + waterproof black micro pigment ink pen. Ready for labs and assignment submission crunch.',
    category: 'Study & Stationery',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    startingBid: 150,
    currentBid: 150,
    bids: [],
    sellerId: 'REG-144',
    sellerName: 'Devansh Kulkarni',
    sellerRegDigits: '144',
    sellerRoom: 'B-Block Room 302',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 24 * 3600000).toISOString(), // 24 hours remaining
    durationHours: 26,
    status: 'active',
    wardenInspectionNote: 'Warden Inspection: Approved educational gear. Academic dedication is strongly commended. Cash on pickup at Room 302.',
    wardenVerdictSource: 'gemma-builtin',
  },
];

export function getMarketplaceItems(): MarketplaceItem[] {
  let items: MarketplaceItem[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      items = JSON.parse(raw);
    } else {
      items = SEED_MARKET_ITEMS;
      saveMarketplaceItems(items);
    }
  } catch (e) {
    console.error('Failed to load marketplace items', e);
    items = SEED_MARKET_ITEMS;
  }

  // Live Auto-Closure Check: Check if any active items have passed their endTime
  const now = Date.now();
  let modified = false;

  items = items.map((item) => {
    if (item.status === 'active' && now >= new Date(item.endTime).getTime()) {
      modified = true;
      item.status = 'ended';

      if (item.bids && item.bids.length > 0) {
        // Sort bids highest first
        const sortedBids = [...item.bids].sort((a, b) => b.amount - a.amount);
        const topBid = sortedBids[0];
        item.winnerId = topBid.bidderId;
        item.winnerName = topBid.bidderName;
        item.winnerRegDigits = topBid.bidderRegDigits;
        item.winningBid = topBid.amount;

        // Log in permanent immutable audit ledger
        appendAuditLog({
          action: 'AUCTION_WON',
          userId: topBid.bidderId,
          userName: topBid.bidderName,
          resourceId: item.id,
          resourceName: item.title,
          slotLabel: 'Auction Closed',
          date: new Date().toISOString().split('T')[0],
          details: `Auction Won: ${topBid.bidderName} (REG-${topBid.bidderRegDigits}) won "${item.title}" with highest bid of ₹${topBid.amount}. Cash on pickup at seller room: ${item.sellerRoom}.`,
          creditsChanged: 0,
        });

        // Notify Winner: Reveal seller room & cash on pickup
        addNotification({
          type: 'AUCTION_WON_ALERT',
          title: 'Auction Won! Pick Up Your Item',
          message: `Congratulations! You won "${item.title}" for ₹${topBid.amount}. Visit seller ${item.sellerName} at ${item.sellerRoom} for Cash on Pickup.`,
          userId: topBid.bidderId,
          resourceId: item.id,
          date: new Date().toISOString().split('T')[0],
          marketItemId: item.id,
        });

        // Notify Seller
        addNotification({
          type: 'AUCTION_ITEM_SOLD',
          title: 'Auction Completed - Item Sold',
          message: `Your item "${item.title}" was won by ${topBid.bidderName} (REG-${topBid.bidderRegDigits}) for ₹${topBid.amount}. Expect cash on pickup at your room.`,
          userId: item.sellerId,
          resourceId: item.id,
          date: new Date().toISOString().split('T')[0],
          marketItemId: item.id,
        });
      } else {
        // Unsold
        appendAuditLog({
          action: 'CONFLICT_RESOLVED',
          userId: item.sellerId,
          userName: item.sellerName,
          resourceId: item.id,
          resourceName: item.title,
          slotLabel: 'Auction Expired',
          date: new Date().toISOString().split('T')[0],
          details: `Auction for "${item.title}" concluded with 0 bids. Item returned to seller.`,
          creditsChanged: 0,
        });
      }
    }
    return item;
  });

  if (modified) {
    saveMarketplaceItems(items);
  }

  return items;
}

export function saveMarketplaceItems(items: MarketplaceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save marketplace items', e);
  }
}

export interface CreateListingParams {
  title: string;
  description: string;
  category: MarketplaceCategory;
  imageUrl?: string;
  startingBid: number;
  durationHours: number; // 1 to 48 hours
  seller: Resident;
}

export async function createMarketplaceListing(params: CreateListingParams): Promise<{
  success: boolean;
  item?: MarketplaceItem;
  error?: string;
}> {
  const cleanTitle = params.title.trim();
  if (!cleanTitle || cleanTitle.length < 3) {
    return { success: false, error: 'Item title must be at least 3 characters.' };
  }

  if (params.startingBid < 5) {
    return { success: false, error: 'Starting bid must be at least ₹5.' };
  }

  // Strict Duration Constraint: Maximum 48 hours
  const hours = Math.min(48, Math.max(1, Math.round(params.durationHours)));
  if (hours > 48) {
    return { success: false, error: 'Auction duration cannot exceed the strict maximum of 48 hours.' };
  }

  const items = getMarketplaceItems();
  const itemId = `market-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const endTime = new Date(now.getTime() + hours * 3600 * 1000).toISOString();

  // Call Local Gemma AI for automated warden marketplace inspection
  let wardenInspectionNote = '';
  let wardenVerdictSource: 'gemma-open-weight' | 'gemma-builtin' = 'gemma-builtin';
  try {
    const aiNote = await generateMarketplaceInspectionNote({
      itemName: cleanTitle,
      category: params.category,
      startingBid: params.startingBid,
      sellerName: params.seller.name,
      sellerRoom: params.seller.room,
    });
    wardenInspectionNote = aiNote.text;
    wardenVerdictSource = aiNote.source;
  } catch {
    wardenInspectionNote = `Hostel Warden Note: Listing for ${cleanTitle} approved. Cash on pickup strictly within resident quarters. 48-hour auction rule enforced.`;
  }

  const newItem: MarketplaceItem = {
    id: itemId,
    title: cleanTitle,
    description: params.description.trim() || 'No additional condition notes provided.',
    category: params.category,
    imageUrl: params.imageUrl?.trim() || snackDeskImg,
    startingBid: params.startingBid,
    currentBid: params.startingBid,
    bids: [],
    sellerId: params.seller.id || params.seller.uid,
    sellerName: params.seller.name,
    sellerRegDigits: params.seller.regDigits,
    sellerRoom: params.seller.room,
    createdAt: now.toISOString(),
    endTime,
    durationHours: hours,
    status: 'active',
    wardenInspectionNote,
    wardenVerdictSource,
  };

  items.unshift(newItem);
  saveMarketplaceItems(items);

  // Append to PERMANENT Immutable Audit Ledger
  appendAuditLog({
    action: 'MARKETPLACE_LISTING',
    userId: params.seller.id || params.seller.uid,
    userName: params.seller.name,
    resourceId: newItem.id,
    resourceName: cleanTitle,
    slotLabel: `${hours}h Auction`,
    date: now.toISOString().split('T')[0],
    details: `Marketplace Listing: "${cleanTitle}" posted by ${params.seller.name} (REG-${params.seller.regDigits}, ${params.seller.room}). Starting Bid: ₹${params.startingBid}. Closes in ${hours}h.`,
    creditsChanged: 0,
  });

  return { success: true, item: newItem };
}

export function placeBidOnItem(
  itemId: string,
  amount: number,
  bidder: Resident
): { success: boolean; item?: MarketplaceItem; error?: string } {
  const items = getMarketplaceItems();
  const itemIndex = items.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return { success: false, error: 'Auction item not found.' };
  }

  const item = items[itemIndex];

  // 1. Check if auction is still active
  if (item.status !== 'active') {
    return { success: false, error: 'This auction has concluded. Bidding is closed.' };
  }

  if (Date.now() >= new Date(item.endTime).getTime()) {
    item.status = 'ended';
    saveMarketplaceItems(items);
    return { success: false, error: 'Auction time expired just now.' };
  }

  // 2. Prevent self-bidding
  if (item.sellerId === bidder.id || item.sellerId === bidder.uid) {
    return { success: false, error: 'You cannot bid on your own listed item.' };
  }

  // 3. Bid amount validation
  const minRequired = item.bids.length === 0 ? item.startingBid : item.currentBid + 5;
  if (amount < minRequired) {
    return {
      success: false,
      error: `Bid must be at least ₹${minRequired} (current highest is ₹${item.currentBid}).`,
    };
  }

  const previousHighestBidderId = item.highestBidderId;

  // 4. Create new bid
  const newBid: Bid = {
    id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    itemId: item.id,
    bidderId: bidder.id || bidder.uid,
    bidderName: bidder.name,
    bidderRegDigits: bidder.regDigits,
    bidderRoom: bidder.room,
    amount,
    timestamp: new Date().toISOString(),
  };

  item.bids.unshift(newBid);
  item.currentBid = amount;
  item.highestBidderId = bidder.id || bidder.uid;
  item.highestBidderName = bidder.name;
  item.highestBidderRegDigits = bidder.regDigits;
  item.highestBidderRoom = bidder.room;

  items[itemIndex] = item;
  saveMarketplaceItems(items);

  // 5. Append to Permanent Immutable Audit Ledger
  appendAuditLog({
    action: 'BID_PLACED',
    userId: bidder.id || bidder.uid,
    userName: bidder.name,
    resourceId: item.id,
    resourceName: item.title,
    slotLabel: `Bid ₹${amount}`,
    date: new Date().toISOString().split('T')[0],
    details: `New Leading Bid: ${bidder.name} (REG-${bidder.regDigits}) placed ₹${amount} on "${item.title}".`,
    creditsChanged: 0,
  });

  // 6. Notify previous highest bidder if outbid
  if (previousHighestBidderId && previousHighestBidderId !== (bidder.id || bidder.uid)) {
    addNotification({
      type: 'OUTBID_ALERT',
      title: 'You Have Been Outbid!',
      message: `Someone placed a higher bid of ₹${amount} on "${item.title}". Place a new bid to regain the lead before the timer expires.`,
      userId: previousHighestBidderId,
      resourceId: item.id,
      date: new Date().toISOString().split('T')[0],
      marketItemId: item.id,
    });
  }

  return { success: true, item };
}

export function confirmCashOnPickup(
  itemId: string,
  requestingUser: Resident
): { success: boolean; item?: MarketplaceItem; error?: string } {
  const items = getMarketplaceItems();
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return { success: false, error: 'Auction item not found.' };
  }

  const isSeller = item.sellerId === requestingUser.id || item.sellerId === requestingUser.uid;
  const isWinner = item.winnerId === requestingUser.id || item.winnerId === requestingUser.uid;

  if (!isSeller && !isWinner) {
    return { success: false, error: 'Only the seller or the auction winner can confirm cash-on-pickup.' };
  }

  item.status = 'completed';
  item.cashPaid = true;
  saveMarketplaceItems(items);

  // Append to Permanent Immutable Audit Ledger
  appendAuditLog({
    action: 'AUCTION_PAID_PICKUP',
    userId: requestingUser.id || requestingUser.uid,
    userName: requestingUser.name,
    resourceId: item.id,
    resourceName: item.title,
    slotLabel: 'Cash Handover',
    date: new Date().toISOString().split('T')[0],
    details: `Cash On Pickup Verified: ₹${item.winningBid || item.currentBid} paid in cash at ${item.sellerRoom} for "${item.title}". Item handed over to ${item.winnerName}. Transaction closed.`,
    creditsChanged: 0,
  });

  return { success: true, item };
}
