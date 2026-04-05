import { Card } from "antd";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Last updated: April 2026</p>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ lineHeight: 1.8, color: "#444" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 0 }}>1. Acceptance of Terms</h2>
          <p>By accessing and using the Algonex platform, you agree to these Terms of Service. If you do not agree, please do not use our services.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>2. Account Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and keep your profile up to date.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>3. Course Enrollment</h2>
          <p>Course enrollment is subject to availability. Pricing and discounts are as displayed at the time of enrollment. We reserve the right to modify course content, schedules, and pricing with reasonable notice.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>4. Event Registration</h2>
          <p>Event registration is on a first-come, first-served basis. If an event reaches capacity, you may be placed on a waitlist. Cancellations must be made at least 24 hours before the event start time.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>5. Job Applications</h2>
          <p>Job applications submitted through our platform are subject to review. We do not guarantee employment outcomes. Application data is shared only with relevant hiring managers.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>6. Intellectual Property</h2>
          <p>All course content, materials, and platform features are the intellectual property of Algonex. You may not reproduce, distribute, or modify our content without written permission.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>7. Limitation of Liability</h2>
          <p>Algonex provides educational services on an "as is" basis. We are not liable for career outcomes, placement results, or technical issues beyond our reasonable control.</p>

          <h2 style={{ fontSize: 20, fontWeight: 600 }}>8. Contact</h2>
          <p>For questions about these terms, contact us at contact@algonex.in.</p>
        </div>
      </Card>
    </div>
  );
}
