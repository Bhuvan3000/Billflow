import React, { useState } from "react";
import { Link } from "react-router-dom";
import { IndianRupee } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/shared";

export default function Register() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", businessName: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(form);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: "var(--accent)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <IndianRupee size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Create your account</h1>
          <p style={{ color: "var(--faint)", fontSize: 13, marginTop: 4 }}>Start billing in minutes</p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 32 }}>
          <form onSubmit={handleSubmit}>
            {[
              { label: "Full Name",      key: "name",         type: "text",     placeholder: "Rajesh Kumar" },
              { label: "Business Name",  key: "businessName", type: "text",     placeholder: "Acme Technologies" },
              { label: "Email",          key: "email",        type: "email",    placeholder: "you@company.in" },
              { label: "Password",       key: "password",     type: "password", placeholder: "Min. 6 characters" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} required />
              </div>
            ))}
            <Button type="submit" loading={loading} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              Create Account
            </Button>
          </form>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--faint)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
