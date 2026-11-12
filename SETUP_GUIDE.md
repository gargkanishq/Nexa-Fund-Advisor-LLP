# Owner Setup & Deployment Guide — Nexa Fund Advisor LLP

This guide explains how to connect **Google Sheets Lead Management**, configure **Nexa Insights Blog Admin credentials** for Mr. Gopal Arora, and deploy the website cleanly.

---

## 1. Connecting Google Sheets for Lead Management

The backend writes every validated enquiry directly to your Google Sheet without exposing any credentials in browser code.

### Step A: Prepare Your Google Sheet
1. Create a new Google Sheet in Google Drive (for example: **Nexa Website Leads**).
2. Rename the first sheet tab at the bottom to `Leads` (or match whatever you set in `GOOGLE_SHEET_NAME`).
3. Copy the **Spreadsheet ID** from the browser URL:
   - Example URL: `https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit`
   - Spreadsheet ID: `1AbCdEfGhIjKlMnOpQrStUvWxYz`
4. Row 1 headers are created automatically on the first enquiry submission if blank, in this exact column order:
   1. `Enquiry ID`
   2. `Submission Date` (IST)
   3. `Submission Time` (IST)
   4. `Full Name`
   5. `Phone Number`
   6. `City`
   7. `Gender`
   8. `Employment Type`
   9. `Enquiry Type` (`New Loan` / `Existing Loan`)
   10. `Lead Status` (defaults to `New`)
   11. `Notes` (enquiry source / calculator context)

> Tip: In Google Sheets, you can add a Data Validation dropdown on Column J (`Lead Status`) with options: `New`, `Contacted`, `In Progress`, `Disbursed`, `Rejected`, `Follow-up Required`.

### Step B: Create a Google Cloud Service Account
1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project (e.g., `nexa-website-leads`).
2. Go to **APIs & Services → Library**, search for **Google Sheets API**, and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → Service Account**.
   - Name it e.g. `nexa-leads-writer`.
4. Open the created Service Account, go to the **Keys** tab → **Add Key → Create new key → JSON**. A `.json` key file downloads to your computer (keep this private; never commit it to Git).
5. Open the downloaded `.json` file and note:
   - `client_email` → goes into `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → goes into `GOOGLE_PRIVATE_KEY` (keep `\n` escaped on a single line in `.env`)

### Step C: Share the Google Sheet With the Service Account
1. Open your Google Sheet and click **Share**.
2. Paste the `client_email` from Step B (e.g., `nexa-leads-writer@nexa-website-leads.iam.gserviceaccount.com`).
3. Grant **Editor** access and click **Send**.

### Step D: Add Credentials to `.env`
```env
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_SHEET_NAME=Leads
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ALLOW_LOCAL_LEAD_FALLBACK=false
```
After starting the server, submit one test enquiry on `/enquire` and verify the new row appears immediately in your Google Sheet.

---

## 2. Setting Up Mr. Gopal Arora's Blog Publishing Studio (`/admin`)

The Nexa Insights editor is located at `/admin` (for example: `https://nexafundadvisor.com/admin`). It is intentionally **not linked** in the public navigation bar or footer and is disallowed in `robots.txt`.

### Step A: Configure Credentials in `.env`
Set:
```env
ADMIN_EMAIL=gopal.arora@nexafundadvisor.com
ADMIN_NAME=Mr. Gopal Arora
SESSION_SECRET=use-a-long-random-64-character-secret-string-here
```
For the password, you can either set `ADMIN_PASSWORD` or (recommended for production) generate a salted `scrypt` hash:
```bash
node -e "import('./server/utils/auth.js').then(m => console.log(m.hashPassword('NextAestheticBlogOnMe14')))"
```
Paste the printed `scrypt$...` output into `ADMIN_PASSWORD_HASH=` in `.env` (and remove `ADMIN_PASSWORD`).

### Step B: How Mr. Gopal Arora Publishes Articles (No Code Required)
1. Open `https://nexafundadvisor.com/admin` in any browser.
2. Sign in with `ADMIN_EMAIL` and password.
3. Click **Write New Article**.
4. Enter a clear **Article Title** and select a **Category** (`Home Loans`, `Balance Transfers`, `Banking Knowledge`, `Loan Documentation`, `Personal Finance`, or `Financial Awareness`).
5. Upload a JPG/PNG/WebP cover image (or choose one of the built-in Nexa editorial graphics).
6. Write or paste the article directly into the visual editor (supports headings, bold, italic, lists, quotes, and links — just like Microsoft Word or Google Docs).
7. Click **Publish Article**. It appears immediately on `/insights` and in the Homepage's latest 3 articles preview, as well as `/sitemap.xml`.
8. Existing articles can be edited or deleted anytime from the same dashboard.

---

## 3. Hosting & Deployment Checklist

Because this project uses a lightweight Node.js + Express backend with file persistence (`server/data/posts.json`) and uploaded cover images (`server/uploads/`), choose a Node.js host that supports **persistent disk storage**:

### Recommended Hosts
- **Railway** or **Render** (with a Persistent Disk mounted to `/app/server/data` and `/app/server/uploads`)
- **DigitalOcean App Platform / VPS / Hostinger VPS** running Node.js 20+ behind Nginx/Caddy with HTTPS

### Build & Start Commands
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: Copy all values from `.env.example` into your hosting provider's Environment / Secrets settings (`NODE_ENV=production`, `SITE_URL=https://nexafundadvisor.com`, `PORT`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_NAME`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`).

### Preserved Starter Files
The original starter files (`assets/css/main.css`, `assets/js/site.js`) and original `images/` folder remain intact in the project root, while the production React + Vite app reads bundled images from `public/images/`.
