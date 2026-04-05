import { useState, useEffect, useMemo } from "react";
import { Input, Segmented, Empty, Row, Col, Tag, Spin } from "antd";
import {
  SearchOutlined,
  BookOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { coursesAPI } from "../../api/courses";
import { STACKS } from "../../constants/constant";
import CourseCard from "../../components/courses/CourseCard";

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function CourseListPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");
  const [showTrending, setShowTrending] = useState("All");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingApi, setUsingApi] = useState(false);

  // Try API first, fall back to static data
  useEffect(() => {
    coursesAPI.list()
      .then((res) => {
        const results = res.data?.data?.results || res.data?.results || [];
        if (results.length > 0) {
          setCourses(results);
          setUsingApi(true);
        } else {
          setCourses(STACKS);
        }
      })
      .catch(() => {
        setCourses(STACKS);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase());

      const courseLevel = c.recommended?.level || c.level || "";
      const matchesLevel =
        level === "All" ||
        courseLevel.toLowerCase() === level.toLowerCase();

      const matchesTrending =
        showTrending === "All" ||
        (showTrending === "Trending" && (c.isTrending || c.is_trending));

      return matchesSearch && matchesLevel && matchesTrending;
    });
  }, [courses, search, level, showTrending]);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #0c1222 0%, #0a2540 50%, #0e3a5e 100%)",
          padding: "48px 24px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            background: "radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, color: "white", marginBottom: 8 }}>
            Explore Our Courses
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 28, maxWidth: 500 }}>
            {courses.length} industry-designed programs to launch your tech career
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { icon: <BookOutlined />, value: `${courses.length} Courses`, label: "Full Stack, Data & more" },
              { icon: <TeamOutlined />, value: "5,000+", label: "Students trained" },
              { icon: <TrophyOutlined />, value: "95%", label: "Placement rate" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,180,216,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00B4D8", fontSize: 16 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{s.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", padding: "16px 24px", background: "white", borderRadius: 16, marginTop: -28, position: "relative", zIndex: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <Input
            placeholder="Search courses..."
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 260, borderRadius: 10, flex: "1 1 200px" }}
            size="large"
            allowClear
          />
          <Segmented options={LEVELS} value={level} onChange={setLevel} size="large" />
          <Segmented options={["All", "Trending"]} value={showTrending} onChange={setShowTrending} size="large" />
          {filtered.length < courses.length && (
            <Tag color="blue" style={{ marginLeft: "auto", borderRadius: 8 }}>
              {filtered.length} of {courses.length} courses
            </Tag>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
        ) : filtered.length > 0 ? (
          <Row gutter={[24, 28]}>
            {filtered.map((course) => (
              <Col key={course.id || course.slug} xs={24} sm={12} lg={8} xl={6}>
                <CourseCard course={course} useSlug={usingApi} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No courses match your filters" style={{ padding: 80 }} />
        )}
      </div>
    </div>
  );
}
