const Header = () => {
  return (
    <header className="main-header">
      <div className="logo-container">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '42px', height: '42px' }}>
          <path d="M12 2L2 22H7L12 11L17 22H22L12 2Z" fill="url(#algonexGrad)" />
          <path d="M8.5 18H15.5L12 11L8.5 18Z" fill="#ffffff" opacity="0.25" />
          <defs>
            <linearGradient id="algonexGrad" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#f97316" />
              <stop offset="30%" stop-color="#ef4444" />
              <stop offset="70%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="logo-text-wrapper">
          <span className="logo-main">ALGONEX</span>
          <span className="logo-sub">IT SOLUTIONS</span>
        </div>
      </div>
      <h1 className="neon-title">Student Registration</h1>
      <p className="subtitle">
        Enroll in our state-of-the-art AI-driven courses and kickstart your IT career.
      </p>
    </header>
  );
};

export default Header;
