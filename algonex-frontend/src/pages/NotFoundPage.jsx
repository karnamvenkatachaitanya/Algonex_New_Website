import { Link } from "react-router-dom";
import { Button, Result } from "antd";

export default function NotFoundPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Result
        status="404"
        title="Page Not Found"
        subTitle="The page you're looking for doesn't exist or has been moved."
        extra={
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/"><Button type="primary">Go Home</Button></Link>
            <Link to="/allcourses"><Button>Browse Courses</Button></Link>
          </div>
        }
      />
    </div>
  );
}
