"use client";
import React, { useState } from "react";

// 简易调试页面：忘记密码流程三步 (forgot -> verify -> reset)
// 假设后端 API 基础路径为 /auth/*，若有反向代理前缀可在 NEXT_PUBLIC_API_BASE 里配置
const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";

type JsonMap = Record<string, unknown>;
interface VerifyResp { valid: boolean; expiresAt?: string | number }

async function jsonFetch<T = JsonMap>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(apiBase + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store"
  });
  let data: unknown = null;
  try { data = await resp.json(); } catch { /* ignore */ }
  if (!resp.ok) {
    let msg = resp.statusText;
    if (data && typeof data === 'object') {
      const d = data as JsonMap;
      if (typeof d.message === 'string') msg = d.message;
      else if (typeof d.error === 'string') msg = d.error as string;
      else msg = JSON.stringify(d);
    }
    throw new Error(msg);
  }
  return data as T;
}

export default function ResetTestPage() {
  const [identifier, setIdentifier] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResp | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  function pushLog(line: string) { setLog(l => [new Date().toLocaleTimeString() + " " + line, ...l].slice(0, 200)); }

  const doForgot = async () => {
    if (!identifier.trim()) { pushLog("identifier 为空"); return; }
    setLoading("forgot");
    try {
  const r = await jsonFetch("/api/auth/forgot", { method: "POST", body: JSON.stringify({ identifier }) });
      pushLog("forgot: " + JSON.stringify(r));
      pushLog("(如果邮箱存在，应收到邮件。开发调试可从数据库或日志获取 token)");
    } catch (e) {
      pushLog("forgot error: " + (e as Error).message);
    } finally { setLoading(null); }
  };

  const doVerify = async () => {
    if (!token.trim()) { pushLog("token 为空"); return; }
    setLoading("verify");
    try {
  const r = await jsonFetch<VerifyResp>(`/api/auth/reset/verify?token=${encodeURIComponent(token)}`);
  setVerifyResult(r);
      pushLog("verify: " + JSON.stringify(r));
    } catch (e) {
      pushLog("verify error: " + (e as Error).message);
    } finally { setLoading(null); }
  };

  const doReset = async () => {
    if (!token.trim() || !newPassword) { pushLog("token 或 newPassword 为空"); return; }
    setLoading("reset");
    try {
  const r = await jsonFetch("/api/auth/reset", { method: "POST", body: JSON.stringify({ token, newPassword }) });
      pushLog("reset: " + JSON.stringify(r));
    } catch (e) {
      pushLog("reset error: " + (e as Error).message);
    } finally { setLoading(null); }
  };

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <h1>密码重置调试页面</h1>
      <section style={{border:"1px solid #ccc", padding:16, borderRadius:8, marginBottom:24}}>
        <h2>Step 1: Forgot</h2>
        <p>输入 登录名 / 邮箱 / 学号 / 工号（后端将自行解析）。</p>
        <input
          style={{width:"100%", padding:8, marginBottom:8}}
          placeholder="identifier"
          value={identifier}
          onChange={e=>setIdentifier(e.target.value)}
        />
        <button disabled={loading==="forgot"} onClick={doForgot}>
          {loading==="forgot"?"发送中...":"发送重置邮件"}
        </button>
      </section>

      <section style={{border:"1px solid #ccc", padding:16, borderRadius:8, marginBottom:24}}>
        <h2>Step 2: Verify</h2>
        <p>填写 token 验证有效性（可从邮件链接或服务端日志/数据库获取）。</p>
        <input
          style={{width:"100%", padding:8, marginBottom:8}}
          placeholder="token"
          value={token}
          onChange={e=>setToken(e.target.value)}
        />
        <button disabled={loading==="verify"} onClick={doVerify}>{loading==="verify"?"验证中...":"验证 Token"}</button>
        {verifyResult && (
          <div style={{marginTop:12, fontSize:14}}>
            <strong>验证结果:</strong> {JSON.stringify(verifyResult)}
          </div>
        )}
      </section>

      <section style={{border:"1px solid #ccc", padding:16, borderRadius:8, marginBottom:24}}>
        <h2>Step 3: Reset</h2>
        <p>使用 token 和新密码提交。</p>
        <input
          style={{width:"100%", padding:8, marginBottom:8}}
          placeholder="new password"
          type="password"
          value={newPassword}
          onChange={e=>setNewPassword(e.target.value)}
        />
        <button disabled={loading==="reset"} onClick={doReset}>{loading==="reset"?"重置中...":"提交重置"}</button>
      </section>

      <section style={{border:"1px solid #eee", padding:16, borderRadius:8}}>
        <h2>日志</h2>
        <div style={{maxHeight:260, overflow:"auto", fontSize:12, background:"#fafafa", padding:8}}>
          {log.map((l,i)=>(<div key={i}>{l}</div>))}
        </div>
      </section>
    </div>
  );
}
