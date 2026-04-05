import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import apiClient from './api/client';
import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Home from './components/Pages/Home';
import CourseListPage from './pages/courses/CourseListPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import Events from './components/Pages/Events';
import EventDetailPage from './pages/events/EventDetailPage';
import AboutUs from './components/Pages/AboutUs';
import Contact from './components/Pages/Contact';
import JobListPage from './pages/careers/JobListPage';
import JobDetailPage from './pages/careers/JobDetailPage';
import CaseStudyListPage from './pages/portfolio/CaseStudyListPage';
import CaseStudyDetailPage from './pages/portfolio/CaseStudyDetailPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ProfilePage from './pages/auth/ProfilePage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';

// Protected pages
import MyCoursesPage from './pages/courses/MyCoursesPage';
import MyEventsPage from './pages/events/MyEventsPage';
import MyApplicationsPage from './pages/careers/MyApplicationsPage';

import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

const FALLBACK_BANNER = {
  text: "Boost Your Professional Growth with Our Certified Training Courses - Flat 20% Off Course Fee",
  bg_color: "#00D4FF",
  text_color: "#000000",
  link: "",
};

const App = () => {
  const [banner, setBanner] = useState(FALLBACK_BANNER);

  useEffect(() => {
    apiClient.get("/banner/")
      .then((res) => {
        const data = res.data?.data;
        if (data) setBanner(data);
      })
      .catch(() => {});
  }, []);

  return (
    <ConfigProvider theme={theme.antd}>
      <AntApp>
      <Router>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {banner && (
              <div style={{
                background: banner.bg_color,
                color: banner.text_color,
                textAlign: "center",
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: 14,
              }}>
                {banner.link ? (
                  <a href={banner.link} style={{ color: banner.text_color, textDecoration: "none" }}>
                    {banner.text}
                  </a>
                ) : banner.text}
              </div>
            )}

            <Navbar />
            <div style={{ flex: 1 }}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<CourseListPage />} />
                <Route path="/allcourses" element={<CourseListPage />} />
                <Route path="/courses/:slug" element={<CourseDetailPage />} />
                <Route path="/stack/:id" element={<CourseDetailPage />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:slug" element={<EventDetailPage />} />
                <Route path="/aboutus" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/careers" element={<JobListPage />} />
                <Route path="/careers/:slug" element={<JobDetailPage />} />
                <Route path="/products" element={<CaseStudyListPage />} />
                <Route path="/products/:slug" element={<CaseStudyDetailPage />} />

                {/* Legal */}
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                {/* Auth */}
                <Route path="/signin" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/callback" element={<OAuthCallbackPage />} />

                {/* Protected */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
                <Route path="/my-applications" element={<ProtectedRoute><MyApplicationsPage /></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
