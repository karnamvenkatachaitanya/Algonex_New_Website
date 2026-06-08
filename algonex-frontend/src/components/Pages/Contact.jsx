import React, { useState } from "react";
import { Form, Input, Button, Card, Row, Col, App } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import apiClient from "../../api/client";

const contactInfo = [
  {
    icon: <MailOutlined style={{ fontSize: 24, color: "#00B4D8" }} />,
    title: "Email Us",
    detail: "solutions@algonex.co.in",
    sub: "We respond within 24 hours",
  },
  {
    icon: <PhoneOutlined style={{ fontSize: 24, color: "#00B4D8" }} />,
    title: "Call Us",
    detail: "+91 9959789424 , +91 8555955279 , +91 7995739967 ,9346630135",
    sub: "Mon-Sat, 9 AM - 8 PM",
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 24, color: "#00B4D8" }} />,
    title: "Visit Us",
    detail: "Opposite to KLM, MTK Reddy Building, 2nd floor, Marathahalli Bridge, Bangalore-560037",
    sub: "Karnataka 560037",
  },
  {
    icon: <ClockCircleOutlined style={{ fontSize: 24, color: "#00B4D8" }} />,
    title: "Business Hours",
    detail: "Mon - Sat: 9 AM - 8 PM",
    sub: "Sunday: Closed",
  },
];

export default function Contact() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await apiClient.post("/contact/submit-form/", values);
      message.success("Message sent! We'll get back to you soon.");
      form.resetFields();
    } catch {
      message.error("Failed to send message. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0c1222, #0a2540)", padding: "60px 24px", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 800, marginBottom: 12 }}>Get in Touch</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 500, margin: "0 auto" }}>
          Have a question about our courses? Want to partner with us? We'd love to hear from you.
        </p>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        {/* Contact Info Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          {contactInfo.map((c, i) => (
            <Col key={i} xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 12, textAlign: "center", height: "100%" }}>
                <div style={{ marginBottom: 12 }}>{c.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{c.title}</h3>
                <div style={{ fontWeight: 500, color: "#2c3e50", marginBottom: 2 }}>{c.detail}</div>
                <div style={{ color: "#888", fontSize: 13 }}>{c.sub}</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[48, 48]}>
          {/* Contact Form */}
          <Col xs={24} lg={14}>
            <Card style={{ borderRadius: 16 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2c3e50", marginBottom: 24 }}>
                Send Us a Message
              </h2>
              <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="full_name"
                      label="Full Name"
                      rules={[{ required: true, message: "Please enter your name" }]}
                    >
                      <Input placeholder="John Doe" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter a valid email" },
                      ]}
                    >
                      <Input placeholder="john@example.com" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="phone" label="Phone (optional)">
                      <Input placeholder="+91 98765 43210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="subject"
                      label="Subject"
                      rules={[{ required: true, message: "Please enter a subject" }]}
                    >
                      <Input placeholder="Course inquiry, partnership, etc." />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true, message: "Please enter your message" }]}
                >
                  <Input.TextArea rows={5} placeholder="Tell us what you're looking for..." />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} block style={{ height: 48, borderRadius: 8 }}>
                  Send Message
                </Button>
              </Form>
            </Card>
          </Col>

          {/* Map */}
          <Col xs={24} lg={10}>
            <Card style={{ borderRadius: 16, overflow: "hidden", height: "100%", padding: 0 }} styles={{ body: { padding: 0, height: "100%" } }}>
              <iframe
                title="Algonex Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.2!2d77.68!3d12.96!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU3JzM2LjAiTiA3N8KwNDAnNDguMCJF!5e0!3m2!1sen!2sin!4v1"
                style={{ border: 0, width: "100%", height: "100%", minHeight: 400 }}
                allowFullScreen=""
                loading="lazy"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
