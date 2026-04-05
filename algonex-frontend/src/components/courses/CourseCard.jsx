import { Tag, Rate } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function CourseCard({ course, useSlug = false }) {
  const navigate = useNavigate();

  const courseUrl = useSlug && course.slug ? `/courses/${course.slug}` : `/stack/${course.id}`;
  const discountNum = parseInt(course.discount) || 0;
  const priceNum = parseInt(course.price) || 0;
  const discountedPrice =
    discountNum > 0 ? Math.round(priceNum * (1 - discountNum / 100)) : priceNum;

  return (
    <div
      onClick={() => navigate(courseUrl)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "white",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img
          alt={course.name}
          src={course.image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        {/* Tags */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          {(course.isTrending || course.is_trending) && (
            <Tag
              style={{
                margin: 0,
                background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                border: "none",
                color: "white",
                fontWeight: 600,
                fontSize: 11,
                borderRadius: 6,
                padding: "2px 10px",
              }}
            >
              TRENDING
            </Tag>
          )}
          <Tag
            style={{
              margin: 0,
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(4px)",
              border: "none",
              color: "#333",
              fontWeight: 500,
              fontSize: 11,
              borderRadius: 6,
              padding: "2px 10px",
            }}
          >
            {course.recommended?.level || course.level || "All Levels"}
          </Tag>
        </div>
        {discountNum > 0 && (
          <Tag
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              margin: 0,
              background: "#22c55e",
              border: "none",
              color: "white",
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 6,
              padding: "2px 10px",
            }}
          >
            {discountNum}% OFF
          </Tag>
        )}
        {/* Bottom overlay info */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            display: "flex",
            gap: 12,
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
          }}
        >
          <span><ClockCircleOutlined /> {course.duration}</span>
          <span><BookOutlined /> {course.modules?.length || 0} modules</span>
          <span><UserOutlined /> {(course.students || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 6, lineHeight: 1.3 }}>
          {course.name}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "#666",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
            flex: 1,
          }}
        >
          {course.description}
        </p>

        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
          <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{course.rating}</span>
          <Rate disabled defaultValue={course.rating} allowHalf style={{ fontSize: 13 }} />
          <span style={{ color: "#999", fontSize: 12 }}>({course.reviews})</span>
        </div>

        {/* Price + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#00B4D8" }}>
              ₹{discountedPrice.toLocaleString()}
            </span>
            {discountNum > 0 && (
              <span style={{ textDecoration: "line-through", color: "#bbb", fontSize: 13, marginLeft: 6 }}>
                ₹{priceNum.toLocaleString()}
              </span>
            )}
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#00B4D8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
            }}
          >
            <ArrowRightOutlined />
          </div>
        </div>
      </div>
    </div>
  );
}
