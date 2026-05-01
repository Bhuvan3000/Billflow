import React, { useState } from "react";
import { Link } from "react-router-dom";
import { IndianRupee, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/shared";

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "admin@billflow.in", password: "Admin@123" });
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const ok = await login(form.email, form.password);
    if (!ok) setErr("Invalid email or password.");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "var(--accent)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <IndianRupee size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>BillFlow</h1>
          <p style={{ color: "var(--faint)", fontSize: 13, marginTop: 4 }}>GST-Ready Billing Platform</p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 24 }}>Sign in to your account</h2>

          {err && <div style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{err}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ paddingLeft: 32 }} required />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ paddingLeft: 32 }} required />
              </div>
            </div>
            <Button type="submit" loading={loading} style={{ width: "100%", justifyContent: "center" }}>
              Sign In
            </Button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--faint)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none" }}>Create one</Link>
          </p>

          <div style={{ marginTop: 20, padding: 12, background: "var(--surface)", borderRadius: "var(--radius)", fontSize: 11, color: "var(--faint)", textAlign: "center" }}>
            Demo: admin@billflow.in / Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}
