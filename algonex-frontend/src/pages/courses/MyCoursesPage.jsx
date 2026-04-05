import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Tag, Button, Empty, Spin, Row, Col, App } from "antd";
import { coursesAPI } from "../../api/courses";

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  const fetch = () => {
    setLoading(true);
    coursesAPI.myEnrollments()
      .then((res) => setEnrollments(res.data?.data?.results || res.data?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleDrop = async (id) => {
    try {
      await coursesAPI.dropEnrollment(id);
      message.success("Enrollment dropped.");
      fetch();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Failed to drop enrollment.");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>My Courses</h1>
      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
      ) : enrollments.length > 0 ? (
        <Row gutter={[24, 24]}>
          {enrollments.map((e) => (
            <Col key={e.id} xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 12 }}>
                <Tag color={e.status === "active" ? "green" : e.status === "completed" ? "blue" : "default"}>
                  {e.status}
                </Tag>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>{e.course?.name || e.course_name}</h3>
                <p style={{ color: "#888", fontSize: 13 }}>Enrolled: {new Date(e.enrolled_at).toLocaleDateString()}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {e.course?.slug && <Link to={`/courses/${e.course.slug}`}><Button type="primary" size="small">View Course</Button></Link>}
                  {e.status === "active" && <Button size="small" danger onClick={() => handleDrop(e.id)}>Drop</Button>}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="You haven't enrolled in any courses yet.">
          <Link to="/allcourses"><Button type="primary">Browse Courses</Button></Link>
        </Empty>
      )}
    </div>
  );
}
