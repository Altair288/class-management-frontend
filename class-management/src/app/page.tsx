"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 主页面重定向到管理后台
export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 自动重定向到管理后台
    router.push("/login");
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="redirect-container">
      <div className="redirect-content">
        <h2>正在跳转到管理系统...</h2>
        <div className="spinner"></div>
      </div>
      <style jsx>{`
        .redirect-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f8f9fa;
        }
        .redirect-content {
          text-align: center;
        }
        .redirect-content h2 {
          color: #6c757d;
          margin-bottom: 10px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}