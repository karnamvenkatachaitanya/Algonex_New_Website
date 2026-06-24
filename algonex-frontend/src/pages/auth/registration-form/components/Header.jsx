import algonexLogo from '../../../../Public/algonex_logo.png';

const Header = () => {
  return (
    <header className="main-header">
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
        <img
          src={algonexLogo}
          alt="Algonex"
          style={{ height: '45px' }}
        />
        <div className="logo-text-wrapper" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.05', textAlign: 'left' }}>
          <span className="logo-main" style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#000000',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            ALGONEX
          </span>
          <span className="logo-sub" style={{
            fontSize: '21px',
            fontWeight: 600,
            color: '#000000',
            letterSpacing: '0.3px',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            opacity: 1
          }}>
            IT Solutions
          </span>
        </div>
      </div>
      <h1 className="neon-title" style={{ marginTop: '16px' }}>Student Registration</h1>
      <p className="subtitle">
        Enroll in our state-of-the-art AI-driven courses and kickstart your IT career.
      </p>
    </header>
  );
};

export default Header;
