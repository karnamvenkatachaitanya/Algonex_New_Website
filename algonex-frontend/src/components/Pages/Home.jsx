import React from "react";
import { Link } from "react-router-dom";
import { Button, Row, Col } from "antd";
import {
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { STACKS } from "../../constants/constant";
import CourseCard from "../courses/CourseCard";

const stats = [
  { value: "5,000+", label: "Students Trained" },
  { value: "50+", label: "Industry Partners" },
  { value: "95%", label: "Placement Rate" },
  { value: "4.8/5", label: "Student Rating" },
];

const features = [
  {
    icon: <CodeOutlined style={{ fontSize: 28, color: "#00B4D8" }} />,
    title: "Industry-Ready Curriculum",
    desc: "Courses designed with top tech companies to match real-world job requirements.",
  },
  {
    icon: <TeamOutlined style={{ fontSize: 28, color: "#00B4D8" }} />,
    title: "Expert Mentorship",
    desc: "Learn from senior engineers at FAANG companies with 10+ years of experience.",
  },
  {
    icon: <TrophyOutlined style={{ fontSize: 28, color: "#00B4D8" }} />,
    title: "Guaranteed Internships",
    desc: "Every student gets a hands-on internship with our partner companies.",
  },
  {
    icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: "#00B4D8" }} />,
    title: "Certified Programs",
    desc: "Industry-recognized certifications to validate your skills to employers.",
  },
  {
    icon: <RocketOutlined style={{ fontSize: 28, color: "#00B4D8" }} />,
    title: "Career Acceleration",
    desc: "Resume reviews, mock interviews, and direct company referrals.",
  },
  {
    icon: <GlobalOutlined style={{ fontSize: 28, color: "#00B4D8" }} />,
    title: "Global Community",
    desc: "Join a network of 5,000+ alumni working at top companies worldwide.",
  },
];

export default function Home() {
  const trendingCourses = STACKS.filter((c) => c.isTrending).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #0c1222 0%, #0a2540 50%, #0e3a5e 100%)",
          padding: "clamp(40px, 8vw, 80px) 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={14}>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(0,180,216,0.15)",
                  border: "1px solid rgba(0,180,216,0.3)",
                  borderRadius: 20,
                  padding: "6px 16px",
                  color: "#66E5FF",
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 24,
                }}
              >
                #1 Tech Training Institute in Bangalore
              </div>
              <h1
                style={{
                  fontSize: "clamp(28px, 6vw, 48px)",
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.15,
                  marginBottom: 20,
                }}
              >
                Build Your Tech Career{" "}
                <span style={{ color: "#00B4D8" }}>From Zero to Hero</span>
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 520,
                }}
              >
                Industry-designed courses with guaranteed internships, expert mentorship, and
                placement support. Join 5,000+ students who launched their tech careers with Algonex.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/allcourses">
                  <Button type="primary" size="large" icon={<ArrowRightOutlined />} style={{ height: 50, fontSize: 16, borderRadius: 8 }}>
                    Explore Courses
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="large" ghost style={{ height: 50, fontSize: 16, borderRadius: 8, color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
                    Book Free Demo
                  </Button>
                </Link>
              </div>
            </Col>
            <Col xs={24} lg={10}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {stats.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      padding: "28px 20px",
                      textAlign: "center",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div style={{ fontSize: 32, fontWeight: 800, color: "white" }}>{s.value}</div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Trending Courses */}
      <section style={{ background: "#f8fafc", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "#2c3e50", marginBottom: 4 }}>
                Trending Courses
              </h2>
              <p style={{ color: "#666" }}>Programs our students love the most</p>
            </div>
            <Link to="/allcourses">
              <Button type="link" size="large">
                View All Courses <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
          <Row gutter={[24, 24]}>
            {trendingCourses.map((course) => (
              <Col key={course.id} xs={24} sm={12} lg={6}>
                <CourseCard course={course} />
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Why Algonex */}
      <section style={{ padding: "64px 24px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>
              Why Algonex?
            </h2>
            <p style={{ color: "#666", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
              We don't just teach technology — we build careers
            </p>
          </div>
          <Row gutter={[24, 24]}>
            {features.map((f, i) => (
              <Col key={i} xs={24} sm={12} lg={8}>
                <div
                  style={{
                    padding: 28,
                    borderRadius: 16,
                    border: "1px solid #e8e8e8",
                    height: "100%",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#00B4D8";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,180,216,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e8e8e8";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2c3e50", marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: "#666", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #00B4D8, #0891b2)", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "white", marginBottom: 12 }}>
            Ready to Start Your Journey?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>
            Join thousands of students who transformed their careers. First consultation is free.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/signup">
              <Button size="large" style={{ height: 48, fontSize: 16, borderRadius: 8, background: "white", color: "#00B4D8", fontWeight: 600, border: "none" }}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="large" ghost style={{ height: 48, fontSize: 16, borderRadius: 8, color: "white", borderColor: "rgba(255,255,255,0.4)" }}>
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
