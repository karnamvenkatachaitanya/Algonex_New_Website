import { useState } from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  BookOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

const MILESTONES = {
  2: "First Project",
  4: "Portfolio Ready",
};

function RoadmapNode({ module, index, total, isExpanded, onToggle }) {
  const isLeft = index % 2 === 0;
  const milestone = MILESTONES[index + 1];
  const topicCount = module.topics?.length || 0;

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: isLeft ? "flex-start" : "flex-end",
      position: "relative",
      paddingBottom: index < total - 1 ? 32 : 0,
    }}>
      {/* Connecting line */}
      {index < total - 1 && (
        <div style={{
          position: "absolute",
          left: "50%",
          top: 40,
          bottom: 0,
          width: 2,
          background: "linear-gradient(180deg, #00B4D8 0%, rgba(0,180,216,0.2) 100%)",
          transform: "translateX(-50%)",
          zIndex: 0,
        }} />
      )}

      {/* Node content */}
      <div style={{
        width: "48%",
        marginLeft: isLeft ? "2%" : "50%",
        position: "relative",
        zIndex: 1,
      }}
        className="roadmap-node-responsive"
      >
        {/* Number badge */}
        <div style={{
          position: "absolute",
          left: isLeft ? "auto" : -24,
          right: isLeft ? -24 : "auto",
          top: 8,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00B4D8, #0891b2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 18,
          boxShadow: "0 4px 12px rgba(0,180,216,0.3)",
          zIndex: 2,
        }}
          className="roadmap-badge-responsive"
        >
          {index + 1}
        </div>

        {/* Card */}
        <div
          onClick={onToggle}
          style={{
            background: "white",
            borderRadius: 16,
            border: isExpanded ? "2px solid #00B4D8" : "1px solid #e8e8e8",
            padding: 20,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: isExpanded ? "0 4px 16px rgba(0,180,216,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#2c3e50", margin: 0 }}>
              {module.title}
            </h4>
            {isExpanded ? <UpOutlined style={{ color: "#999" }} /> : <DownOutlined style={{ color: "#999" }} />}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, color: "#888", fontSize: 13 }}>
            <span><BookOutlined /> {topicCount} topic{topicCount !== 1 ? "s" : ""}</span>
          </div>

          {milestone && (
            <Tag color="gold" style={{ marginTop: 8 }}>
              <CheckCircleOutlined /> {milestone}
            </Tag>
          )}

          {/* Expandable topics */}
          <div style={{
            maxHeight: isExpanded ? 500 : 0,
            overflow: "hidden",
            transition: "max-height 0.3s ease",
            marginTop: isExpanded ? 16 : 0,
          }}>
            {module.description && (
              <p style={{ color: "#666", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                {module.description}
              </p>
            )}
            {module.topics?.map((topic, i) => (
              <div key={topic.id || i} style={{
                padding: "8px 0",
                borderTop: i === 0 ? "1px solid #f0f0f0" : "none",
                borderBottom: "1px solid #f0f0f0",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <CheckCircleOutlined style={{ color: "#00B4D8", fontSize: 12 }} />
                <span style={{ color: "#555", fontSize: 13 }}>{topic.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseRoadmap({ modules = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (modules.length === 0) return null;

  const totalTopics = modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0);

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: "flex", gap: 24, flexWrap: "wrap",
        padding: "16px 24px", borderRadius: 12,
        background: "#EBFBFF", marginBottom: 32,
        justifyContent: "center",
      }}>
        <span style={{ color: "#0891b2", fontWeight: 600 }}>
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "#888" }}>|</span>
        <span style={{ color: "#0891b2", fontWeight: 600 }}>
          {totalTopics}+ topics
        </span>
      </div>

      {/* Roadmap nodes */}
      <div style={{ position: "relative", padding: "0 24px" }} className="roadmap-container">
        {modules.map((module, index) => (
          <RoadmapNode
            key={module.id || index}
            module={module}
            index={index}
            total={modules.length}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}
