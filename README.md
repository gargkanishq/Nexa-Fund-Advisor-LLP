# Nexa Fund Advisor LLP — Corporate Website

Official multi-page web platform for **Nexa Fund Advisor LLP** (*"Smart Finance, Right Guidance"*), built with **React + Vite.js** and a **Node.js + Express** backend powering Google Sheets lead management and a non-technical Blog Publishing Studio for Mr. Gopal Arora.

## Key Features
- **Brand-Faithful Visual System**: Colors extracted directly from `images/Company Design Assets/NFA LOGO.png` (`#0F2D52` deep navy, `#C8A34D` gold, `#FFFFFF` white) paired with `Manrope` and `DM Sans` typography.
- **Multi-Page Architecture**:
  - `/` — Homepage (13 structured sections including homepage-only Banking Partners logo carousel)
  - `/about` — About Us & Detailed Founder Profile (Mr. Gopal Arora, Former Chief Manager, UCO Bank, 38 years PSU banking)
  - `/services` — Comprehensive Loan Services & Transparent Commercial Model
  - `/home-loan-balance-transfer` — Conversion-focused Balance Transfer guide + live savings calculator + FAQs
  - `/calculators` — Home Loan EMI, Home Loan Balance Transfer, Personal Loan EMI, and Loan Affordability calculators
  - `/insights` & `/insights/:slug` — Nexa Insights Financial Knowledge Centre
  - `/contact` — Rohini, Delhi Office (Beside Rohini East Metro Station, Gate No. 2) & Get Directions
  - `/enquire` — Dedicated Enquiry Page sharing the global reusable enquiry component
  - `/privacy-policy`, `/terms-and-conditions`, `/disclaimer` — Legal & Trust Pages
  - `/admin` — Unlisted, password-protected Blog Publishing Studio (visual rich-text editor + cover image upload — zero Markdown/Git required)
- **Lead Generation & Google Sheets**:
  - 10-second session-persisted automatic enquiry popup + website-wide `Enquire Now` modal triggers
  - Server-side validation (Indian mobile numbers), honeypot & rate-limit spam protection, duplicate protection, and Google Sheets append API (`googleapis`).

## Quick Local Start
1. Copy `.env.example` to `.env` and fill in your `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`), `SESSION_SECRET`, and Google Sheets credentials (or set `ALLOW_LOCAL_LEAD_FALLBACK=true` during local-only UI testing).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run both frontend (Vite) and backend (Express) together:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
4. Run automated tests:
   ```bash
   npm test
   ```
5. Build & run production server:
   ```bash
   npm run build
   npm start
   ```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions on connecting Google Sheets, setting up Mr. Gopal Arora's publishing credentials, and deploying to production.
