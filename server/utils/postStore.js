import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sanitizeHtml from 'sanitize-html';
import { SEED_POSTS } from '../data/seedPosts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

let writeQueue = Promise.resolve();

function sanitizeArticleHtml(html) {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'h2',
      'h3',
      'h4',
      'p',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'blockquote',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      }),
    },
  });
}

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

function enrichPost(post) {
  return {
    ...post,
    readingTimeMinutes: post.readingTimeMinutes || calculateReadingTimeMinutes(post.content),
    excerpt: createExcerpt(post.content, post.excerpt),
  };
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(POSTS_FILE);
  } catch {
    const initial = SEED_POSTS.map(enrichPost);
    await fs.writeFile(POSTS_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

async function readPostsRaw() {
  await ensureStore();
  const raw = await fs.readFile(POSTS_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.map(enrichPost) : [];
}

function writePostsAtomic(posts) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmpFile = `${POSTS_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(posts, null, 2), 'utf8');
    await fs.rename(tmpFile, POSTS_FILE);
  });
  return writeQueue;
}

export async function listPosts({ category = '', search = '', limit = 0 } = {}) {
  let posts = await readPostsRaw();
  posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (category && category !== 'All') {
    posts = posts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase().trim();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (limit > 0) {
    posts = posts.slice(0, limit);
  }

  return posts;
}

export async function getPostBySlug(slug) {
  const posts = await readPostsRaw();
  return posts.find((p) => p.slug === slug) || null;
}

export async function getPostById(id) {
  const posts = await readPostsRaw();
  return posts.find((p) => p.id === id) || null;
}

function makeUniqueSlug(baseSlug, posts, ignoreId = null) {
  let candidate = baseSlug;
  let counter = 2;
  while (posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function createPost(input) {
  const posts = await readPostsRaw();
  const now = new Date().toISOString();
  const cleanHtml = sanitizeArticleHtml(input.content);
  const slug = makeUniqueSlug(slugifyTitle(input.title), posts);

  const newPost = enrichPost({
    id: `post-${crypto.randomBytes(6).toString('hex')}`,
    slug,
    title: input.title.trim(),
    category: input.category,
    excerpt: createExcerpt(cleanHtml, input.excerpt),
    coverImage: input.coverImage || '/images/insights/banking-knowledge-cover.svg',
    featured: Boolean(input.featured),
    publishedAt: now,
    updatedAt: now,
    authorName: process.env.ADMIN_NAME || 'Mr. Gopal Arora',
    authorCredentials:
      'Founder, Nexa Fund Advisor LLP | Former Chief Manager, UCO Bank (38 Years in PSU Banking)',
    content: cleanHtml,
  });

  const nextPosts = newPost.featured
    ? [newPost, ...posts.map((p) => ({ ...p, featured: false }))]
    : [newPost, ...posts];

  await writePostsAtomic(nextPosts);
  return newPost;
}

export async function updatePost(id, input) {
  const posts = await readPostsRaw();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const existing = posts[idx];
  const cleanHtml = sanitizeArticleHtml(input.content ?? existing.content);
  const nextTitle = (input.title ?? existing.title).trim();
  const nextSlug =
    nextTitle !== existing.title
      ? makeUniqueSlug(slugifyTitle(nextTitle), posts, id)
      : existing.slug;

  const updated = enrichPost({
    ...existing,
    title: nextTitle,
    slug: nextSlug,
    category: input.category ?? existing.category,
    excerpt: createExcerpt(cleanHtml, input.excerpt ?? ''),
    coverImage: input.coverImage !== undefined ? input.coverImage : existing.coverImage,
    featured: input.featured !== undefined ? Boolean(input.featured) : existing.featured,
    updatedAt: new Date().toISOString(),
    content: cleanHtml,
  });

  const nextPosts = posts.map((p) => {
    if (p.id === id) return updated;
    if (updated.featured) return { ...p, featured: false };
    return p;
  });

  await writePostsAtomic(nextPosts);
  return updated;
}

export async function deletePost(id) {
  const posts = await readPostsRaw();
  const target = posts.find((p) => p.id === id);
  if (!target) return null;
  const remaining = posts.filter((p) => p.id !== id);
  await writePostsAtomic(remaining);
  return target;
}
