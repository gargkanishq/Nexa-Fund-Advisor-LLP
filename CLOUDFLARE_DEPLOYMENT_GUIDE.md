# Nexa Fund Advisor LLP — Cloudflare Deployment & Operations Guide

This guide explains how to deploy the Nexa Fund Advisor website to Cloudflare using **Workers + Static Assets + D1 + R2** while keeping your monthly hosting cost at **₹0** inside Cloudflare's free allowances.

> Your existing Express setup (`npm run dev`, `npm start`) remains completely intact for local development.

---

## Architecture Summary

- **Frontend (`dist/`):** Hosted on **Cloudflare Workers Static Assets** (unlimited free bandwidth, automatic SPA routing for all React pages).
- **Backend API (`/api/*`, `/uploads/*`, `/sitemap.xml`):** Runs on a single **Cloudflare Worker** (`worker/index.js`).
- **Blog Posts, Rate Limiting & Deduplication:** Stored persistently in **Cloudflare D1** (`nexa-production-db` SQLite database), pre-seeded with your 4 existing articles.
- **Uploaded Blog Cover Images:** Stored persistently in **Cloudflare R2 Standard storage** (`nexa-website-media` bucket), automatically compressed on upload in `/admin` and deleted from R2 when replaced or when a post is deleted.
- **Customer Enquiries:** Validated and written directly to **Google Sheets** using a Service Account (`fetch` + Web Crypto RS256 JWT). If Google Sheets is unavailable or unconfigured, the API logs the issue and returns a clear error instead of failing silently.

---

## Step 1: Create Your Free Cloudflare Account & Log In

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Authenticate the Cloudflare Wrangler CLI in your project folder (`c:\Nexa Files\Website\Website main`):
   ```powershell
   npx wrangler login
   ```
   A browser window will open—click **Allow**.

---

## Step 2: Configure D1 and Migrate Your 4 Existing Blog Articles

Your D1 database is already created: `nexa-production-db`.
1. Check the database details and UUID:
   ```powershell
   npx wrangler d1 list
   ```
2. Copy your `nexa-production-db` database UUID into `wrangler.jsonc` under `d1_databases[0].database_id`.
3. Create the tables and migrate the 4 initial blog articles into your **remote** D1 database:
   ```powershell
   npx wrangler d1 execute nexa-production-db --remote --file=./schema.sql
   npx wrangler d1 execute nexa-production-db --remote --file=./seed.sql
   ```

---

## Step 3: Verify Cloudflare R2 (`nexa-website-media`)

Your R2 bucket is already created: `nexa-website-media`.
- **Public access:** Disabled (private).
- **Default Storage Class:** Standard (free tier eligible; never select Infrequent Access).
- Images are served privately through your Worker endpoint `/uploads/:key` under `nexafundadvisor.com`. No public bucket URL or paid image resizing add-ons needed.

---

## Step 4: Set Encrypted Worker Secrets (Never Committed to GitHub)

1. Generate a strong PBKDF2-SHA256 admin password hash (100,000 iterations):
   ```powershell
   npm run hash:password
   ```
2. Generate a random 64-character `SESSION_SECRET`:
   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
3. Upload each secret securely into Cloudflare's encrypted secret store:
   ```powershell
   npx wrangler secret put ADMIN_EMAIL
   npx wrangler secret put ADMIN_NAME
   npx wrangler secret put ADMIN_PASSWORD_HASH
   npx wrangler secret put SESSION_SECRET
   npx wrangler secret put GOOGLE_SHEET_ID
   npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
   npx wrangler secret put GOOGLE_PRIVATE_KEY
   ```
   - For `GOOGLE_PRIVATE_KEY`, paste the `private_key` value from your Google Service Account JSON (keeping `\n` escapes or multi-line PEM intact).
   - Confirm your Google Sheet is shared with the Service Account email with **Editor** access.

---

## Step 5: Deploy & Test on Your Preview URL (`*.workers.dev`)

Do **not** change GoDaddy DNS until every test below passes on the preview URL:

```powershell
npm run deploy:worker
```

Verify on the printed `https://nexa-fund-advisor.<subdomain>.workers.dev` URL:
1. All public pages load cleanly on direct refresh (`/`, `/about`, `/services`, `/home-loan-balance-transfer`, `/calculators`, `/insights`, `/contact`, `/enquire`, `/privacy-policy`, `/terms-and-conditions`, `/disclaimer`).
2. All bank logos, founder photo, and company logos render properly.
3. Submit a test enquiry in `/enquire` and verify a new row appears in Google Sheets.
4. Visit `/admin`, sign in, upload a custom cover image, publish a test article, verify it loads after a full redeploy (`npm run deploy:worker`), and then edit/delete the test article.

---

## Step 6: Monitor Usage & Prevent Unexpected Charges

Check these screens once a month in **Cloudflare Dashboard**:
1. **R2 Object Storage -> Overview & `nexa-website-media`:**
   - Verify **Storage** stays well below **10 GB** (images are auto-optimized in `/admin` and capped at 2 MB, and deleted from R2 when replaced/deleted).
   - Verify **Class A operations** (writes/lists) stay far below **1,000,000/month**.
   - Verify **Class B operations** (reads) stay far below **10,000,000/month** (served with `Cache-Control: immutable` so Cloudflare's CDN serves repeat hits without hitting R2).
2. **Compute & Workers -> Workers & Pages -> `nexa-fund-advisor` -> Metrics:**
   - Free tier allows **100,000 Worker requests/day**; static pages and `/images/*` do not consume Worker requests.
3. **Storage & Databases -> D1 SQL Database -> `nexa-production-db` -> Metrics:**
   - Free tier allows **5,000,000 row reads/day**, **100,000 row writes/day**, and **5 GB total**.
4. **Manage Account -> Billing -> Notifications:**
   - Create **Usage Based Billing Notifications** for **R2 Storage**, **R2 Class A**, **R2 Class B**, and **Workers/D1** at low thresholds (e.g., 50% and 80% of free tier) so you receive an email well before any paid overage could occur.
   - Remember: notifications alert you—they do not automatically pause traffic.

---

## Step 7: Connecting `nexafundadvisor.com` (Only When Ready)

1. In Cloudflare Dashboard, click **Add a domain** -> `nexafundadvisor.com` (select the **Free** plan).
2. In GoDaddy DNS, update your domain's nameservers to the two Cloudflare nameservers shown.
3. Wait for status **Active** in Cloudflare, then go to **Workers & Pages -> `nexa-fund-advisor` -> Settings -> Domains & Routes -> Add -> Custom Domain**:
   - Add `nexafundadvisor.com`
   - Add `www.nexafundadvisor.com`
4. Update SSL/TLS encryption mode in Cloudflare to **Full (strict)**.
