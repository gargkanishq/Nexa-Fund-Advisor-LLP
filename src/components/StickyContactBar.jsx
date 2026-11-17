import { Phone, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { COMPANY } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

/**
 * Floating sticky contact dock providing quick access to both
 * direct phone calling and WhatsApp messaging.
 * Automatically hidden on admin pages and when modals are open.
 */
export default function StickyContactBar() {
  const location = useLocation();
  const { isOpen } = useEnquiryModal();

  if (location.pathname.startsWith('/admin') || isOpen) {
    return null;
  }

  return (
    <aside className="sticky-contact-dock" aria-label="Quick contact options">
      <a
        href={COMPANY.phoneHref}
        className="sticky-contact-btn sticky-call-btn"
        aria-label={`Call Nexa Fund Advisor at ${COMPANY.phoneDisplay}`}
      >
        <Phone size={19} aria-hidden="true" />
        <span className="sticky-btn-text">Call Us</span>
      </a>

      <a
        href={COMPANY.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="sticky-contact-btn sticky-whatsapp-btn"
        aria-label="Chat with Nexa Fund Advisor on WhatsApp"
      >
        <MessageCircle size={19} aria-hidden="true" />
        <span className="sticky-btn-text">WhatsApp</span>
      </a>
    </aside>
  );
}
