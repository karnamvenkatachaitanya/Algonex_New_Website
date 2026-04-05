import { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Button, Card, Result, App } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { authAPI } from "../../api/auth";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const [sent, setSent] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authAPI.resetPassword(values.email);
      setSent(true);
    } catch {
      message.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh", padding: 24 }}>
        <Result
          status="success"
          title="Check Your Email"
          subTitle="If an account exists with that email, we've sent password reset instructions."
          extra={<Link to="/signin"><Button type="primary">Back to Sign In</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh", padding: 24 }}>
      <Card style={{ width: 400, maxWidth: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Reset Password</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
          Enter your email and we'll send you reset instructions.
        </p>
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center" }}>
          <Link to="/signin">Back to Sign In</Link>
        </div>
      </Card>
    </div>
  );
}
