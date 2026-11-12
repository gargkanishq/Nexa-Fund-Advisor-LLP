import { sanitizeArticleHtml } from './sanitize.js';
import { randomHex } from './crypto.js';

export function calculateReadingTimeMinutes(htmlContent) {
  const plainText = (htmlContent || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plainText ? plainText.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function createExcerpt(htmlContent, providedExcerpt = '') {
  const cleanProvided = (providedExcerpt || '').trim();
  if (cleanProvided) return cleanProvided.slice(0, 260);
  const plain = (htmlContent || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= 185) return plain;
  return `${plain.slice(0, 182).trim()}...`;
}

export function slugifyTitle(title) {
  const base = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return base || `article-${Date.now()}`;
}

function mapRowToPost(row) {
  if (!row) return null;
  const content = row.content || '';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: createExcerpt(content, row.excerpt),
    coverImage: row.cover_image,
    featured: Boolean(row.featured),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    authorName: row.author_name,
    authorCredentials: row.author_credentials,
    content,
    readingTimeMinutes: row.reading_time_minutes || calculateReadingTimeMinutes(content),
  };
}

export async function listPosts(db, { category = '', search = '', limit = 0 } = {}) {
  const clauses = [];
  const params = [];

  if (category && category !== 'All') {
    params.push(category.trim().toLowerCase());
    clauses.push(`LOWER(category) = ?${params.length}`);
  }

  if (search && search.trim()) {
    const pattern = `%${search.trim().toLowerCase()}%`;
    params.push(pattern);
    const pIdx = params.length;
    clauses.push(
      `(LOWER(title) LIKE ?${pIdx} OR LOWER(excerpt) LIKE ?${pIdx} OR LOWER(category) LIKE ?${pIdx})`
    );
  }

  let sql = `SELECT * FROM posts`;
  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(' AND ')}`;
  }
  sql += ` ORDER BY published_at DESC`;

  if (limit > 0) {
    params.push(limit);
    sql += ` LIMIT ?${params.length}`;
  }

  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const { results } = await stmt.all();
  return (results || []).map(mapRowToPost);
}

export async function getPostBySlug(db, slug) {
  const row = await db.prepare('SELECT * FROM posts WHERE slug = ?1').bind(slug).first();
  return mapRowToPost(row);
}

export async function getPostById(db, id) {
  const row = await db.prepare('SELECT * FROM posts WHERE id = ?1').bind(id).first();
  return mapRowToPost(row);
}

export async function countPostsReferencingCover(db, coverImageUrl, excludePostId = null) {
  if (!coverImageUrl) return 0;
  const sql = excludePostId
    ? 'SELECT COUNT(*) AS cnt FROM posts WHERE cover_image = ?1 AND id != ?2'
    : 'SELECT COUNT(*) AS cnt FROM posts WHERE cover_image = ?1';
  const stmt = excludePostId
    ? db.prepare(sql).bind(coverImageUrl, excludePostId)
    : db.prepare(sql).bind(coverImageUrl);
  const row = await stmt.first();
  return Number(row?.cnt || 0);
}

async function makeUniqueSlug(db, baseSlug, ignoreId = null) {
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const existing = ignoreId
      ? await db
          .prepare('SELECT id FROM posts WHERE slug = ?1 AND id != ?2')
          .bind(candidate, ignoreId)
          .first()
      : await db.prepare('SELECT id FROM posts WHERE slug = ?1').bind(candidate).first();

    if (!existing) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function createPost(db, input, env) {
  const now = new Date().toISOString();
  const cleanHtml = sanitizeArticleHtml(input.content);
  const slug = await makeUniqueSlug(db, slugifyTitle(input.title));
  const id = `post-${randomHex(6)}`;
  const excerpt = createExcerpt(cleanHtml, input.excerpt);
  const readingTimeMinutes = calculateReadingTimeMinutes(cleanHtml);
  const coverImage = input.coverImage || '/images/insights/banking-knowledge-cover.svg';
  const featured = input.featured ? 1 : 0;
  const authorName = env?.ADMIN_NAME || 'Mr. Gopal Arora';
  const authorCredentials =
    'Founder, Nexa Fund Advisor LLP | Former Chief Manager, UCO Bank (38 Years in PSU Banking)';

  const insertStmt = db
    .prepare(
      `INSERT INTO posts (
        id, slug, title, category, excerpt, cover_image, featured,
        published_at, updated_at, author_name, author_credentials,
        content, reading_time_minutes
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    )
    .bind(
      id,
      slug,
      input.title.trim(),
      input.category,
      excerpt,
      coverImage,
      featured,
      now,
      now,
      authorName,
      authorCredentials,
      cleanHtml,
      readingTimeMinutes
    );

  if (featured === 1) {
    await db.batch([db.prepare('UPDATE posts SET featured = 0 WHERE featured = 1'), insertStmt]);
  } else {
    await insertStmt.run();
  }

  return getPostById(db, id);
}

export async function updatePost(db, id, input) {
  const existing = await getPostById(db, id);
  if (!existing) return null;

  const cleanHtml = sanitizeArticleHtml(input.content ?? existing.content);
  const nextTitle = (input.title ?? existing.title).trim();
  const nextSlug =
    nextTitle !== existing.title
      ? await makeUniqueSlug(db, slugifyTitle(nextTitle), id)
      : existing.slug;
  const nextCategory = input.category ?? existing.category;
  const nextExcerpt = createExcerpt(cleanHtml, input.excerpt ?? '');
  const nextCoverImage = input.coverImage !== undefined ? input.coverImage : existing.coverImage;
  const nextFeatured = input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured ? 1 : 0;
  const nextUpdatedAt = new Date().toISOString();
  const nextReadingTime = calculateReadingTimeMinutes(cleanHtml);

  const updateStmt = db
    .prepare(
      `UPDATE posts SET
        slug = ?1,
        title = ?2,
        category = ?3,
        excerpt = ?4,
        cover_image = ?5,
        featured = ?6,
        updated_at = ?7,
        content = ?8,
        reading_time_minutes = ?9
      WHERE id = ?10`
    )
    .bind(
      nextSlug,
      nextTitle,
      nextCategory,
      nextExcerpt,
      nextCoverImage,
      nextFeatured,
      nextUpdatedAt,
      cleanHtml,
      nextReadingTime,
      id
    );

  if (nextFeatured === 1) {
    await db.batch([
      db.prepare('UPDATE posts SET featured = 0 WHERE featured = 1 AND id != ?1').bind(id),
      updateStmt,
    ]);
  } else {
    await updateStmt.run();
  }

  const updated = await getPostById(db, id);
  return {
    post: updated,
    previousCoverImage: existing.coverImage,
  };
}

export async function deletePost(db, id) {
  const existing = await getPostById(db, id);
  if (!existing) return null;
  await db.prepare('DELETE FROM posts WHERE id = ?1').bind(id).run();
  return existing;
}
