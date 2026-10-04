# AI-Powered Hostel Management with a Local, Open-Weight AI Warden

> "My roommate Arjun and I kept fighting over the badminton court. Every evening, 40 students raced to book 2 courts between 7–10 PM, and the group chat turned into a war zone. So I built Hostel Nexus — with a local Gemma-powered AI warden that arbitrates fairly, so nobody has to."

---

## 📖 The Story Behind Hostel Nexus

Campus hostel life revolves around shared amenities — badminton courts, table tennis blades, basketballs, and late-night study lounge speakers. But peak evening hours (7:00 PM – 10:00 PM) consistently turn into booking chaos. With no impartial authority on site, WhatsApp group chats degrade into shouting matches over slot claims, equipment hoarding, and curfew violations.

**Hostel Nexus** solves this human problem with technology. It combines a real-time 5:00 PM – 11:00 PM booking matrix, a weekly 4-credit quota system, and an automated **Local Gemma AI Warden** that delivers witty, authoritative, and completely unbiased arbitration verdicts for every reservation.

---

## 🔒 Why Open-Source AI Matters Here

For campus hostel environments, offloading AI arbitration to closed cloud APIs is fundamentally flawed. We built Hostel Nexus around **Google Gemma open-weight architecture** and local inference for four crucial reasons:

- **Runs 100% offline on a laptop via Ollama** — hostel Wi-Fi dies every night, the warden doesn't.
- **Student booking and dispute data never leaves the device** — no central server or third party peeking into private roommate conflicts.
- **Zero cost to run** — students live on tight budgets and can't pay per-token API bills.
- **Gemma is open-weight and swappable** — any hostel can easily fine-tune it on their own unique house rules.

---

## 🚀 Deployment & Hackathon Context

- **Deployed on Render — entering Best Use of Render**: Hosted on Render with zero-configuration build pipelines and lightning-fast serving.
- **Graceful Demo-Mode Fallback**: Detects when deployed cloud environments cannot reach a local `localhost:11434` / `localhost:8080` Ollama daemon and seamlessly switches to pre-scripted warden responses with a non-intrusive UI notice banner.
- **Live Court & Equipment Matrix (5:00 PM – 11:00 PM)**: Real-time slot scheduling for Badminton Courts A & B, Table Tennis Rackets, Basketball & Hoop, and Bluetooth Speakers.
- **Weekly 4-Credit Quota**: Prevents court hoarding with automated credit deduction and instant refunds on slot cancellation.
- **48-Hour Peer-to-Peer Hostel Marketplace**: Student snack, beverage, and stationery auctions with local photo uploads, live bidding, custom countdowns (max 48h), and seller room-number reveals for cash-on-pickup verification.
- **Permanent Immutable Audit Ledger**: Transparent activity log with zero clear/reset controls to guarantee total accountability.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS ("Deep Vintage Mood" design)
- **Local AI Engine**: Google Gemma (via Ollama / local server on port 11434/8080 or built-in demo fallback engine)
- **Icons**: Lucide React
- **Deployment**: Render

---

## 📦 Getting Started & Running Locally

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Achintyasingh412/hacktoberfest.git
   cd hacktoberfest
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start Local Gemma via Ollama (Optional for Live AI):**
   ```bash
   ollama run gemma:2b
   ```

4. **Launch the Application:**
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing & Hacktoberfest

We welcome contributions! Feel free to submit Pull Requests for new court scheduling rules, UI enhancements, or fine-tuned Gemma prompts.

Distributed under the MIT License.
