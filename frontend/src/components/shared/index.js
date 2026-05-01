import React from "react";
import { STATUS_CONFIG } from "../../utils/helpers";

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, padding = "20px", className }) {
  return (
    <div className={className} style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding, ...style,
    }}>
      {children}
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
        {Icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color: color || "var(--accent)" }} />
        </div>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", onClick, disabled, style, type = "button", loading }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font)",
    fontWeight: 500, cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1, border: "none",
    borderRadius: "var(--radius)", transition: "all 0.15s", whiteSpace: "nowrap",
  };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "10px 22px", fontSize: 14 } };
  const variants = {
    primary:  { background: "var(--accent)", color: "#fff" },
    secondary:{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" },
    danger:   { background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.3)" },
    success:  { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.3)" },
    ghost:    { background: "transparent", color: "var(--muted)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {loading ? <span style={{ width: 12, height: 12, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} /> : null}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "var(--faint)", marginBottom: 5, fontWeight: 500 }}>{label}</label>}
      <input {...props} style={{ ...(props.style) }} />
      {error && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{error}</span>}
      {hint  && <span style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, display: "block" }}>{hint}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "var(--faint)", marginBottom: 5, fontWeight: 500 }}>{label}</label>}
      <select {...props}>{children}</select>
      {error && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{error}</span>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: size, height: size, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
      {Icon && <Icon size={40} style={{ color: "var(--border)", marginBottom: 16 }} />}
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: "var(--faint)", marginBottom: 20 }}>{description}</div>}
      {action}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--faint)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
export function FilterBar({ filters, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {filters.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)} style={{
          background: active === f.value ? "var(--accent-dim)" : "transparent",
          border: `1px solid ${active === f.value ? "var(--accent)" : "var(--border)"}`,
          color: active === f.value ? "var(--accent)" : "var(--muted)",
          borderRadius: 20, padding: "5px 14px", fontSize: 12,
          fontWeight: active === f.value ? 600 : 400, cursor: "pointer", textTransform: "capitalize",
        }}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{children}</span>
      {action}
    </div>
  );
}
