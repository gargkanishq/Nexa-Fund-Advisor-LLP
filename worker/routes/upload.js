import { Hono } from 'hono';
import { requireAdmin } from '../utils/session.js';
import { countPostsReferencingCover } from '../utils/postStore.js';
import { extractManagedUploadKey, uploadImageToR2 } from '../utils/imageStorage.js';

const upload = new Hono();

upload.post('/', requireAdmin, async (c) => {
  let formData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ ok: false, message: 'Invalid multipart form data.' }, 400);
  }

  const file = formData.get('image');
  if (!file || typeof file === 'string') {
    return c.json({ ok: false, message: 'Please select an image file to upload.' }, 400);
  }

  try {
    const saved = await uploadImageToR2(c.env, file);
    return c.json({ ok: true, url: saved.url, size: saved.size }, 201);
  } catch (err) {
    const status = err?.status || 500;
    return c.json(
      {
        ok: false,
        message: err?.message || 'Image upload failed.',
      },
      status
    );
  }
});

upload.delete('/:key', requireAdmin, async (c) => {
  const key = c.req.param('key');
  const url = `/uploads/${key}`;
  if (!extractManagedUploadKey(url)) {
    return c.json({ ok: false, message: 'Invalid upload key.' }, 400);
  }
  if (!c.env?.UPLOADS) {
    return c.json({ ok: false, message: 'R2 storage binding is not configured.' }, 503);
  }

  const refs = await countPostsReferencingCover(c.env.DB, url);
  if (refs > 0) {
    return c.json(
      { ok: false, message: 'Cannot delete cover image while an article still uses it.' },
      409
    );
  }

  await c.env.UPLOADS.delete(key);
  return c.json({ ok: true, deletedKey: key });
});

export default upload;
