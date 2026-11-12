import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import enquiryRoutes from './routes/enquiries.js';
import postsRoutes from './routes/posts.js';
import uploadRoutes, { UPLOADS_DIR } from './routes/upload.js';
import { listPosts } from './utils/postStore.js';
import { getGoogleSheetsStatus } from './utils/googleSheets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const SITE_URL = (process.env.SITE_URL || 'https://nexafundadvisor.com').replace(/\/$/, '');

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Serve uploaded blog cover images cleanly
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// Health endpoint (non-sensitive operational flags only)
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'nexa-fund-advisor-api',
    googleSheets: getGoogleSheetsStatus(),
  });
});

// Core API routes
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/upload', uploadRoutes);

// Dynamic XML sitemap (includes all static public routes + published insights)
const STATIC_ROUTES = [
  '/',
  '/about',
  '/services',
  '/home-loan-balance-transfer',
  '/calculators',
  '/insights',
  '/contact',
  '/enquire',
  '/privacy-policy',
  '/terms-and-conditions',
  '/disclaimer',
];

app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const posts = await listPosts();
    const urls = [
      ...STATIC_ROUTES.map((route) => ({
        loc: `${SITE_URL}${route}`,
        changefreq: route === '/' || route === '/insights' ? 'weekly' : 'monthly',
        priority: route === '/' ? '1.0' : route === '/home-loan-balance-transfer' ? '0.9' : '0.8',
      })),
      ...posts.map((post) => ({
        loc: `${SITE_URL}/insights/${post.slug}`,
        lastmod: (post.updatedAt || post.publishedAt || '').slice(0, 10),
        changefreq: 'monthly',
        priority: '0.7',
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>${
            u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
          }\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join('\n')}\n</urlset>`;

    res.type('application/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

// Serve static React/Vite production bundle if built
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ ok: false, message: 'An unexpected server error occurred.' });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Nexa Fund Advisor server running on http://localhost:${PORT}`);
  });
}

export default app;
