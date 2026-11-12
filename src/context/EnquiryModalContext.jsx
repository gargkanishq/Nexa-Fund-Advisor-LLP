import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_POPUP_KEY = 'nexa_enquiry_popup_shown_v1';
const POPUP_DELAY_MS = 10000;

const EnquiryModalContext = createContext({
  isOpen: false,
  enquiryContext: '',
  defaultLoanMode: '',
  openEnquiryModal: () => {},
  closeEnquiryModal: () => {},
});

export function EnquiryModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [enquiryContext, setEnquiryContext] = useState('');
  const [defaultLoanMode, setDefaultLoanMode] = useState('');
  const location = useLocation();

  const openEnquiryModal = useCallback((contextNote = '', loanMode = '') => {
    setEnquiryContext(contextNote);
    setDefaultLoanMode(loanMode);
    setIsOpen(true);
    try {
      sessionStorage.setItem(SESSION_POPUP_KEY, '1');
    } catch {
      // Ignore storage failures in restricted browser modes
    }
  }, []);

  const closeEnquiryModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Trigger automatic popup once per browsing session ~10 seconds after first visit
  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname === '/enquire') {
      return undefined;
    }

    try {
      if (sessionStorage.getItem(SESSION_POPUP_KEY) === '1') {
        return undefined;
      }
    } catch {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(SESSION_POPUP_KEY) === '1') return;
        sessionStorage.setItem(SESSION_POPUP_KEY, '1');
      } catch {
        // Ignore storage failure
      }
      setIsOpen(true);
    }, POPUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  // Prevent accidental background scroll while popup is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <EnquiryModalContext.Provider
      value={{
        isOpen,
        enquiryContext,
        defaultLoanMode,
        openEnquiryModal,
        closeEnquiryModal,
      }}
    >
      {children}
    </EnquiryModalContext.Provider>
  );
}

export function useEnquiryModal() {
  return useContext(EnquiryModalContext);
}
