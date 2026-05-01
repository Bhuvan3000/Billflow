import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  RefreshCw,
  BarChart2,
  Settings,
  LogOut,
  IndianRupee
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/subscriptions", icon: RefreshCw, label: "Subscriptions" },
  { to: "/reports", icon: BarChart2, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      style={{
        width: 220,
        background: "#f8fafc",
        color: "#111827",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0
      }}
    >

      {/* Nav */}
      <nav style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "8px",
              marginBottom: 4,
              textDecoration: "none",

              background: isActive ? "#e5e7eb" : "transparent",
              color: isActive ? "#111827" : "#374151",

              fontWeight: isActive ? 600 : 500,
              fontSize: 13,
              transition: "all 0.15s"
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
        
        {/* ✅ WHITE USER CARD */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 10,
            padding: 12,
            border: "1px solid #e5e7eb",
            marginBottom: 8
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 2
            }}
          >
            {user?.name}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {user?.business?.name || user?.email}
          </div>
        </div>

        {/* ✅ CLEAN SIGN OUT BUTTON */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            color: "#111827",
            fontSize: 12,
            cursor: "pointer",
            transition: "0.15s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}