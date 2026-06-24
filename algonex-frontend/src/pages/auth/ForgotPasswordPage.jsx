import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, App } from "antd";
import { MailOutlined, KeyOutlined, LockOutlined } from "@ant-design/icons";
import { authAPI } from "../../api/auth";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const { message } = App.useApp();
  const navigate = useNavigate();

  const onRequestOTP = async (values) => {
    setLoading(true);
    try {
      await authAPI.requestPasswordResetOTP(values.email);
      setEmail(values.email);
      setStep(2);
      message.success("If an account exists, an OTP has been sent to your email.");
    } catch {
      message.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error("Passwords do not match!");
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.verifyPasswordResetOTP({
        email: email,
        otp: values.otp,
        new_password: values.new_password
      });
      message.success("Password reset successfully! You can now sign in.");
      navigate("/signin");
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || "Invalid or expired OTP.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh", padding: 24 }}>
      <Card style={{ width: 400, maxWidth: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Reset Password</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
          {step === 1 ? "Enter your email and we'll send you an OTP." : "Enter the OTP sent to your email and your new password."}
        </p>

        {step === 1 && (
          <Form layout="vertical" onFinish={onRequestOTP} size="large">
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
                Send OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 2 && (
          <Form layout="vertical" onFinish={onVerifyOTP} size="large">
            <Form.Item
              name="otp"
              rules={[{ required: true, message: "Please enter the 6-digit OTP" }]}
            >
              <Input prefix={<KeyOutlined />} placeholder="6-digit OTP" maxLength={6} />
            </Form.Item>
            <Form.Item
              name="new_password"
              rules={[
                { required: true, message: "Please enter your new password" },
                { min: 8, message: "Password must be at least 8 characters" }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              rules={[
                { required: true, message: "Please confirm your new password" }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/signin">Back to Sign In</Link>
        </div>
      </Card>
    </div>
  );
}
