import { Card } from "antd";

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Last updated: April 2026</p>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ lineHeight: 1.8, color: "#444" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 0 }}>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (name, email, phone), enrolling in courses, registering for events, or submitting job applications. We also collect usage data such as pages visited and features used to improve our platform.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>2. How We Use Your Information</h2>
          <p>Your information is used to provide and improve our services, process enrollments and registrations, communicate about courses and events, and support your career development. We never sell your personal data to third parties.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>3. Data Security</h2>
          <p>We use industry-standard security measures including encrypted connections (HTTPS), secure password hashing, and JWT-based authentication. Application data is stored on secured servers with restricted access.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>4. Cookies</h2>
          <p>We use essential cookies for authentication (JWT tokens stored in localStorage). We do not use third-party tracking cookies.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>5. Your Rights</h2>
          <p>You can access, update, or delete your profile information at any time through your account settings. To request complete data deletion, contact us at contact@algonex.in.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>6. Contact</h2>
          <p>For privacy-related questions, email us at contact@algonex.in or visit our office at Marthahalli, Bangalore, Karnataka 560037.</p>
        </div>
      </Card>
    </div>
  );
}
