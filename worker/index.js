import { Hono } from 'hono';
import authRoutes from './routes/auth.js';
import enquiryRoutes from './routes/enquiries.js';
import postsRoutes from './routes/posts.js';
import uploadRoutes from './routes/upload.js';
import { listPosts } from './utils/postStore.js';
import { getGoogleSheetsStatus } from './utils/googleSheets.js';
import { getUploadedImageResponse } from './utils/imageStorage.js';

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

const app = new Hono();

// Baseline HTTP security headers (edge counterpart to helmet in server/index.js)
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// Serve R2 uploaded blog cover images with immutable CDN caching
app.get('/uploads/:key', async (c) => {
  return getUploadedImageResponse(c.env, c.req.raw, c.req.param('key'));
});

// Non-sensitive operational health check
app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'nexa-fund-advisor-worker',
    googleSheets: getGoogleSheetsStatus(c.env),
    storage: {
      d1Configured: Boolean(c.env?.DB),
      r2Configured: Boolean(c.env?.UPLOADS),
    },
  });
});

// Core API routes
app.route('/api/auth', authRoutes);
app.route('/api/enquiries', enquiryRoutes);
app.route('/api/posts', postsRoutes);
app.route('/api/upload', uploadRoutes);

// Dynamic XML sitemap backed by Cloudflare D1
app.get('/sitemap.xml', async (c) => {
  const siteUrl = (c.env?.SITE_URL || 'https://nexafundadvisor.com').replace(/\/$/, '');
  const posts = await listPosts(c.env.DB);
  const urls = [
    ...STATIC_ROUTES.map((route) => ({
      loc: `${siteUrl}${route}`,
      changefreq: route === '/' || route === '/insights' ? 'weekly' : 'monthly',
      priority: route === '/' ? '1.0' : route === '/home-loan-balance-transfer' ? '0.9' : '0.8',
    })),
    ...posts.map((post) => ({
      loc: `${siteUrl}/insights/${post.slug}`,
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

  return c.body(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
});

// Fallback for any other non-API request forwarded to Worker (delegates to Workers Static Assets)
app.all('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ ok: false, message: 'API route not found.' }, 404);
  }
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not found.', 404);
});

app.onError((err, c) => {
  console.error('[Worker Error]', err?.message || err);
  return c.json({ ok: false, message: 'An unexpected server error occurred.' }, 500);
});

export default app;
