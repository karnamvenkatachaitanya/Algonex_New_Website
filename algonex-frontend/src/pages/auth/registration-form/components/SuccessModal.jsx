import { useState } from 'react';

const SuccessModal = ({ data, onClose }) => {
  const { studentId, cardUrl, invoiceUrl, email } = data;
  const [activeTab, setActiveTab] = useState('card');
  const cacheBuster = `?t=${new Date().getTime()}`;

  return (
    <div
      className="modal-overlay"
      id="successModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="success-card glass-card">
        <button
          type="button"
          className="close-modal-btn"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="success-header">
          <div className="success-icon-badge">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h2>Registration Confirmed!</h2>
          <p>
            Welcome to Algonex IT Solutions. Your registration has been
            submitted successfully.
          </p>
        </div>

        <div className="success-grid">
          {/* Left Column: Details */}
          <div className="success-details">
            <div className="success-id-box">
              <span className="id-lbl">STUDENT ID</span>
              <span className="id-val" id="successStudentId">
                {studentId}
              </span>
            </div>

            <div className="info-alert">
              <i className="fa-solid fa-circle-info"></i>
              <p>
                We've sent a confirmation email to{' '}
                <strong id="successEmailText">{email}</strong>. It includes
                your digital ID card attachment and outlines your onboarding
                steps.
              </p>
            </div>

            <div className="onboarding-steps">
              <h3>Subsequent Onboarding Steps:</h3>
              <ol>
                <li>
                  Our finance team will verify your UPI Transaction Reference
                  ID (usually takes 12-24 hours).
                </li>
                <li>
                  Once verified, your status will update to{' '}
                  <strong>Active</strong>.
                </li>
                <li>
                  You will receive a welcome kit with Slack workspace
                  invitations, course syllabus, and access credentials.
                </li>
              </ol>
            </div>
          </div>

          {/* Right Column: Card Preview */}
          <div className="success-card-preview">
            <div className="modal-tabs">
              <button
                type="button"
                className={`tab-btn${activeTab === 'card' ? ' active' : ''}`}
                onClick={() => setActiveTab('card')}
              >
                Digital ID Card
              </button>
              <button
                type="button"
                className={`tab-btn${activeTab === 'invoice' ? ' active' : ''}`}
                onClick={() => setActiveTab('invoice')}
              >
                Payment Receipt
              </button>
            </div>

            <div className="card-img-wrapper">
              {activeTab === 'card' ? (
                <img
                  id="idCardImage"
                  src={cardUrl + cacheBuster}
                  alt="Digital ID Card"
                />
              ) : (
                <img
                  id="invoiceImage"
                  src={invoiceUrl + cacheBuster}
                  alt="Payment Receipt"
                />
              )}
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <a
                id="downloadCardBtn"
                href={activeTab === 'card' ? cardUrl : invoiceUrl}
                download={activeTab === 'card' ? `${studentId}_id_card.png` : `${studentId}_invoice.png`}
                className="btn-download"
                style={{ flex: 1 }}
              >
                <i className="fa-solid fa-download"></i> Download {activeTab === 'card' ? 'Card' : 'Receipt'}
              </a>
              <button
                type="button"
                className="btn-close-modal-done"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.05)',
                  border: '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  color: 'var(--color-text-main)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
                }}
              >
                <i className="fa-solid fa-check"></i> Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
