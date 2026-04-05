import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Tag, Empty, Spin, Row, Col, Steps, Button } from "antd";
import { careersAPI } from "../../api/careers";

const STATUS_STEPS = ["applied", "reviewed", "interview", "hired"];
const STATUS_COLORS = { applied: "blue", reviewed: "cyan", interview: "orange", hired: "green", rejected: "red" };

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    careersAPI.myApplications()
      .then((res) => setApplications(res.data?.data?.results || res.data?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>My Applications</h1>
      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
      ) : applications.length > 0 ? (
        <Row gutter={[24, 24]}>
          {applications.map((a) => {
            const currentStep = a.status === "rejected" ? -1 : STATUS_STEPS.indexOf(a.status);
            return (
              <Col key={a.id} xs={24} lg={12}>
                <Card style={{ borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{a.job?.title || a.job_title}</h3>
                      <p style={{ color: "#888", fontSize: 13, margin: 0 }}>Applied: {new Date(a.applied_at).toLocaleDateString()}</p>
                    </div>
                    <Tag color={STATUS_COLORS[a.status] || "default"}>{a.status}</Tag>
                  </div>
                  {a.status !== "rejected" ? (
                    <Steps current={currentStep} size="small" items={STATUS_STEPS.map((s) => ({ title: s }))} />
                  ) : (
                    <p style={{ color: "#ef4444", fontWeight: 500 }}>Application was not selected for this position.</p>
                  )}
                  {(a.job?.slug || a.job_slug) && (
                    <Link to={`/careers/${a.job?.slug || a.job_slug}`}>
                      <Button type="link" style={{ padding: 0, marginTop: 12 }}>View Job Details</Button>
                    </Link>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty description="You haven't applied to any positions yet.">
          <Link to="/careers"><Button type="primary">Browse Jobs</Button></Link>
        </Empty>
      )}
    </div>
  );
}
