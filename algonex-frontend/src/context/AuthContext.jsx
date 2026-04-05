import { createContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getUser();
      const userData = response.data?.data || response.data;
      setUser(userData);
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    await fetchUser();
    return response;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { access, refresh } = response.data;
    if (access) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      await fetchUser();
    }
    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isInstructor: user?.role === "instructor",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
