/**
 * D1-backed persistent rate limiting and deduplication across Worker isolates.
 */

export async function checkRateLimit(db, key, maxAttempts, windowMs) {
  if (!db) return { allowed: true };
  const now = Date.now();
  const row = await db
    .prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?1')
    .bind(key)
    .first();

  if (!row || now > Number(row.reset_at)) {
    return { allowed: true, count: 0 };
  }

  if (Number(row.count) >= maxAttempts) {
    const retryAfterMinutes = Math.max(1, Math.ceil((Number(row.reset_at) - now) / 60000));
    return { allowed: false, retryAfterMinutes, count: Number(row.count) };
  }

  return { allowed: true, count: Number(row.count) };
}

export async function incrementRateLimit(db, key, windowMs) {
  if (!db) return;
  const now = Date.now();
  const nextReset = now + windowMs;
  await db
    .prepare(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at < ?3 THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at < ?3 THEN ?2 ELSE rate_limits.reset_at END`
    )
    .bind(key, nextReset, now)
    .run();
}

export async function resetRateLimit(db, key) {
  if (!db) return;
  await db.prepare('DELETE FROM rate_limits WHERE key = ?1').bind(key).run();
}

export async function getDedupeEntry(db, key) {
  if (!db) return null;
  const now = Date.now();
  const row = await db
    .prepare('SELECT enquiry_id, mode, expires_at FROM enquiry_dedupe WHERE key = ?1')
    .bind(key)
    .first();

  if (!row || now > Number(row.expires_at)) {
    return null;
  }
  return {
    enquiryId: row.enquiry_id,
    mode: row.mode,
    expiresAt: Number(row.expires_at),
  };
}

export async function setDedupeEntry(db, key, enquiryId, mode, ttlMs) {
  if (!db) return;
  const expiresAt = Date.now() + ttlMs;
  await db
    .prepare(
      `INSERT INTO enquiry_dedupe (key, enquiry_id, mode, expires_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET
         enquiry_id = excluded.enquiry_id,
         mode = excluded.mode,
         expires_at = excluded.expires_at`
    )
    .bind(key, enquiryId, mode, expiresAt)
    .run();
}

export async function cleanupExpiredRecords(db) {
  if (!db) return;
  const now = Date.now();
  await db.batch([
    db.prepare('DELETE FROM rate_limits WHERE reset_at < ?1').bind(now),
    db.prepare('DELETE FROM enquiry_dedupe WHERE expires_at < ?1').bind(now),
  ]);
}
