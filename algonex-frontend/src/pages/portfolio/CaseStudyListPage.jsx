import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Tag, Row, Col, Spin, Empty } from "antd";
import { portfolioAPI } from "../../api/portfolio";

export default function CaseStudyListPage() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portfolioAPI.list()
      .then((res) => setStudies(res.data?.data?.results || res.data?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section style={{ background: "linear-gradient(135deg, #0c1222, #0a2540)", padding: "60px 24px", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Our Work</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 500, margin: "0 auto" }}>
          Case studies showcasing our software solutions
        </p>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
        ) : studies.length > 0 ? (
          <Row gutter={[24, 24]}>
            {studies.map((s) => (
              <Col key={s.id || s.slug} xs={24} sm={12} lg={8}>
                <Link to={`/products/${s.slug}`} style={{ textDecoration: "none" }}>
                  <Card
                    hoverable
                    cover={s.thumbnail && <img alt={s.title} src={s.thumbnail} style={{ height: 200, objectFit: "cover" }} />}
                    style={{ borderRadius: 12 }}
                  >
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {s.industry && <Tag color="blue">{s.industry}</Tag>}
                      {s.tech_tags?.slice(0, 3).map((t) => <Tag key={t.id || t}>{t.name || t}</Tag>)}
                    </div>
                    <Card.Meta title={s.title} description={s.summary} />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No case studies yet. Coming soon!" style={{ padding: 80 }} />
        )}
      </div>
    </div>
  );
}
