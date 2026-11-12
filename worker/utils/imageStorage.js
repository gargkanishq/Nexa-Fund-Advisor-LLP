import { randomHex } from './crypto.js';
import { countPostsReferencingCover } from './postStore.js';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB cap keeps R2 usage well within 10 GB free tier

export const ALLOWED_MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const SAFE_KEY_REGEX = /^cover-\d+-[a-f0-9]+\.(jpg|png|webp)$/i;

/**
 * Validates image binary signatures (magic bytes) so spoofed MIME headers cannot sneak non-image files into R2.
 */
export function hasValidImageSignature(bytes, mimeType) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return false;

  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === 'image/webp') {
    return (
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    );
  }

  return false;
}

export function extractManagedUploadKey(coverImageUrl) {
  if (typeof coverImageUrl !== 'string' || !coverImageUrl.startsWith('/uploads/')) {
    return null;
  }
  const key = coverImageUrl.slice('/uploads/'.length);
  return SAFE_KEY_REGEX.test(key) ? key : null;
}

export async function uploadImageToR2(env, file) {
  if (!env?.UPLOADS) {
    const err = new Error('R2 storage binding (UPLOADS) is not configured.');
    err.status = 503;
    throw err;
  }

  if (!file || typeof file.arrayBuffer !== 'function') {
    const err = new Error('Please select an image file to upload.');
    err.status = 400;
    throw err;
  }

  const ext = ALLOWED_MIME_EXT[file.type];
  if (!ext) {
    const err = new Error('Only JPG, PNG, and WebP images are supported (max 2 MB).');
    err.status = 400;
    throw err;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const err = new Error('Image size must be 2 MB or smaller to keep hosting within free limits.');
    err.status = 400;
    throw err;
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    const err = new Error('Image size must be between 1 byte and 2 MB.');
    err.status = 400;
    throw err;
  }

  if (!hasValidImageSignature(bytes, file.type)) {
    const err = new Error('File contents do not match a valid JPG, PNG, or WebP image.');
    err.status = 400;
    throw err;
  }

  const key = `cover-${Date.now()}-${randomHex(4)}${ext}`;

  // Store explicitly in R2 Standard storage with immutable CDN caching metadata
  await env.UPLOADS.put(key, bytes, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    storageClass: 'Standard',
  });

  return {
    key,
    url: `/uploads/${key}`,
    size: bytes.byteLength,
    contentType: file.type,
  };
}

export async function getUploadedImageResponse(env, request, rawKey) {
  if (!env?.UPLOADS) {
    return new Response('Storage not configured.', { status: 503 });
  }

  if (!SAFE_KEY_REGEX.test(rawKey || '')) {
    return new Response('Not found.', { status: 404 });
  }

  const object = await env.UPLOADS.get(rawKey);
  if (!object) {
    return new Response('Image not found.', { status: 404 });
  }

  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: object.httpEtag,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(object.body, { headers });
}

/**
 * Deletes an uploaded cover image from R2 only if it is a managed /uploads/* key
 * and no remaining blog post references it.
 */
export async function deleteOrphanedUploadFromR2(env, db, coverImageUrl, excludePostId = null) {
  if (!env?.UPLOADS) return false;
  const key = extractManagedUploadKey(coverImageUrl);
  if (!key) return false;

  const refCount = await countPostsReferencingCover(db, coverImageUrl, excludePostId);
  if (refCount > 0) return false;

  await env.UPLOADS.delete(key);
  return true;
}
