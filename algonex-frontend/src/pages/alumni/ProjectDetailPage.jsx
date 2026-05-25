import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Tag, Button, Spin, Empty } from "antd";
import {
  ArrowLeftOutlined,
  GithubOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { projectsAPI } from "../../api/alumni";

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.detail(slug)
      .then((res) => {
        const data = res.data?.data || res.data;
        setProject(data);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: 80 }}>
        <Empty description="Project not found">
          <Link to="/alumni">
            <Button type="primary">Back to Alumni</Button>
          </Link>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "80vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <Link to="/alumni" style={{ color: "#00B4D8", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <ArrowLeftOutlined /> Back to Alumni
        </Link>

        {project.thumbnail && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
            <img src={project.thumbnail} alt={project.title} style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
          </div>
        )}

        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>
          {project.title}
        </h1>
        <p style={{ color: "#888", fontSize: 16, marginBottom: 24 }}>
          by {project.student_name} — {project.course?.name}, Batch {project.batch_year}
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {project.tech_tags?.map((t) => (
            <Tag key={t.id} style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)", color: "#0891b2" }}>
              {t.name}
            </Tag>
          ))}
        </div>

        <div className="md-content" style={{
          background: "white", borderRadius: 16, border: "1px solid #e8e8e8",
          padding: 32, marginBottom: 32, lineHeight: 1.8, color: "#555",
        }}>
          <Markdown remarkPlugins={[remarkGfm]}>{project.description}</Markdown>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {project.demo_url && (
            <Button type="primary" icon={<LinkOutlined />} href={project.demo_url} target="_blank" size="large">
              Live Demo
            </Button>
          )}
          {project.github_url && (
            <Button icon={<GithubOutlined />} href={project.github_url} target="_blank" size="large">
              View Code
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
