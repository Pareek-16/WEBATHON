# SmartStock AI — Professional Grocery Inventory, Expiry Prevention & Food Recovery Platform
> **Tagline:** Your Store. Your Stock. Under Control.

SmartStock AI is a full-featured, AI-powered inventory operations platform engineered specifically for Indian grocery shopkeepers, kirana stores, convenience shops, and small retailers. It prevents capital loss by monitoring batch-level expiry dates, optimizing purchase orders, and routing eligible surplus to verified Gaushalas, food banks, and secondary retailers.

---

## 🌟 Key Features

### 1. Main Dashboard — Today's Store Health
- **5-Second Attention Check**: Personalized greeting, live store health status, and today's operational priorities.
- **5 Primary Metric Cards**: Total Products, Available Stock, Low Stock Items, Expired Stock, and Expiring Soon (all clickable to filtered views).
- **3-Stage Expiry Overview**:
  - **RED — Critical:** Expired batches and items expiring today (blocked from human consumption).
  - **YELLOW — Warning:** Batches expiring within the 7-day early warning window.
  - **GREEN — Safe:** Batches with > 7 days remaining.
- **Shop-Level Live Countdown Ticker**: Real-time ticker displaying the nearest upcoming expiry batch and deadline countdowns.
- **Weekly Sales Velocity Chart**: Clean, interactive SVG bar chart showing actual transaction velocity.
- **Inventory Valuation & Expiry Loss Exposure**: Real-time capital risk calculation (₹ at risk).

### 2. Expiry Radar (Core Engine)
- **Batch-Level Expiry Monitoring**: Tracks individual batches rather than generic product expiry dates.
- **FEFO (First Expired, First Out)**: Prioritizes batches nearest to expiry for retail counter sales.
- **Configurable Warning Threshold**: Interactive slider (3–21 days, default 7 days).
- **Direct Operational Actions**: One-click actions to route to Food Recovery, create clearance discounts, or record authorized write-offs.

### 3. Food Recovery Platform
- **Core Principle:** Safety takes priority over recovery. Expired food is strictly barred from human consumption.
- **3 Strict Recipient Categories:**
  1. **Cattle Caretakers & Gaushalas**: Day-old bakery and grain surplus repurposed for registered cow shelters (Shri Krishna Gaushala, Najafgarh).
  2. **Food Redistribution NGOs**: Verified hunger relief organizations (Robin Hood Army, Feeding India) for unexpired food (≥ 2 days shelf life).
  3. **Chemists & OTC Retailers**: Eligible sealed nutritional supplements (Horlicks, Glucose-D, Oats).
- **Matching Engine**: Displays exact eligibility rationale and safety restrictions.
- **Verified Actions**: Direct **Call** (`tel:`) and **WhatsApp** (`https://wa.me/`) with prefilled Hindi/English pickup details.
- **Handover Confirmation**: Transactional stock deduction with celebratory confetti.

### 4. Invoice AI (Automatic Inventory Entry)
- **Automated Ingestion**: Drag & drop PDF/image invoices with OCR extraction.
- **Sample Indian Distributor GST Invoices**: 1-click test with Amul Dairy, ITC North, and Mandi distributor invoices.
- **Missing Expiry Date Safeguard**: Indian invoices often omit expiry dates; SmartStock AI flags missing dates and requires physical label entry without fabricating data.
- **Transactional Ingestion**: Automatically creates batch records, updates Expiry Radar, and logs stock receipts.

### 5. Multilingual AI Voice Assistant (SmartStock SOS)
- **Supported Languages**: English, हिन्दी (Hindi), Hinglish.
- **Voice Recognition**: Web Speech API (`SpeechRecognition`) with visual audio waveform and typed fallback.
- **Voice Synthesis**: Spoken answers in natural Indian English or Hindi.
- **Live Database Interrogation**: Answers real-time questions about expired stock, low inventory, gaushala matches, and festival demand.

### 6. Sales & Counter POS
- **Fast Kirana Counter Billing**: Rapid product search and barcode lookup.
- **FEFO Batch Enforcement**: Guides cashiers to sell nearest-expiring batches first.
- **Payment Options**: Cash, UPI (with interactive QR code dialog), and Udhaar Khata (Store Credit).
- **Printable Receipt**: Generates thermal/GST bill previews.

### 7. Festival Demand Planner
- **Seasonal Forecasts**: Presets for Diwali, Holi, Eid, Raksha Bandhan, Navratri, Durga Puja, Christmas.
- **Demand Multipliers**: Calculates surge multipliers (e.g. Diwali cooking oil +140%, sweets/chocolates +250%).
- **Stock Gap & Budget Calculation**: `Suggested Reorder Qty = Forecast Demand - Current Stock - Incoming Stock`.
- **1-Click PO Generation**: Converts festival plans directly into purchase orders.

### 8. Procurement & Supplier Registry
- **Directory**: Lead times, minimum order quantities (MOQ), contact numbers, and ratings.
- **Purchase Order Workflow**: Draft -> Ordered -> Goods Receipt.
- **Goods Receipt Flow**: Generates new batches with expiry dates and updates stock transactionally.

### 9. Smart Notifications & Restrained Audio Alerts
- **Web Audio API Synthesizer**: Generates gentle, non-jarring acoustic beeps (no external MP3 dependencies).
- **Quiet Hours**: Respects configured quiet hours (e.g. 22:00 to 07:30).
- **Deliberate 3-Tap Acknowledgement Protocol**:
  1. *Tap 1:* Open alert details and review batch specifications.
  2. *Tap 2:* Review safety operating protocol and confirm physical quarantine.
  3. *Tap 3:* Formal shopkeeper acknowledgement and timestamped sign-off.

### 10. Settings & Professional Profile
- **Shopkeeper Credentials**: Name, shop name, 10-digit Indian mobile validation, address, and role.
- **FSSAI & Trade License**: Confidential license number with unhide/mask toggle.
- **Demo Mode**: Isolated demo records with 1-click reset and JSON backup export/import.

---

## 🎨 Visual Design System

- **Typography**: Helvetica throughout the application (`"Helvetica Neue", Helvetica, Arial, sans-serif`).
- **Color Palette**:
  - Deep Forest Green: `#10251D`
  - Dark Sidebar: `#071E1B`
  - Mint Accent: `#8CF0B5`
  - Off-white Background: `#F5F7F4`
  - White Surfaces: `#FFFFFF`
  - Primary Text: `#172B27`
  - Secondary Text: `#718078`
  - Warning Amber: `#F4B544`
  - Critical Red: `#E45B62`
  - Information Blue: `#4C91DB`
  - Borders: `#E3EAE6`
- **Layout**: 256px persistent dark sidebar, sticky top header, 8-point spacing system, restrained corner radii (10–14px).

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```

Open `http://127.0.0.1:5173/` in your browser.
