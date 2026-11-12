/**
 * Zero-dependency HTML sanitizer tailored for Cloudflare Workers,
 * matching the exact tag allowlist and link hardening rules of server/utils/postStore.js.
 */

const ALLOWED_TAGS = new Set([
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
]);

const STRIP_CONTENT_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'form',
  'noscript',
  'template',
];

const VOID_TAGS = new Set(['br', 'hr']);

function extractHrefAttribute(attrString) {
  if (!attrString) return '';
  const match = attrString.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const raw = (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
  if (!raw) return '';
  // Reject control chars or unsafe schemes (allow http, https, mailto only)
  const cleaned = raw.replace(/[\u0000-\u001F\u007F\s]/g, '');
  if (!/^(https?:|mailto:)/i.test(cleaned)) {
    return '';
  }
  return raw.replace(/"/g, '&quot;');
}

export function sanitizeArticleHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html;
  // Remove comments and dangerous blocks completely along with inner text
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of STRIP_CONTENT_TAGS) {
    const blockRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(blockRegex, '');
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  }

  // Filter remaining HTML tags against allowlist
  return sanitized.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (fullMatch, rawTagName, attrs) => {
    const tag = rawTagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    const isClosing = fullMatch.startsWith('</');
    if (isClosing) {
      return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
    }

    if (VOID_TAGS.has(tag)) {
      return `<${tag} />`;
    }

    if (tag === 'a') {
      const href = extractHrefAttribute(attrs);
      if (!href) {
        return '<a rel="noopener noreferrer nofollow" target="_blank">';
      }
      return `<a href="${href}" rel="noopener noreferrer nofollow" target="_blank">`;
    }

    return `<${tag}>`;
  });
}
