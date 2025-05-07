"use client";

export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(67, 233, 123, 0.15)",
          padding: 36,
          width: 400,
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#43e97b" }}>欢迎来到主页面！</h2>
        <p style={{ color: "#333", marginTop: 16 }}>
          你已成功登录。
        </p>
      </div>
    </div>
  );
}