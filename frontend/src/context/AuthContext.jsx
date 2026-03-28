import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const res = await api.get("/users/me");
          setUser(res.data.data);
        }
      } catch (err) {
        console.error("Not authenticated", err);
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/users/login", { username, password });
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    await api.post("/users/register", userData);
    // Auto-login after registration
    return login(userData.username, userData.password);
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
