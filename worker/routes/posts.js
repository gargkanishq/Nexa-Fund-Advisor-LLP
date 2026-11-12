import { Hono } from 'hono';
import { BLOG_CATEGORIES, sanitizeText } from '../../shared/validation.js';
import { requireAdmin } from '../utils/session.js';
import {
  createPost,
  deletePost,
  getPostById,
  getPostBySlug,
  listPosts,
  updatePost,
} from '../utils/postStore.js';
import { deleteOrphanedUploadFromR2 } from '../utils/imageStorage.js';

function validatePostBody(body = {}, { isUpdate = false } = {}) {
  const errors = {};
  const title = body.title !== undefined ? sanitizeText(body.title, 180) : undefined;
  const category = body.category !== undefined ? sanitizeText(body.category, 60) : undefined;
  const excerpt = body.excerpt !== undefined ? sanitizeText(body.excerpt, 280) : undefined;
  const coverImage = body.coverImage !== undefined ? sanitizeText(body.coverImage, 400) : undefined;
  const content = typeof body.content === 'string' ? body.content : undefined;

  if (!isUpdate || title !== undefined) {
    if (!title || title.length < 5) {
      errors.title = 'Article title must be at least 5 characters.';
    }
  }

  if (!isUpdate || category !== undefined) {
    if (!BLOG_CATEGORIES.includes(category)) {
      errors.category = 'Please choose a valid article category.';
    }
  }

  if (!isUpdate || content !== undefined) {
    const plain = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length < 30) {
      errors.content = 'Article body must contain at least 30 characters of content.';
    }
  }

  if (coverImage) {
    const isSafePath =
      coverImage.startsWith('/uploads/') ||
      coverImage.startsWith('/images/') ||
      /^https?:\/\//i.test(coverImage);
    if (!isSafePath) {
      errors.coverImage = 'Cover image URL must be an uploaded asset or valid http/https path.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      title,
      category,
      excerpt,
      coverImage,
      content,
      featured: body.featured,
    },
  };
}

const posts = new Hono();

posts.get('/', async (c) => {
  const category = c.req.query('category') || '';
  const search = c.req.query('q') || '';
  const limit = Number.parseInt(String(c.req.query('limit') || '0'), 10) || 0;
  const items = await listPosts(c.env.DB, { category, search, limit });
  return c.json({ ok: true, posts: items });
});

posts.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const post = await getPostBySlug(c.env.DB, slug);
  if (!post) {
    return c.json({ ok: false, message: 'Article not found.' }, 404);
  }
  const allPosts = await listPosts(c.env.DB);
  const sameCategory = allPosts.filter((p) => p.id !== post.id && p.category === post.category);
  const others = allPosts.filter((p) => p.id !== post.id && p.category !== post.category);
  const related = [...sameCategory, ...others].slice(0, 3);
  return c.json({ ok: true, post, related });
});

posts.post('/', requireAdmin, async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, message: 'Invalid JSON request body.' }, 400);
  }

  const { isValid, errors, cleaned } = validatePostBody(body);
  if (!isValid) {
    return c.json({ ok: false, message: 'Please fix the highlighted errors.', errors }, 400);
  }

  const post = await createPost(c.env.DB, cleaned, c.env);
  return c.json({ ok: true, post }, 201);
});

posts.put('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const existing = await getPostById(c.env.DB, id);
  if (!existing) {
    return c.json({ ok: false, message: 'Article not found.' }, 404);
  }

  let body = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, message: 'Invalid JSON request body.' }, 400);
  }

  const { isValid, errors, cleaned } = validatePostBody(body, { isUpdate: true });
  if (!isValid) {
    return c.json({ ok: false, message: 'Please fix the highlighted errors.', errors }, 400);
  }

  const result = await updatePost(c.env.DB, id, cleaned);
  if (
    result?.previousCoverImage &&
    result.previousCoverImage !== result.post.coverImage
  ) {
    await deleteOrphanedUploadFromR2(c.env, c.env.DB, result.previousCoverImage, id);
  }

  return c.json({ ok: true, post: result.post });
});

posts.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const deleted = await deletePost(c.env.DB, id);
  if (!deleted) {
    return c.json({ ok: false, message: 'Article not found.' }, 404);
  }

  if (deleted.coverImage) {
    await deleteOrphanedUploadFromR2(c.env, c.env.DB, deleted.coverImage);
  }

  return c.json({ ok: true, deletedId: deleted.id });
});

export default posts;
