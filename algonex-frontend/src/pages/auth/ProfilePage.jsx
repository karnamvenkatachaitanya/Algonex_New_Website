import { useState } from "react";
import { Form, Input, Button, Card, Avatar, App } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api/auth";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authAPI.updateUser(values);
      await refreshUser();
      message.success("Profile updated!");
    } catch {
      message.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user.avatar} />
          <h2 style={{ marginTop: 12, marginBottom: 4 }}>
            {user.first_name} {user.last_name}
          </h2>
          <p style={{ color: "#666" }}>{user.email}</p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            bio: user.bio,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Form.Item name="first_name" label="First Name" style={{ flex: "1 1 180px", minWidth: 0 }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Last Name" style={{ flex: "1 1 180px", minWidth: 0 }}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>

          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
