import { useEffect, useRef, useState } from 'react';
import { BUSINESS_ACHIEVEMENTS } from '../data/siteContent';

/**
 * Business achievement statistics component.
 * Displays animated counter figures (₹8 Crore+ and 30+ Families Served)
 * triggered once when entering the viewport, respecting reduced motion settings.
 */
export default function AchievementStats() {
  const [counts, setCounts] = useState(() => BUSINESS_ACHIEVEMENTS.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || hasAnimated) return;

    // Respect prefers-reduced-motion accessibility preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCounts(BUSINESS_ACHIEVEMENTS.map((item) => item.targetValue));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();

          const duration = 1200; // ms
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Smooth easeOutCubic curve
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts(
              BUSINESS_ACHIEVEMENTS.map((item) =>
                progress >= 1 ? item.targetValue : Math.round(item.targetValue * ease)
              )
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      className="section section-achievements"
      aria-labelledby="achievements-heading"
    >
      <div className="container">
        <div className="section-header" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div className="eyebrow eyebrow-gold">Track Record</div>
          <h2 id="achievements-heading" style={{ marginBottom: '8px' }}>
            Proven Loan Facilitation Milestones
          </h2>
          <p className="lead-text" style={{ maxWidth: '640px', margin: '0 auto' }}>
            Delivering measurable value to homebuyers and borrowers through experienced banking consultation.
          </p>
        </div>

        <div className="achievements-grid">
          {BUSINESS_ACHIEVEMENTS.map((stat, index) => {
            const displayValue = hasAnimated ? counts[index] : 0;
            return (
              <div key={stat.id} className="achievement-card">
                <div
                  className="achievement-number"
                  aria-label={`${stat.prefix}${stat.targetValue}${stat.suffix} ${stat.label}`}
                >
                  <span className="achievement-prefix">{stat.prefix}</span>
                  <span className="achievement-value tabular-nums">{displayValue}</span>
                  <span className="achievement-suffix">{stat.suffix}</span>
                </div>
                <h3 className="achievement-label">{stat.label}</h3>
                <p className="achievement-desc">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
