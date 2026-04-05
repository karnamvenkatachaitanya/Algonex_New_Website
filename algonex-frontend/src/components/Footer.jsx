import React from "react";
import { Link } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  LinkedinOutlined,
  GithubOutlined,
  TwitterOutlined,
} from "@ant-design/icons";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/allcourses" },
  { label: "Events", to: "/events" },
  { label: "About Us", to: "/aboutus" },
  { label: "Contact", to: "/contact" },
];

const courseLinks = [
  { label: "Python Full Stack", to: "/courses/python-full-stack" },
  { label: "MERN Stack", to: "/courses/mern-stack" },
  { label: "Data Analytics", to: "/courses/data-analytics" },
  { label: "Java Full Stack", to: "/courses/java-full-stack" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0c1222", color: "rgba(255,255,255,0.7)", padding: "48px 24px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            marginBottom: 40,
          }}
        >
          {/* Brand */}
          <div>
            <h3 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              <span style={{ color: "#00B4D8" }}>A</span>lgonex
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
              Training institute & software solutions company building the next generation of tech professionals in Bangalore.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="https://linkedin.com/company/algonex" target="_blank" rel="noopener noreferrer"
                style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }}
              >
                <LinkedinOutlined />
              </a>
              <a href="https://github.com/algonex" target="_blank" rel="noopener noreferrer"
                style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}
              >
                <GithubOutlined />
              </a>
              <a href="https://twitter.com/algonex" target="_blank" rel="noopener noreferrer"
                style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}
              >
                <TwitterOutlined />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Popular Courses</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {courseLinks.map((link) => (
                <Link key={link.to} to={link.to} style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <EnvironmentOutlined style={{ color: "#00B4D8" }} />
                Marthahalli, Bangalore 560037
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#00B4D8" }} />
                +91 80-4567-8900
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MailOutlined style={{ color: "#00B4D8" }} />
                contact@algonex.in
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>&copy; {new Date().getFullYear()} Algonex. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
