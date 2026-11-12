import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useEnquiryModal } from '../context/EnquiryModalContext';
import EnquiryForm from './EnquiryForm';

export default function EnquiryModal() {
  const { isOpen, enquiryContext, defaultLoanMode, closeEnquiryModal } = useEnquiryModal();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEnquiryModal();
      }}
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-heading"
        aria-describedby="enquiry-modal-desc"
      >
        <div className="modal-header">
          <div>
            <h2 id="enquiry-modal-heading">Looking for the Right Loan?</h2>
            <p id="enquiry-modal-desc">
              Tell us a little about yourself. Our team will help you explore suitable options.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close-btn"
            onClick={closeEnquiryModal}
            aria-label="Close enquiry popup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <EnquiryForm
            contextNote={enquiryContext}
            defaultLoanMode={defaultLoanMode}
            onSuccessClose={closeEnquiryModal}
          />
        </div>
      </div>
    </div>
  );
}
