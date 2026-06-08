import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Tag, Button, Input, Segmented, Row, Col, Empty, Spin } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  LaptopOutlined,
} from "@ant-design/icons";
import { programsAPI } from "../../api/programs";
import { getImageUrl } from "../../utils/image";

const FALLBACK_PROGRAMS = [
  {
    id: 1,
    title: "AI/ML Fellowship Program",
    slug: "ai-ml-fellowship",
    program_type: "fellowship",
    description: "A 6-month intensive fellowship in artificial intelligence and machine learning with hands-on projects, mentorship from industry experts, and a guaranteed stipend.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop",
    duration: "6 months",
    stipend: "\u20b925,000/month",
    location: "Bangalore",
    is_remote: false,
    application_deadline: "2026-05-15",
    start_date: "2026-06-01",
    is_featured: true,
    registration_count: 42,
    is_accepting: true,
  },
  {
    id: 2,
    title: "Full Stack Development Internship",
    slug: "fullstack-dev-internship",
    program_type: "internship",
    description: "3-month hands-on internship building production-grade web applications with React, Node.js, and cloud technologies.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop",
    duration: "3 months",
    stipend: "\u20b915,000/month",
    location: "Remote",
    is_remote: true,
    application_deadline: "2026-04-30",
    start_date: "2026-05-15",
    is_featured: true,
    registration_count: 78,
    is_accepting: true,
  },
  {
    id: 3,
    title: "Data Engineering Fellowship",
    slug: "data-engineering-fellowship",
    program_type: "fellowship",
    description: "Build scalable data pipelines with Apache Spark, Airflow, and modern data stack tools. Includes real-world projects with partner companies.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop",
    duration: "4 months",
    stipend: "\u20b920,000/month",
    location: "Hyderabad",
    is_remote: false,
    application_deadline: "2026-05-20",
    start_date: "2026-06-15",
    is_featured: false,
    registration_count: 23,
    is_accepting: true,
  },
  {
    id: 4,
    title: "Cloud & DevOps Internship",
    slug: "cloud-devops-internship",
    program_type: "internship",
    description: "Learn AWS, Docker, Kubernetes, and CI/CD pipelines by deploying real applications. Mentored by certified cloud architects.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop",
    duration: "3 months",
    stipend: "\u20b912,000/month",
    location: "Bangalore",
    is_remote: false,
    application_deadline: "2026-04-20",
    start_date: "2026-05-01",
    is_featured: false,
    registration_count: 56,
    is_accepting: true,
  },
  {
    id: 5,
    title: "Cybersecurity Fellowship",
    slug: "cybersecurity-fellowship",
    program_type: "fellowship",
    description: "Advanced fellowship covering penetration testing, threat modeling, incident response, and security architecture. Certification prep included.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop",
    duration: "5 months",
    stipend: "\u20b922,000/month",
    location: "Remote",
    is_remote: true,
    application_deadline: "2026-06-01",
    start_date: "2026-07-01",
    is_featured: false,
    registration_count: 15,
    is_accepting: true,
  },
  {
    id: 6,
    title: "UI/UX Design Internship",
    slug: "uiux-design-internship",
    program_type: "internship",
    description: "Design real products using Figma, conduct user research, and build a professional portfolio. Work alongside senior designers on live projects.",
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&auto=format&fit=crop",
    duration: "3 months",
    stipend: "\u20b910,000/month",
    location: "Bangalore",
    is_remote: false,
    application_deadline: "2026-05-10",
    start_date: "2026-06-01",
    is_featured: false,
    registration_count: 34,
    is_accepting: true,
  },
];

const PROGRAM_TYPES = ["All", "Fellowship", "Internship"];

export default function ProgramListPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [programs, setPrograms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    programsAPI.list()
      .then((res) => {
        const results = res.data?.data?.results || res.data?.results || [];
        if (results.length > 0) setPrograms(results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activePrograms = programs || FALLBACK_PROGRAMS;

  const filtered = useMemo(() => {
    return activePrograms.filter((p) => {
      const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || p.program_type === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [activePrograms, search, typeFilter]);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #0c1222, #0a2540)",
          padding: "60px 24px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 800, marginBottom: 12 }}>
          Programs
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 32px" }}>
          Launch your career with our fellowships and internships
        </p>
        <Row gutter={[24, 16]} justify="center">
          {[
            { value: "6+", label: "Active Programs" },
            { value: "200+", label: "Registrations" },
            { value: "95%", label: "Completion Rate" },
            { value: "85%", label: "Placed After" },
          ].map((s, i) => (
            <Col key={i}>
              <div style={{ padding: "12px 28px" }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* Program List */}
      <section style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 24 }}>
          Available Programs
        </h2>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32, padding: 20, background: "#f8fafc", borderRadius: 12 }}>
          <Input
            placeholder="Search programs..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, flex: "1 1 200px" }}
            size="large"
            allowClear
          />
          <Segmented options={PROGRAM_TYPES} value={typeFilter} onChange={setTypeFilter} size="large" />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
        ) : filtered.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filtered.map((program) => {
              const deadline = program.application_deadline ? new Date(program.application_deadline) : null;
              const isAccepting = program.is_accepting ?? (deadline && deadline >= new Date());
              return (
                <Col key={program.id} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                        <img
                          alt={program.title}
                          src={getImageUrl(program.image)}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Tag
                          color={program.program_type === "fellowship" ? "purple" : "blue"}
                          style={{ position: "absolute", top: 12, left: 12, margin: 0, textTransform: "capitalize" }}
                        >
                          {program.program_type}
                        </Tag>
                        {program.is_featured && (
                          <Tag color="gold" style={{ position: "absolute", top: 12, right: 12, margin: 0 }}>
                            Featured
                          </Tag>
                        )}
                      </div>
                    }
                  >
                    <Link to={`/programs/${program.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{program.title}</h3>
                    </Link>
                    <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
                      {(program.description || "").substring(0, 120)}{program.description?.length > 120 ? "..." : ""}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#888", fontSize: 13, marginBottom: 16 }}>
                      <span><ClockCircleOutlined /> {program.duration}</span>
                      {program.stipend && <span><DollarOutlined /> {program.stipend}</span>}
                      <span>
                        {program.is_remote ? <><LaptopOutlined /> Remote</> : <><EnvironmentOutlined /> {program.location}</>}
                      </span>
                      {deadline && (
                        <span>
                          <CalendarOutlined /> Deadline: {deadline.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                      <TeamOutlined style={{ color: "#00B4D8" }} />
                      <span style={{ fontSize: 13, color: "#00B4D8", fontWeight: 500 }}>
                        {program.registration_count || 0} registered
                      </span>
                      {!isAccepting && (
                        <Tag color="red" style={{ marginLeft: "auto" }}>Closed</Tag>
                      )}
                    </div>
                    <Link to={`/programs/${program.slug}`} style={{ display: "block" }}>
                      <Button type="primary" block>
                        View Details <ArrowRightOutlined />
                      </Button>
                    </Link>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Empty description="No programs match your search" style={{ padding: 60 }} />
        )}
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #00B4D8, #0891b2)", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 12 }}>
          Ready to Get Started?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 24 }}>
          Register now and take the first step toward your dream career
        </p>
        <Link to="/register">
          <Button size="large" style={{ height: 48, borderRadius: 8, background: "white", color: "#00B4D8", fontWeight: 600, border: "none" }}>
            Register Now <ArrowRightOutlined />
          </Button>
        </Link>
      </section>
    </div>
  );
}
