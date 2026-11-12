import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import workerApp from '../worker/index.js';
import {
  hashPasswordPbkdf2,
  signSessionToken,
  verifyPasswordPbkdf2,
} from '../worker/utils/crypto.js';
import { clearGoogleTokenCacheForTests } from '../worker/utils/googleSheets.js';

const ROOT_DIR = process.cwd();
const SCHEMA_SQL = fs.readFileSync(path.join(ROOT_DIR, 'schema.sql'), 'utf8');
const SEED_SQL = fs.readFileSync(path.join(ROOT_DIR, 'seed.sql'), 'utf8');

/**
 * Lightweight Cloudflare D1 binding wrapper backed by real SQLite (`node:sqlite`),
 * executing the exact schema.sql and seed.sql files used in production.
 */
function createSqliteD1Binding() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(SCHEMA_SQL);
  sqlite.exec(SEED_SQL);

  function wrapStatement(sql, boundArgs = []) {
    return {
      bind(...args) {
        return wrapStatement(sql, args);
      },
      async first(colName) {
        const stmt = sqlite.prepare(sql);
        const row = stmt.get(...boundArgs);
        if (!row) return null;
        const normalized = { ...row };
        return colName ? normalized[colName] : normalized;
      },
      async all() {
        const stmt = sqlite.prepare(sql);
        const rows = stmt.all(...boundArgs).map((r) => ({ ...r }));
        return { results: rows, success: true };
      },
      async run() {
        const stmt = sqlite.prepare(sql);
        const info = stmt.run(...boundArgs);
        return {
          success: true,
          meta: {
            changes: info.changes,
            last_row_id: info.lastInsertRowid,
          },
        };
      },
    };
  }

  return {
    prepare(sql) {
      return wrapStatement(sql, []);
    },
    async batch(statements) {
      const results = [];
      sqlite.exec('BEGIN');
      try {
        for (const stmt of statements) {
          results.push(await stmt.run());
        }
        sqlite.exec('COMMIT');
        return results;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    },
    close() {
      sqlite.close();
    },
  };
}

/**
 * In-memory Cloudflare R2 bucket mock enforcing storageClass & metadata contracts.
 */
function createMemoryR2Bucket() {
  const objects = new Map();

  return {
    objects,
    async put(key, value, options = {}) {
      const bytes =
        value instanceof Uint8Array
          ? value
          : new Uint8Array(value instanceof ArrayBuffer ? value : await new Response(value).arrayBuffer());
      const httpMetadata = options.httpMetadata || {};
      const etag = `"etag-${key}-${bytes.byteLength}"`;
      const record = {
        key,
        bytes,
        httpMetadata,
        httpEtag: etag,
        storageClass: options.storageClass || 'Standard',
        uploaded: new Date(),
      };
      objects.set(key, record);
      return record;
    },
    async get(key) {
      const record = objects.get(key);
      if (!record) return null;
      return {
        key: record.key,
        httpEtag: record.httpEtag,
        httpMetadata: record.httpMetadata,
        body: new Blob([record.bytes]).stream(),
        writeHttpMetadata(headers) {
          if (record.httpMetadata?.contentType) {
            headers.set('content-type', record.httpMetadata.contentType);
          }
          if (record.httpMetadata?.cacheControl) {
            headers.set('cache-control', record.httpMetadata.cacheControl);
          }
        },
      };
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}

async function generateTestPkcs8Pem() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  let binary = '';
  for (let i = 0; i < pkcs8.length; i += 1) {
    binary += String.fromCharCode(pkcs8[i]);
  }
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

async function createWorkerEnv(overrides = {}) {
  const db = createSqliteD1Binding();
  const r2 = createMemoryR2Bucket();
  const adminPasswordHash = await hashPasswordPbkdf2('NexaStrongPass!2026');

  return {
    env: {
      DB: db,
      UPLOADS: r2,
      SITE_URL: 'https://nexafundadvisor.com',
      ADMIN_EMAIL: 'gopal.arora@nexafundadvisor.com',
      ADMIN_NAME: 'Mr. Gopal Arora',
      ADMIN_PASSWORD_HASH: adminPasswordHash,
      SESSION_SECRET: 'test-worker-session-secret-with-more-than-32-chars',
      GOOGLE_SHEET_NAME: 'Leads',
      ASSETS: {
        fetch: async (req) => new Response(`SPA_FALLBACK:${new URL(req.url).pathname}`, { status: 200 }),
      },
      ...overrides,
    },
    db,
    r2,
  };
}

async function workerFetch(env, pathUrl, init = {}) {
  const url = pathUrl.startsWith('http') ? pathUrl : `https://nexafundadvisor.com${pathUrl}`;
  const req = new Request(url, init);
  return workerApp.fetch(req, env, { waitUntil() {} });
}

test('PBKDF2-SHA256 100k hashing verifies valid passwords and rejects weak iteration configs', async () => {
  const hash = await hashPasswordPbkdf2('MyStrongPass#2026');
  assert.ok(hash.startsWith('pbkdf2_sha256$100000$'));
  assert.equal(await verifyPasswordPbkdf2('MyStrongPass#2026', hash), true);
  assert.equal(await verifyPasswordPbkdf2('WrongPassword', hash), false);

  const tooLow = hash.replace('$100000$', '$500$');
  const aboveWorkerLimit = hash.replace('$100000$', '$150000$');
  assert.equal(await verifyPasswordPbkdf2('MyStrongPass#2026', tooLow), false);
  assert.equal(await verifyPasswordPbkdf2('MyStrongPass#2026', aboveWorkerLimit), false);
});

test('Worker serves all 4 seeded D1 blog articles, category filters, search, and sitemap.xml', async () => {
  const { env, db } = await createWorkerEnv();
  try {
    const listRes = await workerFetch(env, '/api/posts');
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.ok, true);
    assert.equal(listData.posts.length, 4);

    const filterRes = await workerFetch(env, '/api/posts?category=Balance+Transfers');
    const filterData = await filterRes.json();
    assert.equal(filterData.posts.length, 1);
    assert.equal(filterData.posts[0].slug, 'understanding-home-loan-balance-transfer');

    const searchRes = await workerFetch(env, '/api/posts?q=amortization');
    const searchData = await searchRes.json();
    assert.equal(searchData.posts.length, 1);
    assert.equal(searchData.posts[0].slug, 'reducing-balance-interest-explained-for-borrowers');

    const detailRes = await workerFetch(env, '/api/posts/understanding-home-loan-balance-transfer');
    assert.equal(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.equal(detailData.ok, true);
    assert.equal(detailData.related.length, 3);

    const sitemapRes = await workerFetch(env, '/sitemap.xml');
    assert.equal(sitemapRes.status, 200);
    assert.ok(sitemapRes.headers.get('content-type')?.includes('application/xml'));
    const xml = await sitemapRes.text();
    assert.ok(xml.includes('https://nexafundadvisor.com/home-loan-balance-transfer'));
    assert.ok(xml.includes('https://nexafundadvisor.com/insights/understanding-home-loan-balance-transfer'));
  } finally {
    db.close();
  }
});

test('Worker enforces admin HttpOnly Secure cookies, session expiry, tampered tokens, and D1 login rate limiting', async () => {
  const { env, db } = await createWorkerEnv();
  try {
    // 8 failed attempts from same IP trigger 429 on 9th attempt
    for (let i = 0; i < 8; i += 1) {
      const badRes = await workerFetch(env, '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '203.0.113.10',
        },
        body: JSON.stringify({ email: 'gopal.arora@nexafundadvisor.com', password: 'wrong' }),
      });
      assert.equal(badRes.status, 401);
    }

    const blockedRes = await workerFetch(env, '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.10',
      },
      body: JSON.stringify({
        email: 'gopal.arora@nexafundadvisor.com',
        password: 'NexaStrongPass!2026',
      }),
    });
    assert.equal(blockedRes.status, 429);

    // Valid login from clean IP succeeds and issues HttpOnly + Secure cookie
    const loginRes = await workerFetch(env, '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.25',
      },
      body: JSON.stringify({
        email: 'gopal.arora@nexafundadvisor.com',
        password: 'NexaStrongPass!2026',
      }),
    });
    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get('set-cookie') || '';
    assert.ok(setCookie.includes('HttpOnly'));
    assert.ok(setCookie.includes('Secure'));
    assert.ok(setCookie.includes('SameSite=Lax'));
    const cookiePair = setCookie.split(';')[0];

    // Active session works
    const sessionRes = await workerFetch(env, '/api/auth/session', {
      headers: { Cookie: cookiePair },
    });
    const sessionData = await sessionRes.json();
    assert.equal(sessionData.authenticated, true);
    assert.equal(sessionData.admin.email, 'gopal.arora@nexafundadvisor.com');

    // Tampered token rejected
    const tamperedRes = await workerFetch(env, '/api/auth/session', {
      headers: { Cookie: `${cookiePair}tampered` },
    });
    assert.equal((await tamperedRes.json()).authenticated, false);

    // Expired token rejected
    const expiredToken = await signSessionToken(
      { email: 'gopal.arora@nexafundadvisor.com', name: 'Mr. Gopal Arora' },
      env,
      -5000
    );
    const expiredRes = await workerFetch(env, '/api/auth/session', {
      headers: { Cookie: `nexa_admin_session=${expiredToken}` },
    });
    assert.equal((await expiredRes.json()).authenticated, false);
  } finally {
    db.close();
  }
});

test('Worker enforces R2 image validation, Standard storage, CDN cache headers, and cleanup on edit/delete', async () => {
  const { env, db, r2 } = await createWorkerEnv();
  try {
    const loginRes = await workerFetch(env, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '198.51.100.2' },
      body: JSON.stringify({
        email: 'gopal.arora@nexafundadvisor.com',
        password: 'NexaStrongPass!2026',
      }),
    });
    const cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

    // Unauthenticated upload rejected
    const unauthForm = new FormData();
    unauthForm.append('image', new Blob(['fake'], { type: 'image/png' }), 'a.png');
    const unauthUpload = await workerFetch(env, '/api/upload', { method: 'POST', body: unauthForm });
    assert.equal(unauthUpload.status, 401);

    // Spoofed HTML claiming image/png rejected by magic-byte inspection
    const spoofForm = new FormData();
    spoofForm.append('image', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.png');
    const spoofRes = await workerFetch(env, '/api/upload', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: spoofForm,
    });
    assert.equal(spoofRes.status, 400);

    // Valid PNG upload succeeds and writes Standard storage to R2
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );
    const validForm1 = new FormData();
    validForm1.append('image', new Blob([pngBytes], { type: 'image/png' }), 'cover1.png');
    const upRes1 = await workerFetch(env, '/api/upload', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: validForm1,
    });
    assert.equal(upRes1.status, 201);
    const up1 = await upRes1.json();
    assert.ok(up1.url.startsWith('/uploads/'));
    const key1 = up1.url.replace('/uploads/', '');
    assert.equal(r2.objects.get(key1)?.storageClass, 'Standard');

    // GET /uploads/:key serves image + ETag + 304 Not Modified
    const imgGet = await workerFetch(env, up1.url);
    assert.equal(imgGet.status, 200);
    assert.equal(imgGet.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(imgGet.headers.get('cache-control')?.includes('immutable'));
    const etag = imgGet.headers.get('etag');
    const imgNotModified = await workerFetch(env, up1.url, {
      headers: { 'If-None-Match': etag },
    });
    assert.equal(imgNotModified.status, 304);

    // Create post with XSS payload + uploaded cover -> sanitized in D1
    const createRes = await workerFetch(env, '/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        title: 'Cloudflare R2 Cover Persistence Check',
        category: 'Home Loans',
        coverImage: up1.url,
        featured: true,
        content:
          '<p>Helpful banking checklist.</p><script>alert("xss")</script><p onclick="bad()">Read <a href="javascript:alert(1)">here</a> and <a href="https://nexafundadvisor.com">Nexa</a>.</p>',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.ok(!created.post.content.includes('<script'));
    assert.ok(!created.post.content.includes('onclick='));
    assert.ok(!created.post.content.includes('javascript:'));
    assert.ok(created.post.content.includes('https://nexafundadvisor.com'));

    // Upload a replacement cover and update post -> old R2 object auto-deleted
    const validForm2 = new FormData();
    validForm2.append('image', new Blob([pngBytes], { type: 'image/png' }), 'cover2.png');
    const upRes2 = await workerFetch(env, '/api/upload', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: validForm2,
    });
    const up2 = await upRes2.json();
    const key2 = up2.url.replace('/uploads/', '');

    const updateRes = await workerFetch(env, `/api/posts/${created.post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        coverImage: up2.url,
        content: '<p>Updated clean body with sufficient length for article validation checks.</p>',
      }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(r2.objects.has(key1), false);
    assert.equal(r2.objects.has(key2), true);

    // Deleting post removes second R2 object as well
    const delRes = await workerFetch(env, `/api/posts/${created.post.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert.equal(delRes.status, 200);
    assert.equal(r2.objects.has(key2), false);
  } finally {
    db.close();
  }
});

test('Worker enquiries validate inputs, never silently drop unconfigured leads, and append cleanly to Google Sheets v4', async () => {
  clearGoogleTokenCacheForTests();
  const { env, db } = await createWorkerEnv();

  try {
    // 1. Validation error returns 400
    const badRes = await workerFetch(env, '/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
      body: JSON.stringify({ enquiryType: 'New Loan', fullName: 'A', phone: '123' }),
    });
    assert.equal(badRes.status, 400);

    // 2. Honeypot spam returns filtered 200 without calling Google Sheets
    const spamRes = await workerFetch(env, '/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.2' },
      body: JSON.stringify({ website: 'https://spam.invalid' }),
    });
    assert.equal(spamRes.status, 200);
    assert.equal((await spamRes.json()).mode, 'filtered');

    // 3. Unconfigured Sheets returns 503 SHEETS_NOT_CONFIGURED (never silent success)
    const unconfRes = await workerFetch(env, '/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.3' },
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
    assert.equal(unconfRes.status, 503);
    assert.equal((await unconfRes.json()).code, 'SHEETS_NOT_CONFIGURED');

    // 4. Live Sheets REST v4 flow (mocked OAuth + Sheets API endpoints with real RS256 key)
    const pemKey = await generateTestPkcs8Pem();
    const { env: sheetsEnv, db: sheetsDb } = await createWorkerEnv({
      GOOGLE_SHEET_ID: 'sheet-123',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: 'nexa-bot@project.iam.gserviceaccount.com',
      GOOGLE_PRIVATE_KEY: pemKey,
    });

    const originalFetch = globalThis.fetch;
    let appendedRows = [];
    let simulateSheetsOutage = false;

    globalThis.fetch = async (url, init = {}) => {
      const target = String(url);
      if (target === 'https://oauth2.googleapis.com/token') {
        assert.equal(init.method, 'POST');
        return new Response(JSON.stringify({ access_token: 'mock-google-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (target.includes('sheets.googleapis.com/v4/spreadsheets/sheet-123/values/Leads!A1%3AK1') || target.includes('Leads%21A1%3AK1')) {
        if (init.method === 'PUT') {
          return new Response(JSON.stringify({ updatedCells: 11 }), { status: 200 });
        }
        return new Response(JSON.stringify({ values: [] }), { status: 200 });
      }
      if (target.includes(':append')) {
        if (simulateSheetsOutage) {
          return new Response('Upstream error', { status: 500 });
        }
        const parsed = JSON.parse(init.body);
        appendedRows.push(parsed.values[0]);
        return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 });
      }
      throw new Error(`Unexpected external fetch in test: ${target}`);
    };

    try {
      const payload = {
        enquiryType: 'Existing Loan',
        fullName: 'Vikram Singh',
        phone: '9811122334',
        city: 'Ludhiana',
        gender: 'Male',
        employmentType: 'Business Owner',
        consent: true,
        clientRequestId: 'client-uuid-001',
      };

      const okRes = await workerFetch(sheetsEnv, '/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.50' },
        body: JSON.stringify(payload),
      });
      assert.equal(okRes.status, 201);
      const okData = await okRes.json();
      assert.equal(okData.mode, 'google_sheets');
      assert.ok(okData.enquiryId.startsWith('NF-'));
      assert.equal(appendedRows.length, 1);
      assert.equal(appendedRows[0][3], 'Vikram Singh');
      assert.equal(appendedRows[0][8], 'Existing Loan');

      // Deduplication prevents double Google Sheets row on retry
      const retryRes = await workerFetch(sheetsEnv, '/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.50' },
        body: JSON.stringify(payload),
      });
      assert.equal(retryRes.status, 200);
      assert.equal((await retryRes.json()).deduplicated, true);
      assert.equal(appendedRows.length, 1);

      // Sheets outage returns explicit 502 error (never silent success)
      simulateSheetsOutage = true;
      const outageRes = await workerFetch(sheetsEnv, '/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.51' },
        body: JSON.stringify({
          ...payload,
          phone: '9822233445',
          clientRequestId: 'client-uuid-002',
        }),
      });
      assert.equal(outageRes.status, 502);
      assert.equal((await outageRes.json()).code, 'SHEETS_WRITE_FAILED');
    } finally {
      globalThis.fetch = originalFetch;
      sheetsDb.close();
    }
  } finally {
    db.close();
  }
});

test('Worker health endpoint exposes operational flags only and never leaks secrets', async () => {
  const { env, db } = await createWorkerEnv();
  try {
    const res = await workerFetch(env, '/api/health');
    assert.equal(res.status, 200);
    const text = await res.text();
    const data = JSON.parse(text);
    assert.equal(data.ok, true);
    assert.equal(data.storage.d1Configured, true);
    assert.equal(data.storage.r2Configured, true);
    assert.ok(!text.includes('SESSION_SECRET'));
    assert.ok(!text.includes('ADMIN_PASSWORD'));
    assert.ok(!text.includes('pbkdf2_sha256'));
  } finally {
    db.close();
  }
});
