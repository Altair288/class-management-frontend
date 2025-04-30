"use client";

import React, { useState } from "react";
import axios from "axios";

type UserType = "STUDENT" | "TEACHER" | "PARENT";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    userType: "STUDENT" as UserType,
    relatedId: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post("/api/users/login", loginForm);
      setMessage("登录成功！");
      // 这里可以存储用户信息到 localStorage 或跳转页面
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (axios.isAxiosError(err) && err.response?.data) {
          setMessage(err.response.data);
        } else {
          setMessage("登录失败");
        }
      } else {
        setMessage("登录失败");
      }
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post("/api/users/register", {
        userType: registerForm.userType,
        relatedId: registerForm.relatedId,
        password: registerForm.password,
      });
      setMessage("注册成功，请登录！");
      setIsLogin(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data || "注册失败");
      } else {
        setMessage("注册失败");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1976d2 0%, #90caf9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(25, 118, 210, 0.15)",
          padding: 36,
          width: 350,
        }}
      >
        <h2 style={{ textAlign: "center", color: "#1976d2", marginBottom: 24 }}>
          {isLogin ? "用户登录" : "用户注册"}
        </h2>
        {message && (
          <div
            style={{
              background: "#e3f2fd",
              color: "#1976d2",
              borderRadius: 6,
              padding: "8px 12px",
              marginBottom: 16,
              textAlign: "center",
              fontSize: 15,
            }}
          >
            {message}
          </div>
        )}
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <input
                type="text"
                placeholder="用户名"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, username: e.target.value }))
                }
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #cfd8dc",
                  fontSize: 15,
                  marginBottom: 10,
                }}
              />
              <input
                type="password"
                placeholder="密码"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #cfd8dc",
                  fontSize: 15,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "12px 0",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 1,
                cursor: "pointer",
                marginBottom: 10,
                transition: "background 0.2s",
              }}
            >
              {loading ? "登录中..." : "登录"}
            </button>
            <div style={{ textAlign: "center", fontSize: 14 }}>
              没有账号？{" "}
              <span
                style={{ color: "#1976d2", cursor: "pointer" }}
                onClick={() => setIsLogin(false)}
              >
                去注册
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 14 }}>
              <select
                value={registerForm.userType}
                onChange={(e) =>
                  setRegisterForm((f) => ({
                    ...f,
                    userType: e.target.value as UserType,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #cfd8dc",
                  fontSize: 15,
                  marginBottom: 10,
                }}
              >
                <option value="STUDENT">学生</option>
                <option value="TEACHER">教师</option>
                <option value="PARENT">家长</option>
              </select>
              <input
                type="text"
                placeholder="关联ID（学生/教师/家长ID）"
                value={registerForm.relatedId}
                onChange={(e) =>
                  setRegisterForm((f) => ({
                    ...f,
                    relatedId: e.target.value,
                  }))
                }
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #cfd8dc",
                  fontSize: 15,
                  marginBottom: 10,
                }}
              />
              <input
                type="password"
                placeholder="密码"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((f) => ({
                    ...f,
                    password: e.target.value,
                  }))
                }
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #cfd8dc",
                  fontSize: 15,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "12px 0",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 1,
                cursor: "pointer",
                marginBottom: 10,
                transition: "background 0.2s",
              }}
            >
              {loading ? "注册中..." : "注册"}
            </button>
            <div style={{ textAlign: "center", fontSize: 14 }}>
              已有账号？{" "}
              <span
                style={{ color: "#1976d2", cursor: "pointer" }}
                onClick={() => setIsLogin(true)}
              >
                去登录
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}