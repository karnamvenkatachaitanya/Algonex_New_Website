import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Input, Tag, Modal, Button, Spin, Empty, Segmented } from "antd";
import {
  SearchOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { alumniAPI, projectsAPI } from "../../api/alumni";

// --- Mock data for when backend APIs aren't ready ---
const MOCK_ALUMNI = [
  { id: 1, name: "Priya M.", avatar: "", course: { name: "Python Full Stack", slug: "python-full-stack" }, batch_year: 2025, current_company: "TCS", current_role: "Backend Developer", linkedin_url: "", short_quote: "Algonex gave me the skills to land my dream job.", package_range: "6-8 LPA" },
  { id: 2, name: "Rahul S.", avatar: "", course: { name: "Python Full Stack", slug: "python-full-stack" }, batch_year: 2025, current_company: "Infosys", current_role: "Full Stack Developer", linkedin_url: "", short_quote: "The hands-on projects made all the difference.", package_range: "5-7 LPA" },
  { id: 3, name: "Ananya K.", avatar: "", course: { name: "MERN Stack", slug: "mern-stack" }, batch_year: 2025, current_company: "Wipro", current_role: "Frontend Developer", linkedin_url: "", short_quote: "I went from zero coding to employed in 4 months.", package_range: "5-6 LPA" },
  { id: 4, name: "Sneha R.", avatar: "", course: { name: "Data Analyst", slug: "data-analyst" }, batch_year: 2025, current_company: "Deloitte", current_role: "Data Analyst", linkedin_url: "", short_quote: "The analytics curriculum is world-class.", package_range: "8-10 LPA" },
  { id: 5, name: "Arjun P.", avatar: "", course: { name: "Data Analyst", slug: "data-analyst" }, batch_year: 2024, current_company: "Amazon", current_role: "Business Analyst", linkedin_url: "", short_quote: "Algonex helped me transition from ops to analytics.", package_range: "12-15 LPA" },
  { id: 6, name: "Sanjay V.", avatar: "", course: { name: "MERN Stack", slug: "mern-stack" }, batch_year: 2024, current_company: "Flipkart", current_role: "Frontend Engineer", linkedin_url: "", short_quote: "The MERN curriculum is spot-on for the industry.", package_range: "10-12 LPA" },
];

const MOCK_PROJECTS = [
  { id: 1, title: "ShopEasy E-Commerce", slug: "shopeasy-e-commerce", thumbnail: "", student_name: "Rahul S.", course: { name: "Python Full Stack", slug: "python-full-stack" }, batch_year: 2025, tech_tags: [{ id: 1, name: "Python" }, { id: 2, name: "Django" }, { id: 3, name: "React" }], is_featured: true, description: "A full-stack e-commerce platform with cart, checkout, and admin dashboard.", demo_url: "", github_url: "" },
  { id: 2, title: "TaskFlow Project Manager", slug: "taskflow-project-manager", thumbnail: "", student_name: "Ananya K.", course: { name: "MERN Stack", slug: "mern-stack" }, batch_year: 2025, tech_tags: [{ id: 3, name: "React" }, { id: 4, name: "Node.js" }, { id: 5, name: "MongoDB" }], is_featured: true, description: "Real-time project management tool with Kanban boards and team chat.", demo_url: "", github_url: "" },
  { id: 3, title: "Sales Analytics Dashboard", slug: "sales-analytics-dashboard", thumbnail: "", student_name: "Sneha R.", course: { name: "Data Analyst", slug: "data-analyst" }, batch_year: 2025, tech_tags: [{ id: 1, name: "Python" }, { id: 6, name: "Pandas" }], is_featured: true, description: "Interactive dashboard for sales data visualization with predictive analytics.", demo_url: "", github_url: "" },
];

function AlumniCard({ alumni, onClick }) {
  const initials = alumni.name.split(" ").map((n) => n[0]).join("");
  return (
    <div
      onClick={() => onClick(alumni)}
      style={{
        background: "white", borderRadius: 16, border: "1px solid #e8e8e8",
        padding: 24, cursor: "pointer", transition: "all 0.2s", height: "100%",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00B4D8"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,180,216,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "#EBFBFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, color: "#00B4D8", flexShrink: 0,
        }}>
          {alumni.avatar ? <img src={alumni.avatar} alt={alumni.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initials}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#2c3e50" }}>{alumni.name}</div>
          <div style={{ color: "#888", fontSize: 13 }}>{alumni.current_role}</div>
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#00B4D8", marginBottom: 8 }}>
        {alumni.current_company}
      </div>
      {alumni.package_range && (
        <Tag color="green" style={{ marginBottom: 8 }}>{alumni.package_range}</Tag>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag>{alumni.course?.name}</Tag>
        <Tag>Batch {alumni.batch_year}</Tag>
      </div>
      {alumni.short_quote && (
        <p style={{ color: "#888", fontSize: 13, fontStyle: "italic", marginTop: 12, lineHeight: 1.5 }}>
          &ldquo;{alumni.short_quote}&rdquo;
        </p>
      )}
    </div>
  );
}

function ProjectCard({ project }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/alumni/projects/${project.slug}`)}
      style={{
        background: "white", borderRadius: 16, border: "1px solid #e8e8e8",
        overflow: "hidden", cursor: "pointer", transition: "all 0.2s", height: "100%",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00B4D8"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,180,216,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        height: 160, background: "#f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#ccc", fontSize: 48,
      }}>
        {project.thumbnail ? <img src={project.thumbnail} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "\u{1F4BB}"}
      </div>
      <div style={{ padding: 20 }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "#2c3e50", marginBottom: 8 }}>{project.title}</h4>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>by {project.student_name}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {project.tech_tags?.slice(0, 4).map((t) => (
            <Tag key={t.id} style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)", color: "#0891b2" }}>{t.name}</Tag>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag>{project.course?.name}</Tag>
        </div>
      </div>
    </div>
  );
}

export default function AlumniPage() {
  const [tab, setTab] = useState("alumni");
  const [alumni, setAlumni] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      alumniAPI.list({ page_size: 50 }),
      projectsAPI.list({ page_size: 50 }),
    ]).then(([alumniRes, projectsRes]) => {
      const alumniData = alumniRes.status === "fulfilled"
        ? (alumniRes.value.data?.data?.results || alumniRes.value.data?.results || [])
        : [];
      const projectData = projectsRes.status === "fulfilled"
        ? (projectsRes.value.data?.data?.results || projectsRes.value.data?.results || [])
        : [];
      setAlumni(alumniData.length > 0 ? alumniData : MOCK_ALUMNI);
      setProjects(projectData.length > 0 ? projectData : MOCK_PROJECTS);
    }).finally(() => setLoading(false));
  }, []);

  const filteredAlumni = alumni.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.current_company.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.student_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#f8fafc", minHeight: "80vh" }}>
      {/* Header */}
      <section style={{
        background: "linear-gradient(135deg, #0c1222 0%, #0a2540 50%, #0e3a5e 100%)",
        padding: "64px 24px", textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "white", marginBottom: 8 }}>
          Our Community
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
          Meet the alumni who transformed their careers and the projects they built
        </p>
      </section>

      {/* Controls */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { label: `Alumni (${alumni.length})`, value: "alumni" },
              { label: `Projects (${projects.length})`, value: "projects" },
            ]}
            size="large"
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder={tab === "alumni" ? "Search by name or company..." : "Search by title or student..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
            allowClear
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : tab === "alumni" ? (
          filteredAlumni.length === 0 ? (
            <Empty description="No alumni found" />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredAlumni.map((a) => (
                <Col key={a.id} xs={24} sm={12} lg={8} xl={6}>
                  <AlumniCard alumni={a} onClick={setSelected} />
                </Col>
              ))}
            </Row>
          )
        ) : (
          filteredProjects.length === 0 ? (
            <Empty description="No projects found" />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredProjects.map((p) => (
                <Col key={p.id} xs={24} sm={12} lg={8}>
                  <ProjectCard project={p} />
                </Col>
              ))}
            </Row>
          )
        )}
      </div>

      {/* Alumni detail modal */}
      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} centered width={420}>
        {selected && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#EBFBFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 28, fontWeight: 700, color: "#00B4D8",
            }}>
              {selected.avatar ? <img src={selected.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : selected.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selected.name}</h3>
            <p style={{ color: "#666", marginBottom: 4 }}>{selected.current_role}</p>
            <p style={{ color: "#00B4D8", fontWeight: 600, marginBottom: 8 }}>{selected.current_company}</p>
            {selected.package_range && <Tag color="green">{selected.package_range}</Tag>}
            {selected.short_quote && (
              <p style={{ color: "#888", fontStyle: "italic", marginTop: 16, lineHeight: 1.6 }}>
                &ldquo;{selected.short_quote}&rdquo;
              </p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <Tag>{selected.course?.name}</Tag>
              <Tag>Batch {selected.batch_year}</Tag>
            </div>
            {selected.linkedin_url && (
              <Button type="link" icon={<LinkedinOutlined />} href={selected.linkedin_url} target="_blank" style={{ marginTop: 12 }}>
                LinkedIn Profile
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
