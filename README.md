# TradeNext OTC — Dynamic MERN Stack PWA

A high-performance, mobile-first **MERN Stack Progressive Web Application (PWA)** for rapid OTC Bitcoin binary trading, built with real-time WebSocket streaming, interactive HTML5 Canvas candlestick charting, and a **Color-Prediction / Lowest-Bet-Wins House Advantage Algorithm**.

---

## 🌟 Key Features

### 1. MERN Architecture
- **M (MongoDB & Mongoose)**: Seamless dual-mode database persistence. Automatically connects to MongoDB (`mongodb://localhost:27017/otc_trade`) if available, or activates an ultra-fast in-memory reactive data store with zero downtime and zero setup friction.
- **E (Express.js)**: REST API handling user sessions, demo balance top-ups, order book history, and static PWA distribution.
- **R (React 19 + Vite)**: Mobile-first trading interface with native iOS & Android PWA installability, reactive state hooks, and high-DPI Canvas graphics.
- **N (Node.js & Socket.io)**: Sub-second live candle tick streaming (400ms interval), rapid 30s/15s round lifecycle management, and bi-directional trade confirmations.

### 2. Color-Prediction Algorithm ("Lowest Bet Side Wins")
- **House Advantage Core**: The round resolution mathematically favors the side (CALL or PUT) with the **least total money bet**, guaranteeing system profitability over time.
- **Natural Volatility**: Price movements remain completely organic (0.08% to 0.25% variance), avoiding suspicious giant candles.
- **Psychological Phase**: Early and mid-round ticks allow trade fluctuations (including temporary profit previews) before smoothly guiding the close price across the entry threshold during the final lock window.
- **Simulated Organic Participants**: Continuous background liquidity bot trades simulate a live, bustling global OTC marketplace.

### 3. Mobile PWA Capabilities
- **Installable**: Full `manifest.json` with standalone display mode, orientation lock, and HD icons (192x192, 512x512).
- **Service Worker (`sw.js`)**: App shell precaching and offline fallback.
- **Mobile-First Layout**: Sleek dark aesthetics matching high-tier brokerages (`TradeNext` branding, gold wallet icon, balance deposit pill, quick preset chips, full-width action buttons).
- **Chart Visuals**: Live horizontal entry price lines, right-axis badges (`BUY 96420`), stem direction arrows, dynamic entry tags (`$50.00 (00:03)`), and live floating PnL.
- **Sound Engine**: Web Audio API synthesizer for realistic bet clicks, tick pulses, win arpeggios, and loss feedback.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root (server) dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 2. Development Mode (Hot Reload)
Runs both the backend server (port `5005`) and the Vite React client (port `3000` with WebSocket proxy) simultaneously:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Mode (Unified Fullstack Server)
Build the React PWA and serve everything from the single Node/Express server:
```bash
npm run build
npm start
```
Open [http://localhost:5005](http://localhost:5005).

---

## 📱 Installing on Mobile

- **Android (Chrome)**: Tap the bottom nav **PWA App** tab or the Chrome menu (⋮) ➔ **"Add to Home screen"**.
- **iOS (Safari)**: Tap the Share button (⎋) at the bottom of Safari ➔ **"Add to Home Screen" (⊞)**.

---

## 🛠️ API & Socket.io Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | System health and active DB mode (MongoDB or In-Memory) |
| `GET` | `/api/user/:userId` | User account balance and statistics |
| `POST` | `/api/user/deposit` | Demo account fund deposit |
| `POST` | `/api/user/reset` | Reset demo balance to default ($9,379.63) |
| `GET` | `/api/trades/:userId` | User's trade history and settled orders |
| `WS` | `TICK` | Real-time candle updates and current price broadcast |
| `WS` | `POOL_UPDATE` | Dynamic Call vs Put betting pool percentages |
| `WS` | `PLACE_TRADE` | Place an active CALL or PUT order |
| `WS` | `ROUND_RESOLVED`| Final round outcome and individual P&L settlement |
