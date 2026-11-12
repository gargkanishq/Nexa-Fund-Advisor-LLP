import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import app from '../server/index.js';

let server;
let baseUrl;

test.before(async () => {
  delete process.env.GOOGLE_SHEET_ID;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  delete process.env.GOOGLE_PRIVATE_KEY;
  delete process.env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_EMAIL = 'test.admin@nexafundadvisor.com';
  process.env.ADMIN_PASSWORD = 'TestPassword123!';
  process.env.SESSION_SECRET = 'test-session-secret-for-automated-suite-32-chars';
  process.env.ALLOW_LOCAL_LEAD_FALLBACK = 'false';

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/posts returns seeded articles and GET /api/posts/:slug returns detail', async () => {
  const res = await fetch(`${baseUrl}/api/posts`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.ok(Array.isArray(data.posts));
  assert.ok(data.posts.length >= 4);

  const firstSlug = data.posts[0].slug;
  const detailRes = await fetch(`${baseUrl}/api/posts/${firstSlug}`);
  assert.equal(detailRes.status, 200);
  const detail = await detailRes.json();
  assert.equal(detail.ok, true);
  assert.equal(detail.post.slug, firstSlug);
});

test('GET /sitemap.xml returns valid XML with core routes and blog articles', async () => {
  const res = await fetch(`${baseUrl}/sitemap.xml`);
  assert.equal(res.status, 200);
  const xml = await res.text();
  assert.ok(xml.includes('<urlset'));
  assert.ok(xml.includes('/home-loan-balance-transfer'));
  assert.ok(xml.includes('/calculators'));
  assert.ok(xml.includes('/insights/'));
});

test('POST /api/enquiries validates inputs, filters honeypot, and reports unconfigured Sheets honestly', async () => {
  const invalidRes = await fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enquiryType: 'New Loan', fullName: 'X', phone: '123' }),
  });
  assert.equal(invalidRes.status, 400);

  const honeypotRes = await fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ website: 'http://spam.example.com' }),
  });
  assert.equal(honeypotRes.status, 200);
  const honeypotBody = await honeypotRes.json();
  assert.equal(honeypotBody.mode, 'filtered');

  const validRes = await fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enquiryType: 'New Loan',
      fullName: 'Anita Verma',
      phone: '9876543210',
      city: 'Delhi',
      gender: 'Female',
      employmentType: 'Salaried',
      consent: true,
    }),
  });
  assert.equal(validRes.status, 503);
  const body = await validRes.json();
  assert.equal(body.code, 'SHEETS_NOT_CONFIGURED');
});

test('Admin blog CRUD and image upload require auth and work end-to-end', async () => {
  const unauthRes = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthorized Attempt',
      category: 'Home Loans',
      content: '<p>Should fail without session cookie.</p>',
    }),
  });
  assert.equal(unauthRes.status, 401);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test.admin@nexafundadvisor.com',
      password: 'TestPassword123!',
    }),
  });
  assert.equal(loginRes.status, 200);
  const cookieHeader = loginRes.headers.get('set-cookie');
  assert.ok(cookieHeader);
  const cookie = cookieHeader.split(';')[0];

  // Test cover image upload with tiny valid PNG
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
  const form = new FormData();
  form.append('image', new Blob([pngBytes], { type: 'image/png' }), 'test-cover.png');
  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form,
  });
  assert.equal(uploadRes.status, 201);
  const uploadData = await uploadRes.json();
  assert.equal(uploadData.ok, true);
  assert.ok(uploadData.url.startsWith('/uploads/'));

  const createRes = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: 'Automated Test Banking Checklist',
      category: 'Financial Awareness',
      coverImage: uploadData.url,
      content: '<p>This is an automated test article verifying the CMS publish endpoint works end to end.</p>',
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.ok, true);
  const createdId = created.post.id;

  const updateRes = await fetch(`${baseUrl}/api/posts/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: 'Automated Test Banking Checklist Updated',
      category: 'Financial Awareness',
      content: '<p>Updated content verifying edit functionality works cleanly without Markdown.</p>',
    }),
  });
  assert.equal(updateRes.status, 200);
  const updated = await updateRes.json();
  assert.equal(updated.post.title, 'Automated Test Banking Checklist Updated');

  const deleteRes = await fetch(`${baseUrl}/api/posts/${createdId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  assert.equal(deleteRes.status, 200);

  // Clean up uploaded test file
  const uploadedFilePath = path.resolve(process.cwd(), 'server/uploads', path.basename(uploadData.url));
  if (fs.existsSync(uploadedFilePath)) {
    fs.unlinkSync(uploadedFilePath);
  }
});

test('Production routes and all brand/bank/founder/insight assets serve cleanly', async () => {
  const routes = [
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
  for (const route of routes) {
    const res = await fetch(`${baseUrl}${route}`);
    assert.equal(res.status, 200, `Route ${route} should return HTTP 200`);
    const html = await res.text();
    assert.ok(html.includes('<div id="root"></div>'), `Route ${route} should serve SPA HTML`);
  }

  const requiredAssets = [
    '/images/Company%20Design%20Assets/NFA%20LOGO.png',
    '/images/Company%20Design%20Assets/NFA%20LOGO-TYPE%202.png',
    '/images/Gopal-Arora_Founder_Photo.PNG',
    '/images/Bank%20Logo/SBI_logo.jpg',
    '/images/Bank%20Logo/IOB_logo.png',
    '/images/Bank%20Logo/IndianBank_logo.jpg',
    '/images/Bank%20Logo/UCO_logo.jpg',
    '/images/Bank%20Logo/BOI_logo.jpg',
    '/images/Bank%20Logo/ManyMoreBanks_logo.jpg',
    '/images/insights/balance-transfer-cover.svg',
    '/images/insights/documentation-cover.svg',
    '/images/insights/home-loans-cover.svg',
    '/images/insights/banking-knowledge-cover.svg',
    '/robots.txt',
  ];

  for (const asset of requiredAssets) {
    const res = await fetch(`${baseUrl}${asset}`);
    assert.equal(res.status, 200, `Asset ${asset} should be served with HTTP 200`);
  }
});
