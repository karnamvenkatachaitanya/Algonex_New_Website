import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tag, Button, Empty, Spin, Image, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { portfolioAPI } from "../../api/portfolio";

export default function CaseStudyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portfolioAPI.detail(slug)
      .then((res) => setStudy(res.data?.data || res.data))
      .catch(() => setStudy(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  if (!study) return <div style={{ padding: 80, textAlign: "center" }}><Empty description="Case study not found" /><Button type="primary" onClick={() => navigate("/products")} style={{ marginTop: 16 }}>Browse Portfolio</Button></div>;

  return (
    <div style={{ background: "#f8fafc" }}>
      {study.banner && (
        <div style={{ height: 300, background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${study.banner}) center/cover`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{ color: "white", fontSize: 40, fontWeight: 800 }}>{study.title}</h1>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16, padding: 0 }}>Back</Button>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {study.industry && <Tag color="blue">{study.industry}</Tag>}
          {study.client_name && <Tag>{study.client_name}</Tag>}
          {study.tech_tags?.map((t) => <Tag key={t.id || t} color="cyan">{t.name || t}</Tag>)}
        </div>

        {!study.banner && <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>{study.title}</h1>}

        {study.problem && (
          <Card style={{ borderRadius: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>The Problem</h2>
            <div className="md-content"><Markdown remarkPlugins={[remarkGfm]}>{study.problem}</Markdown></div>
          </Card>
        )}
        {study.solution && (
          <Card style={{ borderRadius: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Our Solution</h2>
            <div className="md-content"><Markdown remarkPlugins={[remarkGfm]}>{study.solution}</Markdown></div>
          </Card>
        )}
        {study.results && (
          <Card style={{ borderRadius: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Results</h2>
            <div className="md-content"><Markdown remarkPlugins={[remarkGfm]}>{study.results}</Markdown></div>
          </Card>
        )}

        {study.screenshots?.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Screenshots</h2>
            <Image.PreviewGroup>
              <Row gutter={[16, 16]}>
                {study.screenshots.map((s) => (
                  <Col key={s.id} xs={24} sm={12}>
                    <Image src={s.image} style={{ borderRadius: 8, width: "100%" }} />
                    {s.caption && <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{s.caption}</p>}
                  </Col>
                ))}
              </Row>
            </Image.PreviewGroup>
          </div>
        )}
      </div>
    </div>
  );
}
