import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Tag, Button, Input, Segmented, Row, Col, Empty, Spin } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { careersAPI } from "../../api/careers";

const DEPARTMENTS = ["All", "Engineering", "Design", "Marketing", "Operations"];
const JOB_TYPES = ["All", "Full Time", "Part Time", "Internship", "Contract"];

export default function JobListPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [type, setType] = useState("All");

  useEffect(() => {
    careersAPI.list()
      .then((res) => setJobs(res.data?.data?.results || res.data?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch = !search || j.title.toLowerCase().includes(search.toLowerCase());
      const matchesDept = dept === "All" || j.department === dept.toLowerCase();
      const matchesType = type === "All" || j.job_type === type.toLowerCase().replace(" ", "_");
      return matchesSearch && matchesDept && matchesType;
    });
  }, [jobs, search, dept, type]);

  return (
    <div>
      <section style={{ background: "linear-gradient(135deg, #0c1222, #0a2540)", padding: "60px 24px", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 800, marginBottom: 12 }}>Careers at Algonex</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 500, margin: "0 auto" }}>
          Join our team and help build the future of tech education
        </p>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32, padding: 20, background: "#f8fafc", borderRadius: 12 }}>
          <Input placeholder="Search jobs..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260, flex: "1 1 200px" }} size="large" allowClear />
          <Segmented options={DEPARTMENTS} value={dept} onChange={setDept} size="large" />
          <Segmented options={JOB_TYPES} value={type} onChange={setType} size="large" />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
        ) : filtered.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filtered.map((job) => (
              <Col key={job.id || job.slug} xs={24} sm={12} lg={8}>
                <Link to={`/careers/${job.slug}`} style={{ textDecoration: "none" }}>
                  <Card hoverable style={{ borderRadius: 12, height: "100%" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <Tag color="blue">{job.department}</Tag>
                      <Tag color="cyan">{(job.job_type || "").replace("_", " ")}</Tag>
                      {job.is_remote && <Tag color="green">Remote</Tag>}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{job.title}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#888", fontSize: 13 }}>
                      <span><EnvironmentOutlined /> {job.location}</span>
                      {job.salary_min && <span><DollarOutlined /> ₹{job.salary_min}–{job.salary_max} LPA</span>}
                      {job.deadline && <span><ClockCircleOutlined /> Deadline: {job.deadline}</span>}
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description={jobs.length === 0 ? "No open positions right now. Check back soon!" : "No jobs match your filters"} style={{ padding: 80 }} />
        )}
      </div>
    </div>
  );
}
