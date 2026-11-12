import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export function formatPostDate(isoDate) {
  if (!isoDate) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return '';
  }
}

export default function InsightCard({ post }) {
  return (
    <article className="insight-card">
      <Link to={`/insights/${post.slug}`} className="insight-cover" aria-label={post.title}>
        <img
          src={post.coverImage || '/images/insights/banking-knowledge-cover.svg'}
          alt={post.title}
          loading="lazy"
        />
      </Link>
      <div className="insight-body">
        <div className="insight-meta">
          <span className="insight-category-pill">{post.category}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            {formatPostDate(post.publishedAt)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {post.readingTimeMinutes || 3} min read
          </span>
        </div>

        <h3>
          <Link to={`/insights/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <Link to={`/insights/${post.slug}`} className="card-footer-link">
          Read Article <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
