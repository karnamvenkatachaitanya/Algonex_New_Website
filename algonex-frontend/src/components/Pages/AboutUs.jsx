import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Row, Col, Avatar } from "antd";
import {
  RocketOutlined,
  BulbOutlined,
  HeartOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

const stats = [
  { value: "5,000+", label: "Students Trained", icon: <TeamOutlined /> },
  { value: "95%", label: "Placement Rate", icon: <TrophyOutlined /> },
  { value: "50+", label: "Hiring Partners", icon: <GlobalOutlined /> },
  { value: "4.8/5", label: "Student Rating", icon: <HeartOutlined /> },
];

const values = [
  { icon: <BulbOutlined style={{ fontSize: 24, color: "#00B4D8" }} />, title: "Innovation", desc: "We constantly evolve our curriculum to stay ahead of industry trends." },
  { icon: <TeamOutlined style={{ fontSize: 24, color: "#00B4D8" }} />, title: "Community", desc: "We build lifelong connections between students, mentors, and partners." },
  { icon: <TrophyOutlined style={{ fontSize: 24, color: "#00B4D8" }} />, title: "Excellence", desc: "We hold ourselves to the highest standards in education delivery." },
  { icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: "#00B4D8" }} />, title: "Integrity", desc: "Honest outcomes, transparent pricing, no hidden conditions." },
  { icon: <RocketOutlined style={{ fontSize: 24, color: "#00B4D8" }} />, title: "Impact", desc: "Every student's career transformation is our measure of success." },
  { icon: <HeartOutlined style={{ fontSize: 24, color: "#00B4D8" }} />, title: "Accessibility", desc: "Quality tech education should be affordable and available to all." },
];

const milestones = [
  { year: "2020", title: "Founded", desc: "Started with 3 courses and 20 students in a co-working space in Bangalore." },
  { year: "2021", title: "First 500 Students", desc: "Expanded to 8 courses, launched online programs during the pandemic." },
  { year: "2022", title: "Corporate Partnerships", desc: "Partnered with 15+ companies for placement and internship programs." },
  { year: "2023", title: "Campus Launch", desc: "Opened our dedicated campus in Marthahalli with state-of-the-art labs." },
  { year: "2024", title: "3,000 Alumni", desc: "Reached 3,000 graduates with 95% placement rate across top tech companies." },
  { year: "2025", title: "Software Solutions", desc: "Launched Algonex Solutions — building products alongside training talent." },
  { year: "2026", title: "5,000+ & Growing", desc: "Expanding nationally with new programs in AI, Cloud, and DevOps." },
];

const team = [
  { name: "Ganesh", role: "Founder & CEO", desc: "Full-stack developer turned educator, passionate about democratizing tech education.", avatar: null },
  { name: "Priya Reddy", role: "Head of Curriculum", desc: "Ex-Google engineer with 12 years of experience designing learning paths.", avatar: null },
  { name: "Arjun Menon", role: "Head of Placements", desc: "Built placement networks at 3 ed-tech companies before joining Algonex.", avatar: null },
  { name: "Sneha Nair", role: "Lead Instructor", desc: "AWS-certified architect and full-stack expert. 500+ students mentored.", avatar: null },
  { name: "Sai Kumar", role: "Tech Lead", desc: "Full-stack developer with expertise in modern web technologies and cloud platforms.", avatar: null },
];

const tabs = {
  mission: {
    title: "Our Mission",
    content: "To bridge the gap between academic learning and industry requirements by providing practical, project-based training that makes students job-ready from day one. We believe every aspiring developer deserves access to world-class mentorship.",
  },
  vision: {
    title: "Our Vision",
    content: "To become India's most trusted tech training institute — known not for marketing, but for outcomes. We measure success by the careers we help build, not the courses we sell.",
  },
  story: {
    title: "Our Story",
    content: "Algonex started in 2020 when our founder noticed that most CS graduates couldn't build a real project despite years of study. We set out to fix that with a training model that puts hands-on building first, theory second, and career support always.",
  },
};

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0c1222, #0a2540)", padding: "60px 24px", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 800, marginBottom: 12 }}>About Algonex</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 32px" }}>
          Training institute & software solutions company building the next generation of tech professionals
        </p>
        <Row gutter={[32, 16]} justify="center">
          {stats.map((s, i) => (
            <Col key={i}>
              <div style={{ padding: "8px 24px" }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* Mission / Vision / Story */}
      <section style={{ padding: "64px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {Object.keys(tabs).map((key) => (
            <Button
              key={key}
              type={activeTab === key ? "primary" : "default"}
              size="large"
              onClick={() => setActiveTab(key)}
              style={{ borderRadius: 8 }}
            >
              {tabs[key].title}
            </Button>
          ))}
        </div>
        <Card style={{ borderRadius: 16, textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2c3e50", marginBottom: 16 }}>
            {tabs[activeTab].title}
          </h2>
          <p style={{ fontSize: 16, color: "#555", lineHeight: 1.8, maxWidth: 600, margin: "0 auto" }}>
            {tabs[activeTab].content}
          </p>
        </Card>
      </section>

      {/* Values */}
      <section style={{ padding: "64px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>Our Core Values</h2>
            <p style={{ color: "#666" }}>The principles that drive everything we do</p>
          </div>
          <Row gutter={[24, 24]}>
            {values.map((v, i) => (
              <Col key={i} xs={24} sm={12} lg={8}>
                <Card style={{ borderRadius: 12, height: "100%", textAlign: "center" }}>
                  <div style={{ marginBottom: 12 }}>{v.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ color: "#666", margin: 0 }}>{v.desc}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Journey Timeline */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>Our Journey</h2>
          </div>
          <div style={{ position: "relative", paddingLeft: 40 }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 2, background: "#e8e8e8" }} />
            {milestones.map((m, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 32 }}>
                <div
                  style={{
                    position: "absolute",
                    left: -33,
                    top: 4,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#00B4D8",
                    border: "3px solid #CCF6FF",
                  }}
                />
                <div style={{ color: "#00B4D8", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.year}</div>
                <h4 style={{ fontSize: 17, fontWeight: 600, color: "#2c3e50", marginBottom: 4 }}>{m.title}</h4>
                <p style={{ color: "#666", margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "64px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>Leadership Team</h2>
            <p style={{ color: "#666" }}>The people behind Algonex</p>
          </div>
          <Row gutter={[24, 24]} justify="center">
            {team.map((t, i) => (
              <Col key={i} xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, textAlign: "center" }}>
                  <Avatar size={72} style={{ background: "#00B4D8", marginBottom: 16 }}>
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </Avatar>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>{t.name}</h3>
                  <div style={{ color: "#00B4D8", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t.role}</div>
                  <p style={{ color: "#666", fontSize: 13, margin: 0 }}>{t.desc}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #00B4D8, #0891b2)", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 12 }}>Join the Algonex Family</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
          Whether you're a student, instructor, or company — there's a place for you here
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/allcourses">
            <Button size="large" style={{ height: 48, borderRadius: 8, background: "white", color: "#00B4D8", fontWeight: 600, border: "none" }}>
              Browse Courses <ArrowRightOutlined />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="large" ghost style={{ height: 48, borderRadius: 8, color: "white", borderColor: "rgba(255,255,255,0.4)" }}>
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
