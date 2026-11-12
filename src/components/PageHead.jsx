import { useEffect } from 'react';
import { COMPANY } from '../data/siteContent';

function setMetaTag(attrName, attrValue, content) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export default function PageHead({
  title,
  description,
  path = '/',
  ogType = 'website',
  ogImage = '/images/Company Design Assets/NFA LOGO.png',
  noIndex = false,
  structuredData = null,
}) {
  useEffect(() => {
    const fullTitle = title.includes(COMPANY.shortName)
      ? title
      : `${title} | ${COMPANY.name}`;
    document.title = fullTitle;

    const canonicalUrl = `${COMPANY.websiteUrl}${path === '/' ? '' : path}`;
    const absoluteImage = ogImage.startsWith('http')
      ? ogImage
      : `${COMPANY.websiteUrl}${ogImage}`;

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', absoluteImage);
    setMetaTag('property', 'og:site_name', COMPANY.name);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setCanonical(canonicalUrl);

    const existingScript = document.getElementById('nexa-jsonld');
    if (existingScript) existingScript.remove();

    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'nexa-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [title, description, path, ogType, ogImage, noIndex, structuredData]);

  return null;
}
