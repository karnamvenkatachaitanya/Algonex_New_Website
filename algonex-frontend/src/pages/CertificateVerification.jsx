import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Card, Button, Spin, Result, Tag } from 'antd';
import { CheckCircleFilled, DownloadOutlined, HomeOutlined } from '@ant-design/icons';
import algonexLogo from '../Public/algonex_logo.png';
import ceoSign from '../Public/CEO Sign.png';
import algonexStamp from '../Public/Algonex Stamp.png';
import msmeLogo from '../Public/MSME.png';

const CertificateVerification = () => {
  let { id } = useParams();
  if (id && id.startsWith('ID=')) {
    id = id.substring(3);
  }
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        // Request backend API
        const response = await apiClient.get(`/certificates/${id}/`);
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

  // Verification URL to put in QR Code (pointing to production server for public scanning)
  const verificationUrl = `https://algonex.co.in/verify/Certificate/ID=${certificate.certificate_id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  // Parse badge text dynamically (e.g. "EXCELLENCE of SPARK" or "STAR OF THE MONTH")
  const badgeText = certificate.badge_text || "EXCELLENCE of SPARK";
  let badgeLine1 = "EXCELLENCE";
  let badgeLine2 = "of SPARK";
  if (badgeText) {
    const words = badgeText.trim().split(/\s+/);
    if (words.length > 1) {
      badgeLine1 = words[0].toUpperCase();
      badgeLine2 = words.slice(1).join(' ');
    } else if (words.length === 1 && words[0]) {
      badgeLine1 = "EXCELLENCE";
      badgeLine2 = `of ${words[0]}`;
    }
  }

  return (
    <div style={{
      backgroundColor: '#f5f7fa',
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      {/* Styles for Google Fonts and PDF Print Customization */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        
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
          font-family: 'Great Vibes', cursive;
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
                  This official document ID <strong>{certificate.certificate_id}</strong> is verified as valid and issued by Algonex IT Solutions.
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
            fontFamily: '"Outfit", sans-serif',
            position: 'relative'
          }}
        >
          {/* Vector SVG Background Waves and Geometric Corner Ornaments */}
          <svg
            width="1123"
            height="794"
            viewBox="0 0 1123 794"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              width: 'calc(100% + 4px)',
              height: 'calc(100% + 4px)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            {/* Gradients definitions for high-fidelity waves */}
            <defs>
              <linearGradient id="wave1Grad" x1="0" y1="794" x2="1123" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e0f7fa" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#e3f2fd" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="wave2Grad" x1="1123" y1="794" x2="0" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ede7f6" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#e0f7fa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="cornerPink" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e91e63" />
                <stop offset="100%" stopColor="#c2185b" />
              </linearGradient>
              <linearGradient id="cornerTeal" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00bcd4" />
                <stop offset="100%" stopColor="#0097a7" />
              </linearGradient>
            </defs>

            {/* Soft Organic Background Waves */}
            <path
              d="M -5,320 C 350,450 480,280 850,530 C 1020,640 1000,450 1128,490 L 1128,799 L -5,799 Z"
              fill="url(#wave1Grad)"
            />
            <path
              d="M 1128,220 C 850,300 720,150 400,380 C 180,540 220,380 -5,420 L -5,-5 L 1128,-5 Z"
              fill="url(#wave2Grad)"
            />
            <path
              d="M -5,550 C 250,680 500,500 850,700 C 950,760 1020,720 1128,799 L -5,799 Z"
              fill="#e0f2f1"
              opacity="0.35"
            />

            {/* Geometric Top-Left Corner */}
            <polygon points="-5,-5 42,-5 42,42 -5,42" fill="#fbc02d" />
            <polygon points="-5,42 85,-5 135,-5 -5,135" fill="url(#cornerPink)" />
            <polygon points="-5,135 135,-5 175,-5 -5,175" fill="url(#cornerTeal)" />

            {/* Geometric Bottom-Left Corner */}
            <polygon points="-5,799 75,799 -5,724" fill="url(#cornerPink)" />
            <polygon points="-5,724 75,799 110,799 -5,684" fill="url(#cornerTeal)" opacity="0.6" />

            {/* Geometric Bottom-Right Corner */}
            <polygon points="1128,799 1083,799 1083,754 1128,754" fill="#fbc02d" />
            <polygon points="1128,754 1038,799 988,799 1128,659" fill="url(#cornerPink)" />
            <polygon points="1128,659 988,799 948,799 1128,619" fill="url(#cornerTeal)" />
          </svg>

          {/* Certificate Content Wrapper */}
          <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

              {/* Intern ID */}
              <div style={{ fontSize: 13, color: '#333', marginTop: 15, marginLeft: 80 }}>
                <div style={{ fontWeight: 500, color: '#555' }}>Intern ID:</div>
                <div className="font-sans-bold" style={{ fontSize: 16, color: '#000', letterSpacing: '0.5px', marginTop: 2 }}>
                  {certificate.intern_id || 'N/A'}
                </div>
              </div>

              {/* Company Logo & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
                <img src={algonexLogo} alt="Algonex Logo" style={{ height: 48, objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div className="font-sans-bold" style={{ fontSize: 24, color: '#000', letterSpacing: '0.8px', lineHeight: '1.1' }}>
                    ALGONEX IT SOLUTIONS
                  </div>
                  <div style={{ fontSize: 8.5, color: '#555', letterSpacing: '0.8px', fontWeight: 700, marginTop: 3 }}>
                    MAIN BRANCH AT MARATHAHALLI, BENGALURU-560037
                  </div>
                </div>
              </div>

              {/* Excellence of Spark Ribbon (SVG Vector) */}
              <div style={{ marginRight: 15 }}>
                <svg width="180" height="70" viewBox="0 0 180 70" style={{ marginTop: -5 }}>
                  <defs>
                    <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3a13c" />
                      <stop offset="50%" stopColor="#c58619" />
                      <stop offset="100%" stopColor="#f3a13c" />
                    </linearGradient>
                  </defs>
                  {/* Swallow-tail ribbon banner */}
                  <path
                    d="M 15 10 L 0 35 L 15 60 L 165 60 L 180 35 L 165 10 Z"
                    fill="url(#goldRibbonGrad)"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
                  />
                  {/* White dashed border inside ribbon */}
                  <path
                    d="M 18 14 L 6 35 L 18 56 L 162 56 L 174 35 L 162 14 Z"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                  {/* Ribbon text */}
                  <text 
                    x="90" 
                    y="28" 
                    fill="#ffffff" 
                    fontSize="9.5" 
                    fontWeight="700" 
                    textAnchor="middle" 
                    fontFamily="'Outfit', sans-serif" 
                    letterSpacing="1"
                  >
                    {badgeLine1}
                  </text>
                  <text 
                    x="90" 
                    y="47" 
                    fill="#ffffff" 
                    fontSize="13" 
                    fontStyle="italic" 
                    textAnchor="middle" 
                    fontFamily="'Playfair Display', serif" 
                    fontWeight="600"
                  >
                    {badgeLine2}
                  </text>
                </svg>
              </div>
            </div>

            {/* Middle Section (Title & Cursive Certification) */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 35,
              marginTop: 15
            }}>
              {/* Left Column: Course/Internship Title (Right-aligned, positioned flush next to divider) */}
              <div style={{ textAlign: 'right', width: '380px', paddingRight: '20px' }}>
                <h2 className="font-sans-bold" style={{
                  fontSize: 32,
                  color: '#091e42',
                  lineHeight: '1.15',
                  margin: 0,
                  textTransform: 'uppercase',
                  whiteSpace: 'pre-line',
                  letterSpacing: '0.8px'
                }}>
                  {certificate.title}
                </h2>
              </div>

              {/* Center Divider Line */}
              <div style={{ height: 110, backgroundColor: '#b3bac5', width: '1.5px' }}></div>

              {/* Right Column: "Certification Of Internship" */}
              <div style={{ width: '380px', textAlign: 'left', paddingLeft: '20px' }}>
                <div className="font-cursive" style={{
                  fontSize: 76,
                  color: '#091e42',
                  lineHeight: '0.75',
                  marginBottom: 8
                }}>
                  Certification
                </div>
                <div className="font-serif" style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#091e42',
                  letterSpacing: '0.5px'
                }}>
                  {(() => {
                    const type = certificate.certificate_type || 'Of Internship';
                    return type.toLowerCase().startsWith('certification ')
                      ? type.substring(13).trim()
                      : type;
                  })()}
                </div>
              </div>
            </div>

            {/* Awarded To Name */}
            <div style={{ textAlign: 'center', marginTop: 15 }}>
              <div style={{ fontSize: 15, color: '#444', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 500 }}>
                This certificate is awarded to
              </div>
              <div style={{ position: 'relative', display: 'inline-block', minWidth: '460px' }}>
                <div className="font-serif" style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: '#091e42',
                  paddingBottom: 6,
                  fontStyle: 'italic'
                }}>
                  {certificate.student_name}
                </div>
                {/* Thin underline style */}
                <div style={{ height: '1px', backgroundColor: '#333', width: '100%', position: 'absolute', bottom: 0, left: 0 }}></div>
              </div>
            </div>

            {/* Description Text */}
            <div style={{ textAlign: 'center', maxWidth: 880, margin: '15px auto 0 auto', padding: '0 30px' }}>
              <p style={{
                fontSize: 14.5,
                color: '#222',
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
                <div style={{ fontSize: 13.5, color: '#444', marginBottom: 8, fontWeight: 600 }}>
                  He/she worked with Tools such as
                </div>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {toolsList.map((tool, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: '1.2px solid #222',
                        borderRadius: '8px',
                        padding: '5px 16px',
                        fontSize: 13,
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

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: '#333', fontStyle: 'italic', fontWeight: 500 }}>
              We appreciate the efforts and all the best for the future.
            </div>

            {/* Footer Row (Signatures, QR Code, MSME, Stamp) - equally spaced with symmetric margins */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: 15,
              padding: '0 55px 10px 55px'
            }}>

              {/* Left Side: CEO Sign & ID */}
              <div style={{ textAlign: 'left', width: '220px', zIndex: 12 }}>
                <div style={{ height: 45, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  <img src={ceoSign} alt="CEO Signature" style={{ height: 42, objectFit: 'contain' }} />
                </div>
                <div style={{ height: '1px', backgroundColor: '#333', width: '180px', marginBottom: 6 }}></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1f1f1f' }}>
                  Founder, CEO of ALGONEX
                </div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 600 }}>
                  Certificate ID: <span className="font-sans-bold" style={{ color: '#000' }}>{certificate.certificate_id}</span>
                </div>
              </div>

              {/* Center-Left: QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 12, width: '220px' }}>
                <div style={{
                  border: '1.5px solid #222',
                  padding: 4,
                  backgroundColor: '#fff',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <img src={qrCodeUrl} alt="Verification QR Code" style={{ width: 72, height: 72 }} />
                </div>
              </div>

              {/* Center-Right: MSME certified block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 12, width: '220px' }}>
                <img src={msmeLogo} alt="Certified by MSME" style={{ height: 75, objectFit: 'contain' }} />
                <div style={{ fontSize: 11.5, color: '#333', fontWeight: 700, marginTop: 6 }}>
                  Certified by MSME
                </div>
              </div>

              {/* Right Side: Algonex Stamp */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 12, width: '220px' }}>
                <img 
                  src={algonexStamp} 
                  alt="Algonex Stamp" 
                  style={{ 
                    width: 130, 
                    height: 130, 
                    objectFit: 'contain',
                    marginBottom: -25
                  }} 
                />
                <div style={{ 
                  fontSize: 11.5, 
                  color: '#333', 
                  fontWeight: 700, 
                  marginTop: 6, 
                  letterSpacing: '0.5px',
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}>
                  algonex.co.in
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Attractive Explore Courses Call-to-Action Section */}
      <div style={{
        maxWidth: 1100,
        margin: '50px auto 20px auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '40px 50px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '30px'
        }}>
          {/* Background decorative glowing circles */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 70%)',
            top: '-150px',
            right: '-50px',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0) 70%)',
            bottom: '-120px',
            left: '20%',
            pointerEvents: 'none'
          }}></div>

          {/* Left Side: Headline & Copy */}
          <div style={{ flex: '1 1 500px', zIndex: 2 }}>
            <span style={{
              background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'block',
              marginBottom: '12px'
            }}>
              Launch Your Career
            </span>
            <h2 style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 800,
              margin: '0 0 12px 0',
              fontFamily: '"Outfit", sans-serif',
              lineHeight: '1.3'
            }}>
              Ready to build real-world tech skills?
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '15.5px',
              margin: 0,
              lineHeight: '1.6',
              fontWeight: 400
            }}>
              Join Algonex IT Solutions. Explore our industry-accredited courses in AI, Software Engineering, Marketing, and Data Science to kickstart your professional journey today.
            </p>
          </div>

          {/* Right Side: CTA Button */}
          <div style={{ zIndex: 2 }}>
            <Link to="/courses">
              <button 
                style={{
                  background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  outline: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(90deg, #0391d6 0%, #0284c7 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(2, 132, 199, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)';
                }}
              >
                Explore All Courses
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </Link>
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
