import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Tag, Button, Input, Segmented, Row, Col, Empty, Spin, Popover } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { careersAPI } from "../../api/careers";
import ALUMNI from "../../constants/alumni.json";

const DEPARTMENTS = ["All", "Engineering", "Design", "Marketing", "Operations"];
const JOB_TYPES = ["All", "Full Time", "Part Time", "Internship", "Contract"];

const marqueeStyles = `
@keyframes scroll-left-right {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes float-card {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
@keyframes popover-fade-up {
  0% { opacity: 0; transform: translateY(12px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.marquee-container {
  display: flex;
  width: max-content;
}
.marquee-scroll-left {
  animation: scroll-left-right 32s linear infinite;
}
.marquee-scroll-left:hover {
  animation-play-state: paused;
}
.alumni-avatar-circle {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 2px solid rgba(255, 255, 255, 0.12) !important;
}
.alumni-avatar-circle:hover {
  transform: scale(1.18) translateY(-4px);
  box-shadow: 0 12px 28px -4px rgba(56, 189, 248, 0.45), 0 0 20px rgba(139, 92, 246, 0.35);
  border-color: #38bdf8 !important;
}
.floating-text-card {
  animation: float-card 6s ease-in-out infinite;
}
.ant-popover {
  animation: popover-fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.premium-job-card {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  background: #ffffff !important;
}
.premium-job-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.06), 0 0 25px rgba(56, 189, 248, 0.04) !important;
  border-color: #38bdf8 !important;
}
.job-arrow-icon {
  transform: translateX(-6px);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  color: #38bdf8;
}
.premium-job-card:hover .job-arrow-icon {
  transform: translateX(0);
  opacity: 1;
}
`;

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
    <div style={{ background: "#fafafa", minHeight: "100vh", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: marqueeStyles }} />

      {/* Hero Section */}
      <section 
        style={{ 
          background: "radial-gradient(circle at 50% 50%, #0d1527 0%, #05070d 100%)", 
          padding: "70px 24px", 
          color: "white",
          position: 'relative',
          overflow: "hidden",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%'
        }}
      >
        {/* Floating background neon gradients for premium depth */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.04) 0%, rgba(139, 92, 246, 0.04) 50%, rgba(0,0,0,0) 100%)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Full-Width Placements Marquee in the background (back side of the card) */}
        <div 
          style={{ 
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100vw', 
            marginLeft: 'calc(-50vw + 50%)', 
            transform: 'translateY(-50%)',
            zIndex: 1,
            overflow: 'hidden', 
            padding: '24px 0',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
            pointerEvents: 'auto'
          }}
        >
          <div className="marquee-container marquee-scroll-left">
            {/* Render two identical tracks side-by-side to guarantee infinite seamless looping without sub-pixel flex gaps */}
            {[1, 2].map((trackNum) => (
              <div 
                key={trackNum} 
                className="marquee-track" 
                style={{ display: 'flex', gap: 28, paddingRight: 28 }}
              >
                {[...ALUMNI, ...ALUMNI, ...ALUMNI].map((item, idx) => {
                  const popoverContent = (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#fff' }}>
                      
                      {/* Arch-Cropped Image with Premium Border Shine */}
                      <div style={{ 
                        width: 140, 
                        height: 140, 
                        overflow: 'hidden', 
                        borderTopLeftRadius: 80, 
                        borderTopRightRadius: 80, 
                        borderBottomLeftRadius: 12, 
                        borderBottomRightRadius: 12, 
                        border: '3px solid rgba(56, 189, 248, 0.3)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        marginBottom: 16
                      }}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>

                      {/* Name */}
                      <h3 style={{ 
                        fontSize: 18, 
                        fontWeight: 800, 
                        color: '#fff', 
                        letterSpacing: '0.04em', 
                        textTransform: 'uppercase', 
                        marginBottom: 2 
                      }}>
                        {item.name}
                      </h3>

                      {/* Subtitle / Role & Company */}
                      <div style={{ 
                        fontSize: 13, 
                        color: '#38bdf8', 
                        fontWeight: 600, 
                        marginBottom: 12 
                      }}>
                        {item.role} at {item.company}
                      </div>

                      {/* Course and Package Badges */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 8, 
                        flexWrap: 'wrap', 
                        justifyContent: 'center', 
                        marginBottom: 14 
                      }}>
                        <span style={{ 
                          background: 'rgba(56, 189, 248, 0.08)', 
                          color: '#38bdf8', 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          padding: '3px 10px', 
                          borderRadius: 12,
                          border: '1px solid rgba(56, 189, 248, 0.2)'
                        }}>
                          {item.course}
                        </span>
                        <span style={{ 
                          background: 'rgba(16, 185, 129, 0.08)', 
                          color: '#10b981', 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          padding: '3px 10px', 
                          borderRadius: 12,
                          border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                          {item.package}
                        </span>
                      </div>

                      {/* Quote */}
                      <p style={{ 
                        fontSize: 12, 
                        color: '#a1a1aa', 
                        lineHeight: 1.5, 
                        maxWidth: 280, 
                        margin: '0 auto 16px',
                        fontStyle: 'normal'
                      }}>
                        "{item.quote}"
                      </p>

                      {/* Verified LinkedIn Button */}
                      <a 
                        href={item.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          color: '#fff', 
                          fontSize: 13, 
                          fontWeight: 600, 
                          textDecoration: 'none',
                          background: 'linear-gradient(135deg, #0077b5, #00a0dc)',
                          padding: '6px 18px',
                          borderRadius: 20,
                          boxShadow: '0 4px 12px rgba(0, 119, 181, 0.3)',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 119, 181, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.3)';
                        }}
                      >
                        <LinkedinOutlined /> Verify Profile
                      </a>

                    </div>
                  );

                  return (
                    <Popover
                      key={`track-${trackNum}-${idx}`}
                      content={popoverContent}
                      trigger={['hover', 'click']}
                      placement="top"
                      overlayInnerStyle={{ 
                        background: 'rgba(15, 12, 25, 0.95)', 
                        backdropFilter: 'blur(20px) saturate(160%)',
                        borderRadius: 24, 
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        padding: '24px',
                        width: '320px',
                        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                    >
                      <div 
                        style={{ 
                          width: 76, 
                          height: 76, 
                          borderRadius: '50%', 
                          position: 'relative', 
                          overflow: 'hidden',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        className="alumni-avatar-circle"
                      >
                        <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {/* Package Tag with subtle premium aesthetic */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
                          width: '100%',
                          height: '24px',
                          borderTopLeftRadius: '38px',
                          borderTopRightRadius: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 -2px 10px rgba(0,0,0,0.12)'
                        }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {item.package}
                          </span>
                        </div>
                      </div>
                    </Popover>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Centered Glassmorphic Text Card (Sits on top of the scrolling marquee) */}
        <div 
          className="floating-text-card"
          style={{ 
            textAlign: "center", 
            maxWidth: 580, 
            background: 'rgba(8, 12, 24, 0.85)', // High-opacity slate glass cover
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 20,
            padding: '24px 40px',
            boxShadow: '0 0 50px rgba(139, 92, 246, 0.15), 0 25px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative', 
            zIndex: 2
          }}
        >
          <h1 style={{ 
            fontSize: "clamp(26px, 5vw, 36px)", 
            fontWeight: 900, 
            marginBottom: 8,
            backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #a5f3fc 75%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            letterSpacing: '-0.03em'
          }}>
            Careers at Algonex
          </h1>
          <p style={{ 
            fontSize: 15, 
            color: "rgba(255, 255, 255, 0.75)", 
            margin: 0,
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: '0.01em'
          }}>
            Join our team and help build the future of tech education
          </p>
        </div>
      </section>

      {/* Main Jobs Listing */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
        
        {/* Sleek, Premium Glassmorphic Filters Wrapper */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          alignItems: 'center',
          gap: 20, 
          marginBottom: 40, 
          padding: '24px 28px', 
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)", 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: 20,
          boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.04)'
        }}>
          <Input 
            placeholder="Search open roles..." 
            prefix={<SearchOutlined style={{ color: '#94a3b8', marginRight: 4 }} />} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ 
              maxWidth: 280, 
              flex: "1 1 200px",
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }} 
            size="large" 
            allowClear 
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department:</span>
            <Segmented options={DEPARTMENTS} value={dept} onChange={setDept} size="large" style={{ borderRadius: 12, padding: 3, background: '#f1f5f9' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule:</span>
            <Segmented options={JOB_TYPES} value={type} onChange={setType} size="large" style={{ borderRadius: 12, padding: 3, background: '#f1f5f9' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>
        ) : filtered.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filtered.map((job) => (
              <Col key={job.id || job.slug} xs={24} sm={12} lg={8}>
                <Link to={`/careers/${job.slug}`} style={{ textDecoration: "none" }}>
                  <Card 
                    hoverable 
                    className="premium-job-card"
                    style={{ 
                      borderRadius: 20, 
                      height: "100%", 
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      {/* Custom styled badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                        <span style={{ 
                          background: 'rgba(56, 189, 248, 0.08)', 
                          color: '#0284c7', 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          padding: '3px 10px', 
                          borderRadius: 8,
                          border: '1px solid rgba(56, 189, 248, 0.15)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em'
                        }}>
                          {job.department}
                        </span>
                        <span style={{ 
                          background: 'rgba(139, 92, 246, 0.08)', 
                          color: '#6d28d9', 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          padding: '3px 10px', 
                          borderRadius: 8,
                          border: '1px solid rgba(139, 92, 246, 0.15)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em'
                        }}>
                          {(job.job_type || "").replace("_", " ")}
                        </span>
                        {job.is_remote && (
                          <span style={{ 
                            background: 'rgba(16, 185, 129, 0.08)', 
                            color: '#047857', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            padding: '3px 10px', 
                            borderRadius: 8,
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}>
                            Remote
                          </span>
                        )}
                      </div>

                      {/* Job Title */}
                      <h3 style={{ 
                        fontSize: 19, 
                        fontWeight: 700, 
                        color: '#0f172a',
                        lineHeight: 1.4, 
                        marginBottom: 16 
                      }}>
                        {job.title}
                      </h3>
                    </div>

                    <div>
                      {/* Job metadata details with colored custom icons */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: 'column', 
                        gap: 10, 
                        color: '#64748b', 
                        fontSize: 13, 
                        fontWeight: 500,
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: 16,
                        marginBottom: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <EnvironmentOutlined style={{ color: '#0ea5e9' }} /> <span>{job.location}</span>
                        </div>
                        {job.salary_min && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <DollarOutlined style={{ color: '#10b981' }} /> <span>₹{job.salary_min}–{job.salary_max} LPA</span>
                          </div>
                        )}
                        {job.deadline && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ClockCircleOutlined style={{ color: '#8b5cf6' }} /> <span>Deadline: {job.deadline}</span>
                          </div>
                        )}
                      </div>

                      {/* "View Details" micro-animated indicator */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center',
                        marginTop: 12
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                          Apply Now <ArrowRightOutlined className="job-arrow-icon" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty 
            description={
              <span style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>
                {jobs.length === 0 ? "No open positions right now. Check back soon!" : "No jobs match your filters"}
              </span>
            } 
            style={{ padding: 100, background: '#ffffff', borderRadius: 20, border: '1px solid rgba(226, 232, 240, 0.8)' }} 
          />
        )}
      </div>
    </div>
  );
}
