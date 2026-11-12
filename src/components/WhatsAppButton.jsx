import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { COMPANY } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function WhatsAppButton() {
  const location = useLocation();
  const { isOpen } = useEnquiryModal();

  if (location.pathname.startsWith('/admin') || isOpen) {
    return null;
  }

  return (
    <a
      href={COMPANY.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Chat with Nexa Fund Advisor LLP on WhatsApp"
    >
      <MessageCircle size={20} aria-hidden="true" />
      <span>WhatsApp Us</span>
    </a>
  );
}
