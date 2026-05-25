import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, Tag, Button, Empty, Spin, Row, Col } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DollarOutlined,
  LaptopOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { programsAPI } from "../../api/programs";

const TYPE_COLORS = { fellowship: "purple", internship: "blue" };

export default function ProgramDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    programsAPI.detail(slug)
      .then((res) => {
        const data = res.data?.data || res.data;
        setProgram(data);
      })
      .catch(() => setProgram(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;

  if (!program) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <Empty description="Program not found" />
        <Button type="primary" onClick={() => navigate("/programs")} style={{ marginTop: 16 }}>Browse Programs</Button>
      </div>
    );
  }

  const deadline = program.application_deadline ? new Date(program.application_deadline) : null;
  const startDate = program.start_date ? new Date(program.start_date) : null;
  const endDate = program.end_date ? new Date(program.end_date) : null;
  const isAccepting = program.is_accepting ?? (deadline && deadline >= new Date());
  const spotsLeft = program.spots_left;
  const formatDate = (d) => d?.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ background: "#f8fafc" }}>
      {/* Banner */}
      <div
        style={{
          background: program.banner
            ? `linear-gradient(135deg, rgba(0,180,216,0.85), rgba(8,145,178,0.9)), url(${program.banner}) center/cover`
            : program.image
              ? `linear-gradient(135deg, rgba(0,180,216,0.85), rgba(8,145,178,0.9)), url(${program.image}) center/cover`
              : "linear-gradient(135deg, #00B4D8, #0891b2)",
          padding: "48px 24px",
          color: "white",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ color: "white", marginBottom: 16, padding: 0 }}>
            Back to Programs
          </Button>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Tag color={TYPE_COLORS[program.program_type] || "default"} style={{ textTransform: "capitalize" }}>
              {program.program_type}
            </Tag>
            {program.is_featured && <Tag color="gold">Featured</Tag>}
            {isAccepting ? (
              <Tag color="green">Accepting Applications</Tag>
            ) : (
              <Tag color="red">Applications Closed</Tag>
            )}
            {spotsLeft != null && spotsLeft > 0 && (
              <Tag color={spotsLeft <= 5 ? "orange" : "green"}>
                {spotsLeft} spots left
              </Tag>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: "white", marginBottom: 12 }}>
            {program.title}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 15, color: "rgba(255,255,255,0.85)" }}>
            <span><ClockCircleOutlined /> {program.duration}</span>
            {program.stipend && <span><DollarOutlined /> {program.stipend}</span>}
            <span>
              {program.is_remote ? <><LaptopOutlined /> Remote</> : <><EnvironmentOutlined /> {program.location}</>}
            </span>
            {deadline && <span><CalendarOutlined /> Deadline: {deadline.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {/* Registration CTA */}
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          {isAccepting ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Interested in this program?</div>
                <div style={{ color: "#666", fontSize: 14 }}>
                  Register to express your interest — no account required
                </div>
              </div>
              <Link to={`/register?program=${slug}`}>
                <Button type="primary" size="large" style={{ height: 48, borderRadius: 8 }}>
                  Register for This Program <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
          ) : (
            <Button disabled block size="large">Applications Closed</Button>
          )}
        </Card>

        {/* Details Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { label: "Duration", value: program.duration, icon: <ClockCircleOutlined /> },
            { label: "Location", value: program.is_remote ? "Remote" : program.location, icon: program.is_remote ? <LaptopOutlined /> : <EnvironmentOutlined /> },
            { label: "Stipend", value: program.stipend || "N/A", icon: <DollarOutlined /> },
            { label: "Registered", value: program.registration_count ?? 0, icon: <TeamOutlined /> },
            ...(startDate ? [{ label: "Starts", value: startDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }), icon: <CalendarOutlined /> }] : []),
            ...(endDate ? [{ label: "Ends", value: endDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }), icon: <CalendarOutlined /> }] : []),
            ...(program.capacity ? [{ label: "Capacity", value: program.capacity, icon: <TeamOutlined /> }] : []),
            ...(spotsLeft != null ? [{ label: "Spots Left", value: spotsLeft, icon: <TeamOutlined /> }] : []),
          ].map((d, i) => (
            <Col key={i} xs={12} sm={6}>
              <Card size="small" style={{ borderRadius: 10, textAlign: "center" }}>
                <div style={{ color: "#00B4D8", fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{d.value}</div>
                <div style={{ color: "#888", fontSize: 12 }}>{d.label}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Description */}
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>About This Program</h2>
          <div className="md-content">
            <Markdown remarkPlugins={[remarkGfm]}>{program.description}</Markdown>
          </div>
        </Card>

        {/* Eligibility */}
        {program.eligibility_criteria && (
          <Card style={{ borderRadius: 12, marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Eligibility Criteria</h2>
            <div className="md-content">
              <Markdown remarkPlugins={[remarkGfm]}>{program.eligibility_criteria}</Markdown>
            </div>
            {(program.min_degree_level || program.eligible_branches) && (
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {program.min_degree_level && (
                  <Tag icon={<CheckCircleOutlined />} color="blue" style={{ textTransform: "capitalize" }}>
                    Min: {program.min_degree_level}
                  </Tag>
                )}
                {program.eligible_branches && program.eligible_branches.split(",").map((b) => (
                  <Tag key={b.trim()} color="default">{b.trim()}</Tag>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Bottom CTA */}
        {isAccepting && (
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #00B4D8, #0891b2)", border: "none" }}>
            <div style={{ textAlign: "center", color: "white" }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 8 }}>
                Don't miss out!
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>
                {deadline && `Applications close on ${formatDate(deadline)}`}
              </p>
              <Link to={`/register?program=${slug}`}>
                <Button size="large" style={{ height: 48, borderRadius: 8, background: "white", color: "#00B4D8", fontWeight: 600, border: "none" }}>
                  Register Now <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
