import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { EnquiryModalProvider } from './context/EnquiryModalContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EnquiryModal from './components/EnquiryModal';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BalanceTransferPage from './pages/BalanceTransferPage';
import CalculatorsPage from './pages/CalculatorsPage';
import InsightsPage from './pages/InsightsPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ContactPage from './pages/ContactPage';
import EnquirePage from './pages/EnquirePage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';

const AdminPage = lazy(() => import('./pages/AdminPage'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <EnquiryModalProvider>
      <ScrollToTop />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/home-loan-balance-transfer" element={<BalanceTransferPage />} />
          <Route path="/calculators" element={<CalculatorsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/:slug" element={<ArticleDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/enquire" element={<EnquirePage />} />
          <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
          <Route path="/terms-and-conditions" element={<LegalPage type="terms" />} />
          <Route path="/disclaimer" element={<LegalPage type="disclaimer" />} />
          <Route
            path="/admin"
            element={
              <Suspense
                fallback={
                  <section className="section">
                    <div className="container">Loading portal...</div>
                  </section>
                }
              >
                <AdminPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <EnquiryModal />
      <WhatsAppButton />
    </EnquiryModalProvider>
  );
}
