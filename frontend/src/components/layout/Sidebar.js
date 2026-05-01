import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Users, CreditCard, RefreshCw, BarChart2, Settings, LogOut, IndianRupee } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/",             icon: LayoutDashboard, label: "Dashboard" },
  { to: "/invoices",     icon: FileText,         label: "Invoices" },
  { to: "/customers",    icon: Users,             label: "Customers" },
  { to: "/payments",     icon: CreditCard,        label: "Payments" },
  { to: "/subscriptions",icon: RefreshCw,         label: "Subscriptions" },
  { to: "/reports",      icon: BarChart2,         label: "Reports" },
  { to: "/settings",     icon: Settings,          label: "Settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside style={{
      width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", flexShrink: 0,
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14 }}>BillFlow</div>
            <div style={{ color: "var(--faint)", fontSize: 10 }}>GST-Ready Billing</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: "var(--radius)",
            marginBottom: 2, textDecoration: "none",
            background:    isActive ? "var(--accent-dim)" : "transparent",
            border:        isActive ? "1px solid var(--accent-border)" : "1px solid transparent",
            color:         isActive ? "var(--accent)" : "var(--muted)",
            fontWeight:    isActive ? 600 : 400,
            fontSize:      13,
            transition:    "all 0.15s",
          })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ background: "var(--card)", borderRadius: 10, padding: 12, border: "1px solid var(--border)", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: "var(--faint)" }}>{user?.business?.name || user?.email}</div>
        </div>
        <button onClick={handleLogout} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", background: "transparent", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", color: "var(--faint)", fontSize: 12, cursor: "pointer",
        }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
