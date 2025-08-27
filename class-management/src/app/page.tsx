"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 主页面重定向到管理后台
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 自动重定向到管理后台
    router.push("/login");
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#6c757d', marginBottom: '10px' }}>正在跳转到管理系统...</h2>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #e9ecef',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}