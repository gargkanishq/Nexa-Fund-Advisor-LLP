import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { COMPANY } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Our Services' },
  { to: '/home-loan-balance-transfer', label: 'Home Loan Transfer' },
  { to: '/calculators', label: 'Calculators' },
  { to: '/insights', label: 'Insights' },
  { to: '/contact', label: 'Contact Us' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openEnquiryModal } = useEnquiryModal();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand-lockup" aria-label={`${COMPANY.name} Home`}>
          <img
            src={COMPANY.logoPrimary}
            alt="Nexa Fund Advisor LLP Logo"
            width="48"
            height="48"
          />
          <div>
            <span className="brand-title">{COMPANY.name}</span>
            <span className="brand-subtitle">{COMPANY.tagline}</span>
          </div>
        </Link>

        <nav className="desktop-nav" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => openEnquiryModal('Header Enquire Now')}
          >
            Enquire Now
          </button>

          <button
            type="button"
            className="menu-toggle-btn"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation-drawer"
        className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}
      >
        <div className="container mobile-drawer-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            className="btn btn-gold mobile-drawer-cta"
            onClick={() => {
              setMobileOpen(false);
              openEnquiryModal('Mobile Menu Enquire Now');
            }}
          >
            Enquire Now
          </button>
        </div>
      </div>
    </header>
  );
}
