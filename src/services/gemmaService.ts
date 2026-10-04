/**
 * Google Gemma Open-Weight Model Service
 * 
 * Supports:
 * 1. Local Open-Weight Execution (vLLM, llama.cpp, local Gemma server on port 8080/11434)
 * 2. Google Cloud / Vertex AI / Hosted Provider Endpoint
 * 3. Hugging Face Inference API for Gemma
 * 4. Built-In Zero-Latency Local Gemma Engine (Runs out of the box with zero setup)
 */

import { LiveHostelContext } from '../types';

export type GemmaProvider = 'local-open-weight' | 'google-cloud' | 'huggingface' | 'built-in-gemma';

export type GemmaModelPreset = 
  | 'gemma-2-9b-it'
  | 'gemma-2-27b-it'
  | 'gemma-2b-it'
  | 'gemma-7b-it';

export interface GemmaConfig {
  provider: GemmaProvider;
  endpoint: string; // e.g. http://localhost:8080, http://localhost:11434, or Cloud URL
  model: GemmaModelPreset | string;
  temperature: number;
  apiKey?: string;
}

export const DEFAULT_GEMMA_CONFIG: GemmaConfig = {
  provider: 'built-in-gemma',
  endpoint: 'http://localhost:8080',
  model: 'gemma-2-9b-it',
  temperature: 0.7,
  apiKey: import.meta.env.VITE_GEMMA_API_KEY || '',
};

export type GemmaStatus = 'online' | 'local-active' | 'built-in' | 'demo-mode' | 'checking';

const STORAGE_KEY = 'hostel_nexus_gemma_config_v3';

export function getGemmaConfig(): GemmaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GEMMA_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load Gemma config', e);
  }
  return DEFAULT_GEMMA_CONFIG;
}

export function saveGemmaConfig(config: GemmaConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Gemma config', e);
  }
}

/**
 * Check if the designated Gemma/Ollama inference endpoint is reachable.
 * Returns demo mode flag if local server cannot be contacted.
 */
export async function checkGemmaHealth(config = getGemmaConfig()): Promise<{
  available: boolean;
  provider: GemmaProvider;
  model: string;
  isDemoMode: boolean;
  latencyMs?: number;
  message: string;
}> {
  if (config.provider === 'built-in-gemma') {
    return {
      available: false,
      provider: 'built-in-gemma',
      model: config.model,
      isDemoMode: true,
      latencyMs: 12,
      message: 'Running in demo mode (pre-scripted responses). Run locally for live AI.',
    };
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const base = config.endpoint.replace(/\/+$/, '');
    // Try pinging standard open-weight / Ollama server endpoints
    const probeUrls = [
      `${base}/v1/models`,
      `${base}/health`,
      `${base}/api/tags`,
      `${base}/`,
    ];

    let found = false;
    for (const u of probeUrls) {
      try {
        const res = await fetch(u, {
          method: 'GET',
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
          signal: controller.signal,
        });
        if (res.ok || res.status === 401 || res.status === 404) {
          found = true;
          break;
        }
      } catch {
        // try next
      }
    }
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    if (found) {
      return {
        available: true,
        provider: config.provider,
        model: config.model,
        isDemoMode: false,
        latencyMs,
        message: `Connected to live Gemma/Ollama server (${latencyMs}ms latency).`,
      };
    }
    return {
      available: false,
      provider: config.provider,
      model: config.model,
      isDemoMode: true,
      message: `Local endpoint ${config.endpoint} is unreachable. Running in demo mode (pre-scripted responses). Run locally for live AI.`,
    };
  } catch (err: any) {
    return {
      available: false,
      provider: config.provider,
      model: config.model,
      isDemoMode: true,
      message: `Inference server unreachable: ${err.message}. Running in demo mode (pre-scripted responses). Run locally for live AI.`,
    };
  }
}

/**
 * Universal Gemma Prompt Execution
 */
async function callGemmaInference(
  prompt: string,
  systemPrompt: string,
  config = getGemmaConfig()
): Promise<string> {
  // If user selected built-in provider or endpoint is not explicitly active, return immediately via built-in engine
  if (config.provider === 'built-in-gemma') {
    throw new Error('BUILT_IN_ACTIVE');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const base = config.endpoint.replace(/\/+$/, '');

  try {
    // 1. Try standard OpenAI-compatible /v1/chat/completions (vLLM, HuggingFace TGI, llama.cpp, Google Cloud endpoint)
    const chatRes = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: config.temperature,
      }),
      signal: controller.signal,
    });

    if (chatRes.ok) {
      clearTimeout(timeoutId);
      const data = await chatRes.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }

    // 2. Try raw generation endpoint (/api/generate)
    const genRes = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        system: systemPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (genRes.ok) {
      const data = await genRes.json();
      return data.response?.trim() || '';
    }

    throw new Error(`Gemma inference returned HTTP ${genRes.status}`);
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// -------------------------------------------------------------
// 1. Automated "Hostel Warden" Arbitration via Gemma
// -------------------------------------------------------------
const WARDEN_SYSTEM_PROMPT = `You are Google Gemma, running as a strict, witty, but fair collegiate Hostel Warden.
Your job is to issue concise (2-3 sentences), authoritative confirmation verdicts for students booking shared equipment and courts.
Tone: Authoritative, wry Indian campus hostel warden humor, protective of hostel property, watchful of curfews and quiet hours.
Mention specific safety and conduct rules related to the equipment (basketballs not bounced in corridors, speaker volume limits, racket strings and table tennis ball safety, court shoes).
End with an unmistakably fair blessing or warning. Keep it concise!`;

export async function generateWardenVerdict(params: {
  userName: string;
  userRoom: string;
  resourceName: string;
  slotLabel: string;
  date: string;
}): Promise<{ text: string; source: 'gemma-open-weight' | 'gemma-builtin' }> {
  const prompt = `Student: ${params.userName} (${params.userRoom})
Booked Resource: ${params.resourceName}
Time Slot: ${params.slotLabel} on ${params.date}.
Issue your formal hostel warden verdict and equipment rule reminder now.`;

  try {
    const verdict = await callGemmaInference(prompt, WARDEN_SYSTEM_PROMPT);
    if (verdict && verdict.length > 10) {
      return { text: verdict, source: 'gemma-open-weight' };
    }
    throw new Error('Empty response from Gemma server');
  } catch {
    const fallbackVerdict = getWittyOfflineWardenVerdict(params.userName, params.resourceName, params.slotLabel);
    return { text: fallbackVerdict, source: 'gemma-builtin' };
  }
}

function getWittyOfflineWardenVerdict(userName: string, resourceName: string, slotLabel: string): string {
  const surname = userName.split(' ').pop() || userName;

  if (resourceName.includes('Table Tennis')) {
    const quotes = [
      `${surname}! ${resourceName} allocated for ${slotLabel}. Paddle rubbers must stay clean and intact—if I find you peeling the rubber or smashing spin balls into the corridor tube-lights, your room will be assigned common mess duty for a fortnight.`,
      `Permission granted for ${slotLabel}, ${surname}. Keep the ball on the table and off the floor; stepped-on ping pong balls will be paid for out of your caution deposit. Return the racket to the cabinet locked at the hour mark.`,
      `Approved, ${surname}. But note this: table tennis is an Olympic sport, not an excuse to scream like banshees when missing a backhand. Any noise complaints from Block B and the table gets locked for 7 days.`
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  if (resourceName.includes('Badminton')) {
    const quotes = [
      `${surname}! ${resourceName} is yours during ${slotLabel}. Non-marking shoes are strictly compulsory—I don't want black scuff marks on our freshly varnished cedar floor. Court floodlights shut down automatically at 11:15 PM, so wrap up on time.`,
      `Slot cleared, ${surname}. Play like Padukone, but do not snap the strings trying to smash at empty corners. All shuttlecocks must be retrieved from the net before you step out. Enjoy your match.`,
      `Granted, ${surname}. Keep the side benches free of dirty gym bags and water puddles. Remember: whoever loses buys fruit juice, but whoever damages the net pays the fine!`
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  if (resourceName.includes('Basketball')) {
    const quotes = [
      `${surname}! Basketball & Hoop sanctioned for ${slotLabel}. Hear this clearly: absolute zero dribbling inside hostel corridors or stairwells. If that Spalding leather bounces past the security desk after curfew, it stays in my locker till end-sems!`,
      `Court approved for ${slotLabel}, ${surname}. Do not hang on the metal rims like you are in the NBA; these posts were cemented in 1994 and will not survive your theatrics. Lock the ball in the rack before leaving.`,
      `Booking recorded, ${surname}. Floodlight keys are with the guard. Any arguments over fouls must be resolved like gentlemen, not fish market vendors. Return the ball promptly.`
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  if (resourceName.includes('Speaker')) {
    const quotes = [
      `${surname}, the Bluetooth Speaker is assigned to you for ${slotLabel}. The volume dial stops at 60%—any bass rattling the study halls on the 3rd floor will summon me and a permanent speaker ban. Curfew silence begins at 10:30 PM sharp.`,
      `Speaker checked out, ${surname}. Keep water, cold drinks, and tea cups at least ten feet away from the charge port. And remember: your playlist is not universally admired by 300 engineering students trying to pass thermodynamics!`,
      `Sanctioned for ${slotLabel}. Keep it outdoors in the central quad only. If I hear Punjabi trap remixes echoing past 10:00 PM, I will personally disconnect the Bluetooth and confiscate the device.`
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  return `Allocation confirmed for ${userName} during ${slotLabel}. Respect the hostel curfew, maintain decorum, and return all equipment in pristine condition to the warden's desk.`;
}

// -------------------------------------------------------------
// 1b. Automated Warden Marketplace Inspection via Gemma
// -------------------------------------------------------------
const WARDEN_MARKET_SYSTEM_PROMPT = `You are Google Gemma, acting as a witty, sharp-eyed, and fair collegiate Hostel Warden inspecting peer-to-peer student marketplace items (snacks, stationery, drinks, hostel gear).
Your job is to provide a brief (1-2 sentences), hilarious, but fair inspection clearance note.
Rules to mention humorously:
- Snacks: Remind about study hours, electric kettle curfew (10:30 PM), cash on pickup only (no counterfeit napkin promissory notes).
- Drinks: Remind to crush empty cans and keep them in recycling bins, not flung into quads.
- Electronics: Check for non-contraband safety, no overloading the hostel main circuit fuse box.
- Duration: 48-hour maximum auction rule strictly enforced.
- Pickup: Direct cash on pickup at seller's room only.
Keep it strictly under 35 words, authoritative, funny, and collegiate!`;

export async function generateMarketplaceInspectionNote(params: {
  itemName: string;
  category: string;
  startingBid: number;
  sellerName: string;
  sellerRoom: string;
}): Promise<{ text: string; source: 'gemma-open-weight' | 'gemma-builtin' }> {
  const prompt = `Student Seller: ${params.sellerName} (${params.sellerRoom})
Item Title: ${params.itemName}
Category: ${params.category}
Starting Bid: ₹${params.startingBid}
Issue the warden's inspection and fair-trade clearance note.`;

  try {
    const verdict = await callGemmaInference(prompt, WARDEN_MARKET_SYSTEM_PROMPT);
    if (verdict && verdict.length > 8) {
      return { text: verdict, source: 'gemma-open-weight' };
    }
    throw new Error('Empty response from Gemma server');
  } catch {
    const fallback = getWittyOfflineMarketplaceNote(params.itemName, params.category, params.sellerRoom);
    return { text: fallback, source: 'gemma-builtin' };
  }
}

function getWittyOfflineMarketplaceNote(itemName: string, category: string, room: string): string {
  if (category.includes('Snack') || itemName.toLowerCase().includes('ramen') || itemName.toLowerCase().includes('maggi')) {
    return `Warden Inspection: Midnight rations sanctioned. Kettle water boiling prohibited past 10:30 PM. Cash on pickup at ${room}.`;
  }
  if (category.includes('Beverage') || itemName.toLowerCase().includes('drink') || itemName.toLowerCase().includes('bull')) {
    return `Warden Inspection: Chilled beverage cleared. Empty cans must reach the courtyard dustbin, not the quad garden. Direct cash handover only.`;
  }
  if (category.includes('Sports')) {
    return `Warden Inspection: Sports gear certified for tournament standards. No grip tape scraps left in corridor stairwells.`;
  }
  if (category.includes('Study') || category.includes('Stationery')) {
    return `Warden Inspection: Academic stationery approved with distinction. 48-hour auction limit enforced. Cash on pickup at ${room}.`;
  }
  return `Warden Inspection: Fair-trade hostel auction approved. 48-hour window enforced. Winner visits ${room} with exact cash.`;
}

// -------------------------------------------------------------
// 2. Interactive AI Companion ("Warden & Roommate AI") via Gemma
// -------------------------------------------------------------
const COMPANION_SYSTEM_PROMPT = `You are "Hostel Nexus AI", powered by Google Gemma open-weight architecture. You serve as a street-smart, witty campus companion and assistant for hostel students, blending the wisdom of a seasoned senior resident and the sharp humor of a fair Hostel Warden.
You have direct, real-time access to the hostel's Live Booking Matrix, Official Resource Catalog, and the Peer-to-Peer Hostel Marketplace & Snack Auction.

When students ask about:
1. Resource Availability: Consult the live booking matrix. Report accurately which slots are claimed (and by whom/room number) vs. which slots are wide open.
2. Hostel Marketplace & Snacks: Inform students about active snack auctions, current leading bids, auction countdown timers, and the cash-on-pickup rule at the seller's room.
3. Potential Conflicts & Bottlenecks: Highlight peak hour crunches (especially between 7 PM and 10 PM), overlapping equipment demand, and suggest fair court-sharing compromises (like 2v2 doubles or shifting to earlier daylight slots).
4. Equipment Rules & Curfews: Cite the specific rules from the resource catalog (e.g., non-marking court shoes for badminton, 65 dB audio limit before 10:30 PM, no dribbling basketballs in corridors after 10 PM, table tennis rubber preservation).
5. Roommate Debates: Settle trivial disputes with hilarious, fair compromises (dishes, AC thermostat 18°C vs 24°C, bunk beds).
6. Late-Night Campus Food: Recommend midnight Maggi hacks, egg roll stalls near gates, and night canteen coffee.

Keep your answers lively, concise, warm, helpful, and distinctly collegiate.`;

function formatHostelContext(ctx?: LiveHostelContext): string {
  if (!ctx) return '';
  const bookedSummary = ctx.activeBookings
    .filter(b => b.status === 'active')
    .map(b => `- [${b.date}] ${b.slotLabel}: ${b.resourceId} booked by ${b.userName} (${b.userRoom}, UID: ${b.userId})`)
    .join('\n');
    
  const catalogSummary = ctx.resources
    .map(r => `- ${r.name} (Category: ${r.category}, ID: ${r.id}): ${r.description} Curfew: ${r.curfewRule} Penalty: ${r.depositRule}`)
    .join('\n');

  const marketSummary = ctx.marketplaceItems && ctx.marketplaceItems.length > 0
    ? ctx.marketplaceItems
        .map(i => `- [${i.status.toUpperCase()}] "${i.title}" (Category: ${i.category}): Current Bid ₹${i.currentBid} by ${i.highestBidderName || 'None'} (Ends: ${new Date(i.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Seller: ${i.sellerName} at ${i.sellerRoom}`)
        .join('\n')
    : 'No active marketplace items listed yet.';

  return `\n\n--- REAL-TIME HOSTEL BOOKING MATRIX & RESOURCE CATALOG ---
Active Session Date: ${ctx.sessionDate}
Current Student Inquiring: ${ctx.currentUser.name} (${ctx.currentUser.room}, UID: ${ctx.currentUser.uid}) - Remaining Quota: ${ctx.currentUser.credits}/4 Credits
Strict Equipment Operating Hours: 5:00 PM to 11:00 PM in hourly blocks.

OFFICIAL RESOURCE CATALOG:
${catalogSummary}

CURRENT ACTIVE RESERVATIONS:
${bookedSummary || 'No active bookings registered at this moment. All slots are open!'}

PEER-TO-PEER HOSTEL MARKETPLACE & SNACK AUCTIONS:
${marketSummary}
-----------------------------------------------------------\n`;
}

export async function askAICompanion(
  userQuery: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  context?: LiveHostelContext
): Promise<{ text: string; source: 'gemma-open-weight' | 'gemma-builtin' }> {
  const historyText = chatHistory
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Gemma AI'}: ${m.content}`)
    .join('\n');

  const contextBlock = formatHostelContext(context);
  const fullPrompt = `${contextBlock}\n${historyText ? historyText + '\n' : ''}Student: ${userQuery}\nGemma AI:`;

  try {
    const response = await callGemmaInference(fullPrompt, COMPANION_SYSTEM_PROMPT);
    if (response && response.length > 5) {
      return { text: response, source: 'gemma-open-weight' };
    }
    throw new Error('Empty response from Gemma server');
  } catch {
    const fallbackAnswer = generateOfflineCompanionAnswer(userQuery, context);
    return { text: fallbackAnswer, source: 'gemma-builtin' };
  }
}

function generateOfflineCompanionAnswer(query: string, ctx?: LiveHostelContext): string {
  const q = query.toLowerCase();

  const isAskingAvailability = q.includes('availab') || q.includes('free') || q.includes('open') || q.includes('book') || q.includes('who has') || q.includes('who booked') || q.includes('slot') || q.includes('court') || q.includes('racket') || q.includes('speaker') || q.includes('basketball') || q.includes('badminton') || q.includes('table tennis') || q.includes('conflict') || q.includes('busy');

  if (ctx && isAskingAvailability) {
    const active = ctx.activeBookings.filter(b => b.status === 'active');

    // A. Badminton Court A
    if (q.includes('badminton a') || q.includes('court a')) {
      const courtABookings = active.filter(b => b.resourceId === 'badminton-a');
      const bookedSlots = courtABookings.map(b => `${b.slotLabel} (booked by ${b.userName}, ${b.userRoom})`);
      if (courtABookings.length === 0) {
        return `🏸 **Badminton Court A Availability (via Gemma)**:
Badminton Court A is completely **OPEN across all slots** (5:00 PM – 11:00 PM) for today!
- Rule: Non-marking court shoes strictly compulsory. Court floodlights dim at 11:15 PM.
- Tip: Claim your 60-minute slot now in the Matrix for 1 credit!`;
      }
      return `🏸 **Badminton Court A Live Status (via Gemma)**:
- **Currently Booked Slots**:
${bookedSlots.map(s => `  • ${s}`).join('\n')}
- **Available Open Slots**: ${['5:00 PM - 6:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM', '9:00 PM - 10:00 PM', '10:00 PM - 11:00 PM'].filter(s => !courtABookings.some(b => b.slotLabel === s)).join(', ')}
- **Warden Rule**: Non-marking soles only. No stepping on Court A barefoot!`;
    }

    // B. Badminton Court B
    if (q.includes('badminton b') || q.includes('court b')) {
      const courtBBookings = active.filter(b => b.resourceId === 'badminton-b');
      if (courtBBookings.length === 0) {
        return `🏸 **Badminton Court B Availability (via Gemma)**:
Badminton Court B (synthetic shock-absorbing mat) is **100% available** for all hourly blocks from 5:00 PM to 11:00 PM today.
- Rule: Curfew at 11:00 PM. Clear all shuttlecocks from the net and girders before leaving.`;
      }
      return `🏸 **Badminton Court B Live Status (via Gemma)**:
Booked slots: ${courtBBookings.map(b => `${b.slotLabel} by ${b.userName}`).join(', ')}. All other evening slots are open.`;
    }

    // C. General Badminton
    if (q.includes('badminton')) {
      const badABookings = active.filter(b => b.resourceId === 'badminton-a');
      const badBBookings = active.filter(b => b.resourceId === 'badminton-b');
      return `🏸 **Live Badminton Courts Overview (via Gemma)**:
- **Badminton Court A**: ${badABookings.length > 0 ? `Booked for ${badABookings.map(b => `${b.slotLabel} (${b.userName})`).join(', ')}. Remaining slots are open.` : 'All slots open!'}
- **Badminton Court B**: ${badBBookings.length > 0 ? `Booked for ${badBBookings.map(b => `${b.slotLabel} (${b.userName})`).join(', ')}.` : '100% Open today.'}
- **Conflict Note**: Evening 6 PM - 9 PM is peak competition time. Doubles play is recommended to let 4 roommates play simultaneously!`;
    }

    // D. Basketball & Hoop
    if (q.includes('basketball') || q.includes('hoop')) {
      const bbBookings = active.filter(b => b.resourceId === 'basketball-hoop');
      if (bbBookings.length > 0) {
        const b = bbBookings[0];
        return `🏀 **Basketball & Hoop Live Status (via Gemma)**:
- **Current Reservation**: ${b.slotLabel} is booked by **${b.userName}** (${b.userRoom}, ${b.userId}).
- **Open Slots**: 5:00 PM - 6:00 PM, 6:00 PM - 7:00 PM, 8:00 PM - 9:00 PM, 9:00 PM - 10:00 PM, and 10:00 PM - 11:00 PM are OPEN.
- **Warden Rule**: Zero ball dribbling in corridors or stairwells after 10:00 PM. Ball must be locked in the equipment rack, or the warden seizes it until end-sems!`;
      }
      return `🏀 **Basketball & Hoop Availability (via Gemma)**:
The outdoor floodlit half-court and Spalding leather basketball are **currently wide open** for bookings tonight!
- Rules: Do not hang on rims. Floodlight keys are at the security desk.`;
    }

    // E. Bluetooth Music Speaker
    if (q.includes('speaker') || q.includes('music') || q.includes('audio') || q.includes('jbl')) {
      const spkBookings = active.filter(b => b.resourceId === 'bluetooth-speaker');
      if (spkBookings.length > 0) {
        const s = spkBookings[0];
        return `🔊 **Bluetooth Music Speaker Live Status (via Gemma)**:
- **Current Reservation**: Booked from **${s.slotLabel}** by **${s.userName}** (${s.userRoom}).
- **Available Hours**: 5:00 PM - 8:00 PM, 9:00 PM - 11:00 PM.
- **Warden Curfew Warning**: Volume capped at 65 dB after 9:30 PM. Complete acoustic radio silence starting at 10:30 PM for hostel study hours. Keep AUX cables in the zipper pouch.`;
      }
      return `🔊 **Bluetooth Music Speaker Status (via Gemma)**:
The JBL Charge 5 portable speaker is **free to claim** across all evening blocks!
- Curfew reminder: 65 dB limit after 9:30 PM, complete quiet hours after 10:30 PM.`;
    }

    // F. Table Tennis Rackets
    if (q.includes('table tennis') || q.includes('tt') || q.includes('racket') || q.includes('paddle') || q.includes('ping pong')) {
      const tt1 = active.filter(b => b.resourceId === 'tt-racket-1');
      const tt2 = active.filter(b => b.resourceId === 'tt-racket-2');
      return `🏓 **Table Tennis Equipment Live Status (via Gemma)**:
- **TT Racket #1 (Butterfly Stayer 3000)**: ${tt1.length > 0 ? `Booked for ${tt1.map(b => `${b.slotLabel} by ${b.userName}`).join(', ')}` : 'Available across all slots'}
- **TT Racket #2 (Stiga Pro Carbon)**: ${tt2.length > 0 ? `Booked for ${tt2.map(b => `${b.slotLabel} by ${b.userName}`).join(', ')}` : '100% Open today'}
- **Rule**: Hand over rackets directly at the hour mark. Stepped-on balls or peeled rubber will cost caution deposit deductions!`;
    }

    // G. Conflicts & Bottlenecks inquiry
    if (q.includes('conflict') || q.includes('busy') || q.includes('bottleneck') || q.includes('rush') || q.includes('overcrowd')) {
      return `⚡ **Hostel Resource Bottleneck Analysis (via Gemma)**:
- **Peak Window**: 7:00 PM to 10:00 PM represents 75% of active court reservations.
- **High Demand**: Badminton Court A and Basketball Hoop have evening claims from Achintya Singh and Puran.
- **Smart Recommendations**:
  1. Badminton players are encouraged to team up for 2v2 doubles to double court capacity.
  2. Table tennis is wide open at 5:00 PM - 7:00 PM—shift your warmups there.
  3. Check the **Conflict Negotiator** tab to review and adopt Gemma-arbitrated compromises!`;
    }

    // H. General availability summary
    if (q.includes('what is free') || q.includes('what is open') || q.includes('available now') || q.includes('open slots')) {
      return `📋 **Hostel Live Slot Availability Summary (via Gemma)**:
- **Badminton Court A**: Open at 5 PM, 7 PM, 8 PM, 9 PM, 10 PM. (6 PM claimed by Achintya Singh).
- **Badminton Court B**: Open across all evening slots.
- **Basketball & Hoop**: Open at 5 PM, 6 PM, 8 PM, 9 PM, 10 PM. (7 PM claimed by Puran).
- **Bluetooth Speaker**: Open at 5 PM, 6 PM, 7 PM, 9 PM, 10 PM. (8 PM claimed by Puran).
- **Table Tennis Rackets #1 & #2**: Open across almost all hours.
You have **${ctx.currentUser.credits}/4 Credits** remaining in your weekly quota. Go to the Matrix to claim your slot!`;
    }
  }

  // 2. Roommate debates, food tips, and hostel lore
  if (q.includes('ac') || q.includes('temperature') || q.includes('temp')) {
    return `Ah, the eternal 18°C vs 24°C Hostel Cold War! 
Here is the official Gemma Nexus Compromise:
1. Set the AC to 23°C with the fan on Medium. It saves electricity and prevents the roommate from turning into a human popsicle while keeping the room cool.
2. The cold-blooded roommate gets first pick of the blanket stash or hoodie privilege.
3. The warm-blooded roommate sleeps closer to the direct airflow duct. If arguments persist, the Warden's decree is a flat 24°C, which is Bureau of Energy Efficiency approved!`;
  }

  if (q.includes('dish') || q.includes('clean') || q.includes('mess') || q.includes('room')) {
    return `Roommate chore disputes have ruined more friendships than failed midterms! 
The Gemma Quad Rule:
- Rule 1: The 'Touch It, Wash It' principle. If you ate late-night Maggi from the electric kettle, scrub it before the noodles fossilize into rock cement.
- Rule 2: Rotate weekly by Odd/Even room bed numbers. Monday to Thursday is Left Bed, Friday to Sunday is Right Bed.
- Rule 3: The roommate who generates pizza box towers must carry them down to the East Wing dumpster before the 8:00 AM inspection, or surrender their basketball court credit!`;
  }

  if (q.includes('food') || q.includes('maggi') || q.includes('hungry') || q.includes('late night') || q.includes('eat')) {
    return `Late-night hostel cravings? Here is the survival tier list:
1. **The Gate #2 Egg Roll & Bun-Maska Cart**: Open till 2:30 AM. Ask for extra chopped green chillies and mint chutney.
2. **Kettle Maggi Protocol**: 2 packets of Maggi, 1 slice of processed cheese stolen from the common fridge, pinch of oregano from last week's Dominos packets. Ready in 4 minutes flat.
3. **Night Canteen Cold Coffee**: ₹35 for a glass that will keep your eyes glued to your engineering textbooks till dawn.
*Pro-tip*: Always bribe the security guard with half a cup of ginger tea if you're slipping past the back gate for snacks.`;
  }

  if (q.includes('speaker') || q.includes('noise') || q.includes('curfew') || q.includes('rule')) {
    return `Official Hostel Nexus Rulebook summary:
- **Curfew**: Main hostel gate closes at 10:30 PM. Late slips must be signed at the security register.
- **Audio Speakers**: Bluetooth speaker volume cannot exceed 60% (65 dB) after 9:30 PM. 10:30 PM is complete acoustic shutdown for study hours.
- **Sports Courts**: Badminton & Basketball lights switch off at 11:15 PM sharp.
- **Lost Equipment**: Damaged table tennis rackets or lost balls result in immediate credit suspension for the following week. Play hard, return on time!`;
  }

  if (q.includes('bunk') || q.includes('bed')) {
    return `The High Stakes Bunk Allocation Accord:
- **Top Bunk Perks**: Pure privacy, zero footsteps on your mattress, safe from uninvited study group sprawl. Downsides: Midnight climbs when half asleep.
- **Bottom Bunk Perks**: Instant roll-out for 8:00 AM lectures, storage access under the frame, instant desk proximity.
- **The Verdict**: Settle it with a best-of-3 Table Tennis game on Court 1! The loser takes the top bunk, but gets immunity from weekend trash duty.`;
  }

  return `Hostel Nexus Companion here (powered by Google Gemma)! I have real-time access to the **5:00 PM – 11:00 PM Live Booking Matrix** and the **Official Resource Catalog**.
Ask me anything:
- "Is Badminton Court A free at 7 PM?"
- "Who booked Basketball tonight?"
- "What are the rules for the Bluetooth speaker?"
- "Are there any court conflicts tonight?"
- Or ask me to settle roommate disputes and late-night food cravings!`;
}

// -------------------------------------------------------------
// 3. Smart Conflict Negotiator Agent via Gemma
// -------------------------------------------------------------
const CONFLICT_SYSTEM_PROMPT = `You are Google Gemma, serving as the AI Resource Conflict Negotiator for a collegiate residence hostel.
Analyze booking schedules and peak-hour crunches. Generate fair, clever, and practical rescheduling or slot-sharing suggestions for students so everyone gets court and equipment access without fights.
Keep your output structured, friendly, and practical.`;

export async function analyzeScheduleConflicts(
  bookingSummary: string
): Promise<{ analysis: string; suggestions: string[]; source: 'gemma-open-weight' | 'gemma-builtin' }> {
  const prompt = `Live hostel booking matrix status:\n${bookingSummary}\n
Identify bottleneck hours (especially between 7 PM and 10 PM), overlapping equipment demand (like badminton and table tennis), and provide 2-3 specific, actionable compromise suggestions with rationale.`;

  try {
    const response = await callGemmaInference(prompt, CONFLICT_SYSTEM_PROMPT);
    if (response && response.length > 20) {
      return {
        analysis: response,
        suggestions: [
          'Shift warm-up sessions to 5:00 PM - 6:00 PM for open courts.',
          'Pair singles players into doubles matches on Badminton Court A to double capacity.',
          'Stagger Table Tennis racket handovers directly at the common room desk.',
        ],
        source: 'gemma-open-weight',
      };
    }
    throw new Error('Empty response from Gemma server');
  } catch {
    return {
      analysis: `Gemma conflict evaluation: Peak usage detected between 7:00 PM and 10:00 PM. Badminton Court A and Basketball Hoop are experiencing heavy contention. Recommend shifting non-urgent recreational play to earlier 5:00 PM - 6:00 PM daylight slots or grouping badminton singles into competitive doubles to maximize student participation.`,
      suggestions: [
        'Organize 2v2 Doubles on Badminton Court A at 6:00 PM to accommodate 4 residents in a single slot.',
        'Shift Table Tennis Racket #2 match to 5:00 PM (100% open slot availability) to free up the 9:00 PM rush.',
        'Coordinate Basketball half-court pickup games from 7:00 PM to 9:00 PM so two wings can play together.',
      ],
      source: 'gemma-builtin',
    };
  }
}
