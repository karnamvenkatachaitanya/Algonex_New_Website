import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Dropdown, Button, Drawer } from 'antd';
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/allcourses', label: 'Courses' },
  { to: '/programs', label: 'Programs' },
  { to: '/events', label: 'Events' },
  { to: '/careers', label: 'Careers' },
  { to: '/aboutus', label: 'About' },
  { to: '/alumni', label: 'Alumni' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDrawerOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const dropdownItems = {
    items: [
      { key: 'profile', label: <Link to="/profile">Profile</Link> },
      { key: 'my-courses', label: <Link to="/my-courses">My Courses</Link> },
      { key: 'my-events', label: <Link to="/my-events">My Events</Link> },
      { key: 'my-applications', label: <Link to="/my-applications">My Applications</Link> },
      { type: 'divider' },
      { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
    ],
  };

  const drawerLinkStyle = (path) => ({
    padding: '14px 24px',
    color: isActive(path) ? '#00B4D8' : '#333',
    textDecoration: 'none',
    fontWeight: isActive(path) ? 600 : 500,
    fontSize: 16,
    borderBottom: '1px solid #f5f5f5',
    background: isActive(path) ? '#f0fbff' : 'transparent',
    display: 'block',
  });

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <nav style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img
            src="https://ik.imagekit.io/ipo22webapp/Picture1.png?updatedAt=1759509431158"
            alt="Algonex"
            style={{ height: 36 }}
          />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', letterSpacing: -0.5 }}>
            Algonex
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul style={{
          display: 'flex', alignItems: 'center', gap: 4, listStyle: 'none', margin: 0, padding: 0,
        }} className="desktop-nav">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                style={{
                  color: isActive(link.to) ? '#00B4D8' : '#555',
                  textDecoration: 'none',
                  fontWeight: isActive(link.to) ? 600 : 500,
                  fontSize: 14,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: isActive(link.to) ? 'rgba(0,180,216,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li style={{ marginLeft: 8 }}>
            {isAuthenticated ? (
              <Dropdown menu={dropdownItems} placement="bottomRight">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '4px 12px 4px 4px', borderRadius: 24,
                  border: '1px solid #e8e8e8', transition: 'all 0.2s',
                }}>
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    src={user?.avatar}
                    style={{ backgroundColor: '#00B4D8' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#333', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.first_name || 'Account'}
                  </span>
                </div>
              </Dropdown>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/signin">
                  <Button style={{ borderRadius: 8 }}>Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button type="primary" style={{ borderRadius: 8 }}>Sign Up</Button>
                </Link>
              </div>
            )}
          </li>
        </ul>

        {/* Mobile Hamburger */}
        <div className="mobile-nav-trigger">
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title={
            <Link to="/" onClick={() => setDrawerOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="https://ik.imagekit.io/ipo22webapp/Picture1.png?updatedAt=1759509431158" alt="Algonex" style={{ height: 28 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Algonex</span>
            </Link>
          }
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={300}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setDrawerOpen(false)} style={drawerLinkStyle(link.to)}>
                {link.label}
              </Link>
            ))}

            <div style={{ height: 1, background: '#e8e8e8', margin: '8px 0' }} />

            {isAuthenticated ? (
              <>
                <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar size={36} icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: '#00B4D8' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.first_name} {user?.last_name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{user?.email}</div>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setDrawerOpen(false)} style={drawerLinkStyle('/profile')}>Profile</Link>
                <Link to="/my-courses" onClick={() => setDrawerOpen(false)} style={drawerLinkStyle('/my-courses')}>My Courses</Link>
                <Link to="/my-events" onClick={() => setDrawerOpen(false)} style={drawerLinkStyle('/my-events')}>My Events</Link>
                <Link to="/my-applications" onClick={() => setDrawerOpen(false)} style={drawerLinkStyle('/my-applications')}>My Applications</Link>
                <div style={{ padding: '14px 24px' }}>
                  <Button danger block onClick={handleLogout} icon={<LogoutOutlined />}>Logout</Button>
                </div>
              </>
            ) : (
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/signin" onClick={() => setDrawerOpen(false)}>
                  <Button block size="large" style={{ borderRadius: 8 }}>Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setDrawerOpen(false)}>
                  <Button type="primary" block size="large" style={{ borderRadius: 8 }}>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </Drawer>
      </nav>
    </header>
  );
};

export default Navbar;
