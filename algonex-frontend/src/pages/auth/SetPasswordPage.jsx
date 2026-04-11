import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Form, Input, Button, Card, Result, Alert, App } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { authAPI } from "../../api/auth";

export default function SetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  if (!token || !uid) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 24 }}>
        <Card style={{ width: "100%", maxWidth: 400 }}>
          <Result
            status="error"
            title="Invalid Link"
            subTitle="This password setup link is missing required information. Please request a new one from the Sign In page."
            extra={
              <Button type="primary" onClick={() => navigate("/signin")}>
                Go to Sign In
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 24 }}>
        <Card style={{ width: "100%", maxWidth: 400 }}>
          <Result
            status="success"
            title="Password Set!"
            subTitle="Your password has been set successfully. You can now sign in with your email and password."
            extra={
              <Button type="primary" onClick={() => navigate("/signin")}>
                Sign In
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authAPI.setPassword({
        token,
        uid,
        password: values.password,
        confirm_password: values.confirm_password,
      });
      setDone(true);
    } catch (err) {
      const apiErr = err.response?.data?.error;
      const fieldError = apiErr?.details
        ? Object.values(apiErr.details).flat()[0]
        : null;
      const msg = fieldError || apiErr?.message || "Failed to set password. The link may have expired.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 24 }}>
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Set Your Password</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
          Choose a password for your Algonex account
        </p>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter a password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Passwords do not match");
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Set Password
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Link to="/signin" style={{ fontSize: 13, color: "#888" }}>Back to Sign In</Link>
        </div>
      </Card>
    </div>
  );
}
