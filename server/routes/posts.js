import express from 'express';
import { BLOG_CATEGORIES, sanitizeText } from '../../shared/validation.js';
import { requireAdmin } from '../utils/auth.js';
import {
  createPost,
  deletePost,
  getPostById,
  getPostBySlug,
  listPosts,
  updatePost,
} from '../utils/postStore.js';

const router = express.Router();

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

router.get('/', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const search = typeof req.query.q === 'string' ? req.query.q : '';
    const limit = Number.parseInt(String(req.query.limit || '0'), 10) || 0;
    const posts = await listPosts({ category, search, limit });
    res.json({ ok: true, posts });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ ok: false, message: 'Article not found.' });
    }
    const allPosts = await listPosts();
    const sameCategory = allPosts.filter((p) => p.id !== post.id && p.category === post.category);
    const others = allPosts.filter((p) => p.id !== post.id && p.category !== post.category);
    const related = [...sameCategory, ...others].slice(0, 3);
    return res.json({ ok: true, post, related });
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { isValid, errors, cleaned } = validatePostBody(req.body);
    if (!isValid) {
      return res.status(400).json({ ok: false, message: 'Please fix the highlighted errors.', errors });
    }
    const post = await createPost(cleaned);
    return res.status(201).json({ ok: true, post });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await getPostById(req.params.id);
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Article not found.' });
    }
    const { isValid, errors, cleaned } = validatePostBody(req.body, { isUpdate: true });
    if (!isValid) {
      return res.status(400).json({ ok: false, message: 'Please fix the highlighted errors.', errors });
    }
    const post = await updatePost(req.params.id, cleaned);
    return res.json({ ok: true, post });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const deleted = await deletePost(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Article not found.' });
    }
    return res.json({ ok: true, deletedId: deleted.id });
  } catch (err) {
    return next(err);
  }
});

export default router;
