import { useEffect, useRef, useMemo } from 'react';
import FormField from './FormField';

const UPI_ID = 'pasalaganesh38-1@okhdfcbank';
const UPI_PAYEE_NAME = 'Ganesh Pasala';

const BATCH_PRICING = {
  Training: { amount: 25000, label: '₹25,000.00' },
  Internship: { amount: 10000, label: '₹10,000.00' },
  Fellowship: { amount: 15000, label: '₹15,000.00' },
};

const PaymentGateway = ({
  formData,
  errors,
  onChange,
  shake,
  studentId,
  isQrRevealed,
  onPayNow,
}) => {
  const qrRef = useRef(null);
  const qrInstanceRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Build dynamic transaction note from student name + student ID + batch type
  const transactionNote = useMemo(() => {
    const name = formData.fullName.trim().replace(/\s+/g, '_') || 'Student';
    const id = studentId || 'ALGXXXXXXXXXXXX';
    const batch = formData.batchType || 'Training';
    return `${name}_${id}_Type(${batch})`;
  }, [formData.fullName, studentId, formData.batchType]);

  // Build dynamic UPI URI
  const upiUri = useMemo(() => {
    const encodedName = encodeURIComponent(UPI_PAYEE_NAME);
    const encodedNote = encodeURIComponent(transactionNote);
    const amount = Number(formData.paidFee || 0);
    return `upi://pay?pa=${UPI_ID}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
  }, [transactionNote, formData.paidFee]);

  // Generate QR code whenever the URI changes and isQrRevealed is true
  useEffect(() => {
    if (!isQrRevealed) return;

    const generateQR = () => {
      if (qrRef.current && window.QRCode) {
        qrRef.current.innerHTML = '';
        try {
          qrInstanceRef.current = new window.QRCode(qrRef.current, {
            text: upiUri,
            width: 200,
            height: 200,
            colorDark: '#1a0533',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.M,
          });
        } catch (err) {
          console.error('Failed to generate QR code:', err);
          qrRef.current.innerHTML =
            "<p style='color:#ef4444; font-size:12px; padding:20px;'>QR Code Error</p>";
        }
      }
    };

    if (window.QRCode) {
      generateQR();
      return;
    }

    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = generateQR;
      document.head.appendChild(script);
    }
  }, [upiUri, isQrRevealed]);

  return (
    <section className={`form-card glass-card payment-section${shake ? ' shake' : ''}`}>
      <div className="card-header">
        <div className="header-icon payment-icon">
          <i className="fa-solid fa-indian-rupee-sign"></i>
        </div>
        <div>
          <h2>Section C: Payment Gateway</h2>
          <p className="card-header-sub">Complete your fee payment to finalize registration</p>
        </div>
      </div>

      {/* Personalized Invoice Banner */}
      <div className="payment-student-banner">
        <div className="banner-avatar">
          <i className="fa-solid fa-user-graduate"></i>
        </div>
        <div className="banner-info">
          <span className="banner-name">{formData.fullName || 'Student'}</span>
          <span className="banner-detail">
            {formData.courseSelected || 'Course'} • {formData.batchType || 'Batch'} Program
          </span>
        </div>
        <div className="banner-amount-badge">
          <span className="badge-label">Total Fee</span>
          <span className="badge-amount">
            ₹{Number(formData.totalFee || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <div className="payment-layout">
        {/* Left: QR Code or Pay Now placeholder */}
        <div className="payment-qr-column">
          {isQrRevealed ? (
            <div className="qr-card animate-fade-in">
              <div className="qr-glow-wrapper">
                <div ref={qrRef} id="qrcode" className="qr-canvas"></div>
              </div>
              <div className="qr-details">
                <span className="qr-scan-label">
                  <i className="fa-solid fa-qrcode"></i> Scan to Pay
                </span>
                <div className="qr-upi-info">
                  <span className="qr-upi-name">{UPI_PAYEE_NAME}</span>
                  <span className="qr-upi-id">{UPI_ID}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="qr-placeholder-card">
              <div className="qr-placeholder-icon-wrapper">
                <i className="fa-solid fa-qrcode placeholder-qr-icon"></i>
                <i className="fa-solid fa-lock placeholder-lock-badge"></i>
              </div>
              <h3>Scan QR Code</h3>
              <p>Click below to generate your unique student ID and QR payment code.</p>
              <button
                type="button"
                className="btn-pay-now"
                onClick={onPayNow}
              >
                <i className="fa-solid fa-bolt"></i> Pay Now
              </button>
            </div>
          )}
        </div>

        {/* Right: Invoice Details */}
        <div className="payment-invoice-column">
          <div className="payment-invoice">
            <h3 className="payment-sub-title">
              <i className="fa-solid fa-file-invoice"></i> Invoice Details
            </h3>

            <div className="invoice-row">
              <span className="inv-label">Student Name</span>
              <span className="inv-val">{formData.fullName || '—'}</span>
            </div>
            <div className="invoice-row">
              <span className="inv-label">Program</span>
              <span className="inv-val">{formData.batchType || '—'}</span>
            </div>
            <div className="invoice-row">
              <span className="inv-label">Course</span>
              <span className="inv-val inv-val-small">{formData.courseSelected || '—'}</span>
            </div>
            <div className="invoice-row">
              <span className="inv-label">Joining Date</span>
              <span className="inv-val">
                {formData.joiningDate
                  ? new Date(formData.joiningDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>

            <div className="invoice-divider"></div>

            <div className="invoice-row">
              <span className="inv-label">Transaction Note</span>
              <span className="inv-val code-style">{transactionNote}</span>
            </div>

            <div className="invoice-row">
              <span className="inv-label">Total Course Fee</span>
              <span className="inv-val">
                ₹{Number(formData.totalFee || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="invoice-row invoice-input-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="inv-label required">Amount to Pay Now</span>
                <div className="invoice-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>₹</span>
                  <input
                    type="number"
                    name="paidFee"
                    id="paidFee"
                    className="invoice-input"
                    style={{ paddingLeft: '24px', width: '140px' }}
                    value={formData.paidFee}
                    onChange={onChange}
                    placeholder="e.g. 10000"
                    required
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
              {errors.paidFee && (
                <span className="error-msg invoice-error" style={{ display: 'block', fontSize: '11px', color: '#f43f5e', textAlign: 'right', marginTop: '2px', width: '100%', animation: 'slideDown 0.2s ease forwards' }}>
                  {errors.paidFee}
                </span>
              )}
            </div>

            <div className="invoice-total-row">
              <span className="inv-total-label">Balance Amount</span>
              <span className="inv-total-amount" style={{ fontSize: '20px' }}>
                ₹{Number((formData.totalFee || 0) - (formData.paidFee || 0)).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="payment-alert">
            <i className="fa-solid fa-shield-halved"></i>
            <p>
              Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.).
              After payment, enter the transaction reference ID below.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction ID Input - Only visible after QR is revealed */}
      {isQrRevealed && (
        <div className="upi-input-container animate-fade-in">
          <FormField
            id="upiTransactionId"
            name="upiTransactionId"
            label="UPI Transaction ID / Ref No."
            icon="fa-solid fa-hashtag"
            value={formData.upiTransactionId}
            onChange={onChange}
            error={errors.upiTransactionId}
            required
            placeholder="12-digit alphanumeric/numeric transaction ID"
            maxLength={24}
          />
        </div>
      )}
    </section>
  );
};

export default PaymentGateway;
