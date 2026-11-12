import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Share2,
  Check,
  MessageCircle,
} from 'lucide-react';
import PageHead from '../components/PageHead';
import InsightCard, { formatPostDate } from '../components/InsightCard';
import { COMPANY, FOUNDER } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openEnquiryModal } = useEnquiryModal();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/posts/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) {
          if (active) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!active || !data) return;
        if (data.ok && data.post) {
          setPost(data.post);
          setRelated(Array.isArray(data.related) ? data.related : []);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const sanitizedHtml = useMemo(() => {
    if (!post?.content) return '';
    return DOMPurify.sanitize(post.content);
  }, [post?.content]);

  const shareUrl = `${COMPANY.websiteUrl}/insights/${slug}`;

  function handleCopyLink() {
    navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Loading article...</p>
        </div>
      </section>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <PageHead
          title="Article Not Found"
          description="The requested educational article could not be found."
          path={`/insights/${slug}`}
          noIndex
        />
        <section className="section">
          <div className="container" style={{ maxWidth: '700px' }}>
            <h1>Article Not Found</h1>
            <p className="lead-text">
              The article you are looking for may have been moved or removed.
            </p>
            <Link to="/insights" className="btn btn-navy">
              <ArrowLeft size={16} />
              Back to Nexa Insights
            </Link>
          </div>
        </section>
      </>
    );
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    image: `${COMPANY.websiteUrl}${post.coverImage || '/images/insights/banking-knowledge-cover.svg'}`,
    author: {
      '@type': 'Person',
      name: post.authorName || FOUNDER.name,
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      logo: {
        '@type': 'ImageObject',
        url: `${COMPANY.websiteUrl}${COMPANY.logoPrimary}`,
      },
    },
  };

  return (
    <>
      <PageHead
        title={post.title}
        description={post.excerpt}
        path={`/insights/${post.slug}`}
        ogType="article"
        ogImage={post.coverImage || '/images/insights/banking-knowledge-cover.svg'}
        structuredData={articleSchema}
      />

      <section className="page-banner" style={{ paddingBottom: '42px' }}>
        <div className="container" style={{ maxWidth: '920px' }}>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/insights">Insights</Link>
            <span>/</span>
            <span>{post.category}</span>
          </nav>

          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(200, 163, 77, 0.2)',
              border: '1px solid rgba(200, 163, 77, 0.5)',
              color: 'var(--gold-light)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            {post.category}
          </div>

          <h1 style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.75rem)', marginBottom: '16px' }}>
            {post.title}
          </h1>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              color: '#C7D6E6',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} />
              Published {formatPostDate(post.publishedAt)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} />
              {post.readingTimeMinutes || 3} min read
            </span>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '44px' }}>
        <div className="container" style={{ maxWidth: '920px' }}>
          {post.coverImage && (
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                marginBottom: '32px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <img
                src={post.coverImage}
                alt={post.title}
                style={{ width: '100%', maxHeight: '460px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Author Credentials Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              background: 'var(--bg-ivory)',
              border: '1px solid var(--line)',
              borderRadius: '10px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={FOUNDER.photo}
                alt={FOUNDER.name}
                width="54"
                height="54"
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  border: '2px solid var(--gold)',
                }}
              />
              <div>
                <strong style={{ display: 'block', color: 'var(--navy)' }}>
                  {post.authorName || FOUNDER.name}
                </strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
                  {post.authorCredentials ||
                    'Founder, Nexa Fund Advisor LLP | Former Chief Manager, UCO Bank (38 Years in PSU Banking)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginRight: '4px' }}>
                <Share2 size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                Share:
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-navy btn-sm"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-navy btn-sm"
              >
                LinkedIn
              </a>
              <button
                type="button"
                className="btn btn-outline-navy btn-sm"
                onClick={handleCopyLink}
              >
                {copied ? <Check size={14} /> : null}
                {copied ? 'Link Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

          <div
            style={{
              marginTop: '36px',
              padding: '24px',
              background: 'var(--navy)',
              color: 'var(--white)',
              borderRadius: '10px',
              border: '1px solid rgba(200, 163, 77, 0.45)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <div style={{ maxWidth: '560px' }}>
              <h3 style={{ color: 'var(--white)', marginBottom: '6px' }}>
                Need Assistance With {post.category}?
              </h3>
              <p style={{ margin: 0, color: '#CEDAE8', fontSize: '0.94rem' }}>
                Request a free preliminary consultation or compare options with Nexa Fund Advisor LLP.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() =>
                  openEnquiryModal(
                    `Article Enquiry: ${post.title}`,
                    post.category === 'Balance Transfers' ? 'Existing Loan' : 'New Loan'
                  )
                }
              >
                Enquire Now
                <ArrowRight size={16} />
              </button>
              <a
                href={COMPANY.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-light"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
          </div>

          <p style={{ marginTop: '18px', fontSize: '0.82rem', color: 'var(--muted)' }}>
            Educational Disclaimer: Articles published on Nexa Insights provide general financial awareness and procedural education only and do not constitute guaranteed loan approval, interest rate commitments, or financial advice tailored without reviewing complete documentation.
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-ivory">
          <div className="container">
            <div className="section-header-split">
              <h2 style={{ marginBottom: 0 }}>Related Insights</h2>
              <Link to="/insights" className="btn btn-outline-navy btn-sm">
                View All Articles
              </Link>
            </div>
            <div className="grid-3">
              {related.map((item) => (
                <InsightCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
