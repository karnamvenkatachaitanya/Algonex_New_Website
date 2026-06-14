import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Spin, Result, Tag } from 'antd';
import { CheckCircleFilled, DownloadOutlined, HomeOutlined } from '@ant-design/icons';
import algonexLogo from '../Public/algonex_logo.png';
import ceoSign from '../Public/CEO Sign.png';
import algonexStamp from '../Public/Algonex Stamp.png';

const CertificateVerification = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        // Request backend API
        const response = await axios.get(`/api/v1/certificates/${id}/`);
        setCertificate(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err.response?.status === 404 ? 'Certificate not found' : 'Failed to fetch certificate');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCertificate();
    }
  }, [id]);

  const handleDownloadPDF = () => {
    const element = certificateRef.current;
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Algonex_Certificate_${certificate.certificate_id}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Dynamically load html2pdf.js if not already present
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        window.html2pdf().set(opt).from(element).save();
      };
      document.body.appendChild(script);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <Spin size="large" />
        <span style={{ color: '#666', fontFamily: 'sans-serif' }}>Verifying Certificate Authenticity...</span>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: 600, margin: '0 auto' }}>
        <Result
          status="warning"
          title="Certificate Verification Failed"
          subTitle={
            <div style={{ fontSize: 16, marginTop: 12 }}>
              <p>The Certificate ID <strong>{id}</strong> could not be verified.</p>
              <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Reason: {error || 'No matching record found.'}</p>
              <p style={{ fontSize: 14, color: '#888', marginTop: 12 }}>
                If you believe this is an error, please contact Algonex support with your Certificate ID.
              </p>
            </div>
          }
          extra={[
            <Link to="/" key="home">
              <Button type="primary" icon={<HomeOutlined />}>Go to Home</Button>
            </Link>
          ]}
        />
      </div>
    );
  }

  // Parse tools list
  const toolsList = certificate.worked_tools
    ? certificate.worked_tools.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  // Verification URL to put in QR Code
  const verificationUrl = `${window.location.origin}/verify/Certificate/ID=${certificate.certificate_id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <div style={{ 
      backgroundColor: '#f5f7fa', 
      minHeight: '100vh', 
      padding: '40px 20px',
      fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      {/* Styles for Google Fonts and PDF Print Customization */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        
        .verify-card {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          border: 1px solid #e1e8ed;
          background-color: #ffffff;
        }

        .cert-container-outer {
          max-width: 1100px;
          margin: 40px auto 0 auto;
          overflow-x: auto;
          padding-bottom: 20px;
        }

        /* Certificate Core Layout (1123px x 794px is exact A4 landscape ratio) */
        .cert-canvas {
          width: 1123px;
          height: 794px;
          position: relative;
          background-color: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          box-sizing: border-box;
          padding: 40px 50px;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Abstract waves background shapes to mimic mockup */
        .cert-wave-bg-1 {
          position: absolute;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224,247,250,0.6) 0%, rgba(224,247,250,0.1) 70%);
          bottom: -400px;
          left: -300px;
          z-index: 1;
        }

        .cert-wave-bg-2 {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(227,242,253,0.5) 0%, rgba(227,242,253,0.1) 70%);
          top: -300px;
          right: -250px;
          z-index: 1;
        }

        /* Wavy overlay gradient */
        .cert-gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(224,242,241,0.2) 0%, rgba(240,244,248,0.2) 100%);
          z-index: 2;
        }

        /* Corner Decorative Polygon Triangles */
        .corner-triangle {
          position: absolute;
          width: 0;
          height: 0;
          z-index: 3;
        }

        /* Top-Left Corners */
        .corner-tl-yellow {
          top: 0;
          left: 0;
          border-top: 60px solid #fbc02d;
          border-right: 60px solid transparent;
        }
        .corner-tl-pink {
          top: 0;
          left: 0;
          border-top: 45px solid #e91e63;
          border-right: 45px solid transparent;
        }

        /* Bottom-Left Corners */
        .corner-bl-pink {
          bottom: 0;
          left: 0;
          border-bottom: 60px solid #e91e63;
          border-right: 60px solid transparent;
        }

        /* Bottom-Right Corners */
        .corner-br-pink {
          bottom: 0;
          right: 0;
          border-bottom: 60px solid #e91e63;
          border-left: 60px solid transparent;
        }
        .corner-br-yellow {
          bottom: 0;
          right: 30px;
          border-bottom: 45px solid #fbc02d;
          border-left: 45px solid transparent;
        }

        /* Fonts styling */
        .font-sans-bold {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
        }

        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        .font-cursive {
          font-family: 'Alex Brush', cursive;
        }
      `}} />

      {/* Verification Summary Portal Header */}
      <div style={{ maxWidth: 1123, margin: '0 auto' }}>
        <Card className="verify-card" style={{ padding: 10 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 48 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1f1f1f' }}>Verified Certificate</h1>
                  <Tag color="success" style={{ fontWeight: 'bold', fontSize: 13, padding: '2px 10px' }}>✓ Authentic</Tag>
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 15 }}>
                  This official document ID <strong>{certificate.certificate_id}</strong> is verified as valid and issued by Algonex.
                </p>
              </div>
            </div>

            <Button 
              type="primary" 
              size="large" 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadPDF}
              style={{ 
                height: 48,
                borderRadius: 8,
                fontWeight: 600,
                backgroundColor: '#1677ff',
                boxShadow: '0 4px 10px rgba(22, 119, 255, 0.2)'
              }}
            >
              Download PDF Certificate
            </Button>
          </div>
        </Card>
      </div>

      {/* Pixel-Perfect Certificate Canvas Container */}
      <div className="cert-container-outer">
        <div 
          id="certificate-print-area" 
          className="cert-canvas" 
          ref={certificateRef}
          style={{ 
            zIndex: 10,
            fontFamily: '"Outfit", sans-serif'
          }}
        >
          {/* Background shapes */}
          <div className="cert-wave-bg-1"></div>
          <div className="cert-wave-bg-2"></div>
          <div className="cert-gradient-overlay"></div>

          {/* Corner Polygon overlays */}
          <div className="corner-triangle corner-tl-yellow"></div>
          <div className="corner-triangle corner-tl-pink"></div>
          <div className="corner-triangle corner-bl-pink"></div>
          <div className="corner-triangle corner-br-pink"></div>
          <div className="corner-triangle corner-br-yellow"></div>

          {/* Certificate Content Wrapper */}
          <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              
              {/* Intern ID */}
              <div style={{ fontSize: 13, color: '#333', marginTop: 10 }}>
                <div style={{ fontWeight: 400 }}>Intern ID:</div>
                <div className="font-sans-bold" style={{ fontSize: 15, letterSpacing: '0.5px' }}>
                  {certificate.intern_id || 'N/A'}
                </div>
              </div>

              {/* Company Logo & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: -20 }}>
                <img src={algonexLogo} alt="Algonex" style={{ height: 44, objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
                  <div className="font-sans-bold" style={{ fontSize: 22, color: '#000', letterSpacing: '1px', lineHeight: '1.1' }}>
                    ALGONEX IT SOLUTIONS
                  </div>
                  <div style={{ fontSize: 8, color: '#555', letterSpacing: '0.8px', fontWeight: 600 }}>
                    MAIN BRANCH AT MARATHAHALLI, BENGALURU-560037
                  </div>
                </div>
              </div>

              {/* Excellence of Spark Badge */}
              <div style={{ 
                position: 'relative', 
                background: 'linear-gradient(135deg, #d4af37, #aa7c11)',
                padding: '8px 16px',
                borderRadius: '4px',
                color: '#fff',
                fontSize: 10,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(170,124,17,0.3)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                minWidth: 120
              }}>
                <div style={{ textTransform: 'uppercase', fontSize: 9 }}>Excellence</div>
                <div style={{ fontSize: 11, fontWeight: 800 }}>of {certificate.badge_text || 'SPARK'}</div>
                {/* Ribbon tails */}
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 10,
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '8px solid #aa7c11'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  right: 10,
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '8px solid #aa7c11'
                }}></div>
              </div>
            </div>

            {/* Middle Section (Title & Cursive Certification) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '4.5fr 1px 5.5fr', 
              alignItems: 'center', 
              gap: 30,
              marginTop: 20
            }}>
              {/* Left Column: Course/Internship Title */}
              <div style={{ textAlign: 'right', paddingRight: 10 }}>
                <h2 className="font-sans-bold" style={{ 
                  fontSize: 34, 
                  color: '#091e42', 
                  lineHeight: '1.15',
                  margin: 0,
                  textTransform: 'uppercase',
                  whiteSpace: 'pre-line',
                  letterSpacing: '1px'
                }}>
                  {certificate.title}
                </h2>
              </div>

              {/* Center Divider Line */}
              <div style={{ height: 110, backgroundColor: '#b3bac5', width: '100%' }}></div>

              {/* Right Column: "Certification Of Internship" */}
              <div style={{ paddingLeft: 10, textAlign: 'left' }}>
                <div className="font-cursive" style={{ 
                  fontSize: 72, 
                  color: '#091e42', 
                  lineHeight: '0.7', 
                  marginBottom: 10 
                }}>
                  Certification
                </div>
                <div className="font-serif" style={{ 
                  fontSize: 32, 
                  fontWeight: 800, 
                  color: '#091e42',
                  letterSpacing: '0.5px' 
                }}>
                  {certificate.certificate_type || 'Of Internship'}
                </div>
              </div>
            </div>

            {/* Awarded To Name */}
            <div style={{ textAlign: 'center', marginTop: 15 }}>
              <div style={{ fontSize: 15, color: '#444', letterSpacing: '0.5px', marginBottom: 4 }}>
                This certificate is awarded to
              </div>
              <div style={{ position: 'relative', display: 'inline-block', minWidth: '400px' }}>
                <div className="font-serif" style={{ 
                  fontSize: 38, 
                  fontWeight: 800, 
                  color: '#091e42',
                  paddingBottom: 2,
                  fontStyle: 'italic'
                }}>
                  {certificate.student_name}
                </div>
                {/* Thin underline style */}
                <div style={{ height: '1px', backgroundColor: '#333', width: '100%', position: 'absolute', bottom: 0, left: 0 }}></div>
              </div>
            </div>

            {/* Description Text */}
            <div style={{ textAlign: 'center', maxWidth: 850, margin: '15px auto 0 auto', padding: '0 20px' }}>
              <p style={{ 
                fontSize: 14, 
                color: '#333', 
                lineHeight: '1.6', 
                margin: 0,
                fontWeight: 500,
                letterSpacing: '0.2px' 
              }}>
                {certificate.description}
              </p>
            </div>

            {/* Tools Section */}
            {toolsList.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 15 }}>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 600 }}>
                  He/she worked with Tools such as
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {toolsList.map((tool, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        border: '1px solid #333', 
                        borderRadius: '6px', 
                        padding: '5px 16px', 
                        fontSize: 12, 
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: '#091e42'
                      }}
                    >
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#333', fontStyle: 'italic' }}>
              We appreciate the efforts and all the best for the future.
            </div>

            {/* Footer Row (Signatures, QR Code, Stamps) */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-end', 
              marginTop: 15,
              padding: '0 10px'
            }}>
              
              {/* Left Side: CEO Sign & ID */}
              <div style={{ textAlign: 'left', minWidth: 200, zIndex: 12 }}>
                <div style={{ height: 45, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  <img src={ceoSign} alt="CEO Signature" style={{ height: 40, objectFit: 'contain' }} />
                </div>
                <div style={{ height: '1px', backgroundColor: '#333', width: '180px', marginBottom: 4 }}></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1f1f1f' }}>
                  Founder, CEO of ALGONEX
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 6, fontWeight: 600 }}>
                  Certificate ID: <span className="font-sans-bold" style={{ color: '#333' }}>{certificate.certificate_id}</span>
                </div>
              </div>

              {/* Center Side: QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 12 }}>
                <div style={{ 
                  border: '1px solid #e1e8ed', 
                  padding: 4, 
                  backgroundColor: '#fff',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <img src={qrCodeUrl} alt="Verification QR Code" style={{ width: 68, height: 68 }} />
                </div>
              </div>

              {/* Right Side: MSME & Algonex Stamp */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                gap: 20, 
                position: 'relative',
                minWidth: 220,
                justifyContent: 'flex-end',
                zIndex: 12
              }}>
                {/* Certified by MSME */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 2 }}>
                  {/* Ashoka Chakra vector / government style emblem */}
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#b8860b" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="7" stroke="#b8860b" strokeWidth="0.8" />
                    <circle cx="12" cy="12" r="1.5" fill="#b8860b" />
                    {/* Spokes */}
                    {[...Array(24)].map((_, i) => {
                      const angle = (i * 360) / 24;
                      return (
                        <line 
                          key={i}
                          x1="12" 
                          y1="12" 
                          x2={12 + 7 * Math.cos((angle * Math.PI) / 180)} 
                          y2={12 + 7 * Math.sin((angle * Math.PI) / 180)} 
                          stroke="#b8860b" 
                          strokeWidth="0.5" 
                        />
                      );
                    })}
                  </svg>
                  <div style={{ fontWeight: 800, fontSize: 12, color: '#333', letterSpacing: '0.5px', marginTop: 2, lineHeight: 1 }}>
                    MSME
                  </div>
                  <div style={{ fontSize: 9, color: '#555', fontWeight: 600, marginTop: 2 }}>
                    Certified by MSME
                  </div>
                </div>

                {/* Stamp */}
                <div style={{ 
                  position: 'absolute',
                  right: -10,
                  bottom: -10,
                  opacity: 0.95,
                  pointerEvents: 'none',
                  zIndex: 15
                }}>
                  <img src={algonexStamp} alt="Algonex Stamp" style={{ width: 95, height: 95, objectFit: 'contain' }} />
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Info message below certificate preview */}
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#666' }}>
        <p>This is a digital copy of the authentic certificate issued by Algonex IT Solutions.</p>
        <p>The QR Code embedded within the certificate dynamically links back to this page for validation.</p>
      </div>

    </div>
  );
};

export default CertificateVerification;
