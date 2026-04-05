import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Tag, Button, Input, Segmented, Row, Col, Empty, Modal, App, Spin } from "antd";
import { useAuth } from "../../hooks/useAuth";
import { eventsAPI } from "../../api/events";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const upcomingEvents = [
  {
    id: 1,
    title: "Full Stack Web Development Workshop",
    date: "April 15, 2026",
    time: "10:00 AM - 4:00 PM",
    location: "Algonex Campus, Bangalore",
    type: "Workshop",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop",
    spots: 30,
    registered: 22,
    description: "Hands-on workshop covering React, Node.js, and MongoDB with real-world projects.",
  },
  {
    id: 2,
    title: "AI & Machine Learning Masterclass",
    date: "April 22, 2026",
    time: "2:00 PM - 5:00 PM",
    location: "Online (Zoom)",
    type: "Webinar",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop",
    spots: 100,
    registered: 78,
    description: "Deep dive into neural networks, NLP, and computer vision with industry expert.",
  },
  {
    id: 3,
    title: "Hackathon: Build for Impact",
    date: "May 3-4, 2026",
    time: "9:00 AM - 9:00 PM",
    location: "Algonex Campus, Bangalore",
    type: "Hackathon",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop",
    spots: 50,
    registered: 45,
    description: "48-hour hackathon to build solutions for real social challenges. ₹1L prize pool.",
  },
  {
    id: 4,
    title: "Cloud Computing & DevOps Bootcamp",
    date: "May 10, 2026",
    time: "10:00 AM - 3:00 PM",
    location: "Algonex Campus, Bangalore",
    type: "Workshop",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop",
    spots: 40,
    registered: 15,
    description: "AWS, Docker, Kubernetes — from setup to deployment in a single day.",
  },
];

const pastEvents = [
  { title: "Python Data Science Workshop", date: "March 20, 2026", attendees: 85, type: "Workshop" },
  { title: "Open Source Contribution Day", date: "March 8, 2026", attendees: 120, type: "Meetup" },
  { title: "System Design Interview Prep", date: "Feb 25, 2026", attendees: 64, type: "Webinar" },
  { title: "React Native Mobile Dev Sprint", date: "Feb 15, 2026", attendees: 42, type: "Workshop" },
  { title: "Tech Career Fair 2026", date: "Jan 30, 2026", attendees: 300, type: "Meetup" },
  { title: "Blockchain & Web3 Introduction", date: "Jan 18, 2026", attendees: 55, type: "Webinar" },
];

const EVENT_TYPES = ["All", "Workshop", "Webinar", "Hackathon", "Meetup"];

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [registeredEvents, setRegisteredEvents] = useState(new Set());
  const [modalEvent, setModalEvent] = useState(null);
  const [showSigninModal, setShowSigninModal] = useState(false);
  const [apiEvents, setApiEvents] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();

  // Try API, fall back to static data
  useEffect(() => {
    eventsAPI.list()
      .then((res) => {
        const results = res.data?.data?.results || res.data?.results || [];
        if (results.length > 0) setApiEvents(results);
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  const activeEvents = apiEvents || upcomingEvents;

  const handleRegister = (event) => {
    if (!isAuthenticated) {
      setShowSigninModal(true);
      return;
    }
    setModalEvent(event);
  };

  const confirmRegister = async () => {
    if (!modalEvent) return;
    const eventSlug = modalEvent.slug || modalEvent.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setRegisterLoading(true);
    try {
      await eventsAPI.register(eventSlug);
      setRegisteredEvents((prev) => new Set([...prev, modalEvent.id]));
      message.success(`Registered for ${modalEvent.title}!`);
      setModalEvent(null);
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || "Registration failed.";
      message.error(errMsg);
      setModalEvent(null);
    } finally {
      setRegisterLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return activeEvents.filter((e) => {
      const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
      const eventType = e.type || e.event_type || "";
      const matchesType = typeFilter === "All" || eventType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [activeEvents, search, typeFilter]);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #0c1222, #0a2540)",
          padding: "60px 24px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 800, marginBottom: 12 }}>Events & Workshops</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 32px" }}>
          Learn, network, and build with the Algonex community
        </p>
        <Row gutter={[24, 16]} justify="center">
          {[
            { value: "50+", label: "Events Hosted" },
            { value: "3,000+", label: "Participants" },
            { value: "25+", label: "Expert Speakers" },
            { value: "4.8/5", label: "Avg Rating" },
          ].map((s, i) => (
            <Col key={i}>
              <div style={{ padding: "12px 28px" }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* Upcoming Events */}
      <section style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 24 }}>
          Upcoming Events
        </h2>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32, padding: 20, background: "#f8fafc", borderRadius: 12 }}>
          <Input
            placeholder="Search events..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, flex: "1 1 200px" }}
            size="large"
            allowClear
          />
          <Segmented options={EVENT_TYPES} value={typeFilter} onChange={setTypeFilter} size="large" />
        </div>

        {filtered.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filtered.map((event) => {
              const spotsLeft = event.spots_left ?? (event.spots != null ? event.spots - (event.registered || 0) : null);
              return (
                <Col key={event.id} xs={24} sm={12}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                        <img
                          alt={event.title}
                          src={event.image}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Tag
                          color={(event.event_type || event.type) === "hackathon" ? "magenta" : (event.event_type || event.type) === "webinar" ? "blue" : "cyan"}
                          style={{ position: "absolute", top: 12, left: 12, margin: 0 }}
                        >
                          {event.event_type || event.type}
                        </Tag>
                        {spotsLeft != null && <Tag
                          color={spotsLeft <= 5 ? "red" : spotsLeft <= 15 ? "orange" : "green"}
                          style={{ position: "absolute", top: 12, right: 12, margin: 0 }}
                        >
                          {spotsLeft} spots left
                        </Tag>}
                      </div>
                    }
                  >
                    <Link to={event.slug ? `/events/${event.slug}` : "#"} style={{ textDecoration: "none", color: "inherit" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{event.title}</h3>
                    </Link>
                    <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
                      {event.summary || (event.description || "").substring(0, 120) + (event.description?.length > 120 ? "..." : "")}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, color: "#888", fontSize: 13, marginBottom: 16 }}>
                      <span><CalendarOutlined /> {event.date || (event.start_date && new Date(event.start_date).toLocaleDateString())}</span>
                      {event.time && <span><ClockCircleOutlined /> {event.time}</span>}
                      <span><EnvironmentOutlined /> {event.location}</span>
                      <span><TeamOutlined /> {event.spots_left != null ? `${event.spots_left} spots left` : `${event.registered || 0}/${event.spots || event.capacity}`}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {event.slug && (
                        <Link to={`/events/${event.slug}`} style={{ flex: 1 }}>
                          <Button block>View Details</Button>
                        </Link>
                      )}
                      <div style={{ flex: 1 }}>
                        {registeredEvents.has(event.id) ? (
                          <Button block style={{ background: "#22c55e", color: "white", border: "none" }}>
                            Registered
                          </Button>
                        ) : (
                          <Button type="primary" block onClick={() => handleRegister(event)}>
                            Register <ArrowRightOutlined />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Empty description="No events match your search" style={{ padding: 60 }} />
        )}
      </section>

      {/* Past Events */}
      <section style={{ padding: "48px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 24 }}>
            Past Events
          </h2>
          <Row gutter={[24, 24]}>
            {pastEvents.map((event, i) => (
              <Col key={i} xs={24} sm={12} lg={8}>
                <Card size="small">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{event.title}</h4>
                      <div style={{ color: "#888", fontSize: 13 }}>
                        <CalendarOutlined /> {event.date}
                      </div>
                    </div>
                    <Tag color="default">{event.type}</Tag>
                  </div>
                  <div style={{ marginTop: 8, color: "#00B4D8", fontWeight: 500, fontSize: 13 }}>
                    <TeamOutlined /> {event.attendees} attended
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #00B4D8, #0891b2)", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 12 }}>
          Want to Host an Event with Us?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 24 }}>
          We partner with companies, colleges, and communities for tech events
        </p>
        <Link to="/contact">
          <Button size="large" style={{ height: 48, borderRadius: 8, background: "white", color: "#00B4D8", fontWeight: 600, border: "none" }}>
            Get in Touch
          </Button>
        </Link>
      </section>

      {/* Register Confirmation Modal */}
      <Modal
        title={modalEvent ? `Register for ${modalEvent.title}?` : ""}
        open={!!modalEvent}
        onOk={confirmRegister}
        onCancel={() => setModalEvent(null)}
        okText="Confirm Registration"
        confirmLoading={registerLoading}
      >
        {modalEvent && <p>{modalEvent.date || modalEvent.start_date} | {modalEvent.location}</p>}
      </Modal>

      {/* Sign In Required Modal */}
      <Modal
        title="Sign in required"
        open={showSigninModal}
        onOk={() => {
          setShowSigninModal(false);
          navigate("/signin");
        }}
        onCancel={() => setShowSigninModal(false)}
        okText="Sign In"
      >
        <p>You need to sign in to register for events.</p>
      </Modal>
    </div>
  );
}
