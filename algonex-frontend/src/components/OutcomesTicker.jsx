import { useState, useEffect } from "react";
import { Modal, Spin } from "antd";
import { outcomesAPI } from "../api/outcomes";

const MOCK_OUTCOMES = [
  { id: 1, student_name: "Rahul S.", achievement_type: "placed", company_name: "Infosys", role: "Full Stack Developer", package_range: "6-8 LPA", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-08" },
  { id: 2, student_name: "Priya M.", achievement_type: "placed", company_name: "TCS", role: "Backend Developer", package_range: "6-8 LPA", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-06" },
  { id: 3, student_name: "Vikram D.", achievement_type: "promoted", company_name: "Accenture", role: "Senior React Developer", package_range: "10-12 LPA", course: { name: "MERN Stack", slug: "mern-stack" }, achieved_at: "2026-04-04" },
  { id: 4, student_name: "Sneha R.", achievement_type: "placed", company_name: "Deloitte", role: "Data Analyst", package_range: "8-10 LPA", course: { name: "Data Analyst", slug: "data-analyst" }, achieved_at: "2026-04-09" },
  { id: 5, student_name: "Arjun P.", achievement_type: "placed", company_name: "Amazon", role: "Business Analyst", package_range: "12-15 LPA", course: { name: "Data Analyst", slug: "data-analyst" }, achieved_at: "2026-04-01" },
  { id: 6, student_name: "Divya L.", achievement_type: "freelancing", company_name: "", role: "Python Freelancer", package_range: "", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-10" },
  { id: 7, student_name: "Meera T.", achievement_type: "placed", company_name: "Freshworks", role: "Backend Engineer", package_range: "8-10 LPA", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-05" },
  { id: 8, student_name: "Sanjay V.", achievement_type: "placed", company_name: "Flipkart", role: "Frontend Engineer", package_range: "10-12 LPA", course: { name: "MERN Stack", slug: "mern-stack" }, achieved_at: "2026-04-03" },
];

const ACHIEVEMENT_LABELS = {
  placed: "placed at",
  promoted: "promoted at",
  freelancing: "started freelancing as",
  project_launched: "launched a project as",
};

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

function TickerItem({ outcome, onClick }) {
  const label = ACHIEVEMENT_LABELS[outcome.achievement_type] || "achieved at";
  const detail = outcome.company_name || outcome.role;

  return (
    <span
      onClick={() => onClick(outcome)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 20px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      <span style={{ color: "white", fontWeight: 600 }}>{outcome.student_name}</span>
      <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      {detail && <span style={{ color: "#00B4D8", fontWeight: 600 }}>{detail}</span>}
      {outcome.role && outcome.company_name && (
        <span style={{ color: "rgba(255,255,255,0.6)" }}>as {outcome.role}</span>
      )}
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
        — {relativeTime(outcome.achieved_at)}
      </span>
      <span style={{ color: "rgba(255,255,255,0.15)", padding: "0 8px" }}>|</span>
    </span>
  );
}

export default function OutcomesTicker() {
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    outcomesAPI.list({ page_size: 20 })
      .then((res) => {
        const results = res.data?.data?.results || res.data?.results || [];
        setOutcomes(results.length > 0 ? results : MOCK_OUTCOMES);
      })
      .catch(() => setOutcomes(MOCK_OUTCOMES))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#0a1628", padding: "12px 0", textAlign: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (outcomes.length === 0) return null;

  // Duplicate items to create seamless loop
  const tickerItems = [...outcomes, ...outcomes];
  const animDuration = outcomes.length * 4;

  return (
    <>
      {/* Desktop: horizontal scroll */}
      <div className="ticker-horizontal" style={{
        background: "#0a1628",
        borderBottom: "2px solid rgba(0,180,216,0.3)",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          display: "inline-flex",
          animation: `tickerScroll ${animDuration}s linear infinite`,
          whiteSpace: "nowrap",
        }}>
          {tickerItems.map((o, i) => (
            <TickerItem key={`${o.id}-${i}`} outcome={o} onClick={setSelected} />
          ))}
        </div>
      </div>

      {/* Mobile: vertical mini-feed (3 items) */}
      <div className="ticker-mobile" style={{
        background: "#0a1628",
        borderBottom: "2px solid rgba(0,180,216,0.3)",
        padding: "12px 16px",
        display: "none",
      }}>
        {outcomes.slice(0, 3).map((o) => {
          const label = ACHIEVEMENT_LABELS[o.achievement_type] || "achieved at";
          return (
            <div key={o.id} onClick={() => setSelected(o)} style={{
              padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)",
            }}>
              <span style={{ color: "white", fontWeight: 600 }}>{o.student_name}</span>{" "}
              {label} <span style={{ color: "#00B4D8", fontWeight: 600 }}>{o.company_name || o.role}</span>{" "}
              <span style={{ color: "rgba(255,255,255,0.4)" }}>— {relativeTime(o.achieved_at)}</span>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        centered
        width={400}
      >
        {selected && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#EBFBFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 24, fontWeight: 700, color: "#00B4D8",
            }}>
              {selected.student_name.charAt(0)}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{selected.student_name}</h3>
            {selected.role && <p style={{ color: "#666", marginBottom: 4 }}>{selected.role}</p>}
            {selected.company_name && (
              <p style={{ color: "#00B4D8", fontWeight: 600, marginBottom: 8 }}>{selected.company_name}</p>
            )}
            {selected.package_range && (
              <p style={{ color: "#888", marginBottom: 8 }}>{selected.package_range}</p>
            )}
            <p style={{ color: "#888", fontSize: 13 }}>
              {selected.course?.name} — {relativeTime(selected.achieved_at)}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
