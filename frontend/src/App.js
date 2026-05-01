import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/layout/Sidebar";

// Pages (lazy-loaded)
const Login         = React.lazy(() => import("./pages/Login"));
const Register      = React.lazy(() => import("./pages/Register"));
const Dashboard     = React.lazy(() => import("./pages/Dashboard"));
const Invoices      = React.lazy(() => import("./pages/Invoices"));
const InvoiceForm   = React.lazy(() => import("./pages/InvoiceForm"));
const InvoiceView   = React.lazy(() => import("./pages/InvoiceView"));
const Customers     = React.lazy(() => import("./pages/Customers"));
const CustomerView  = React.lazy(() => import("./pages/CustomerView"));
const Payments      = React.lazy(() => import("./pages/Payments"));
const Subscriptions = React.lazy(() => import("./pages/Subscriptions"));
const Reports       = React.lazy(() => import("./pages/Reports"));
const Settings      = React.lazy(() => import("./pages/Settings"));

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* 🔥 FULL HEADER */}
      <div style={{
        height: 60,
        background: "#0f172a",
        display: "flex",
        alignItems: "center"
      }}>

        {/* LEFT = Sidebar width (align perfectly) */}
        <div style={{
          width: 220,   // same as sidebar
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            background: "#000",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}>
            ₹
          </div>

          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
              BillFlow
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 10 }}>
              GST-Ready Billing
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (empty for now or future search/profile) */}
        <div style={{ flex: 1 }} />

      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1 }}>

        <Sidebar />

        <main style={{
          flex: 1,
          background: "#f5f6f8",
          padding: 16
        }}>
          <React.Suspense fallback={<div>Loading...</div>}>
            {children}
          </React.Suspense>
        </main>

      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={null}>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Private */}
            <Route path="/" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
            <Route path="/invoices"              element={<PrivateRoute><AppLayout><Invoices /></AppLayout></PrivateRoute>} />
            <Route path="/invoices/new"          element={<PrivateRoute><AppLayout><InvoiceForm /></AppLayout></PrivateRoute>} />
            <Route path="/invoices/:id/edit"     element={<PrivateRoute><AppLayout><InvoiceForm /></AppLayout></PrivateRoute>} />
            <Route path="/invoices/:id"          element={<PrivateRoute><AppLayout><InvoiceView /></AppLayout></PrivateRoute>} />
            <Route path="/customers"             element={<PrivateRoute><AppLayout><Customers /></AppLayout></PrivateRoute>} />
            <Route path="/customers/:id"         element={<PrivateRoute><AppLayout><CustomerView /></AppLayout></PrivateRoute>} />
            <Route path="/payments"              element={<PrivateRoute><AppLayout><Payments /></AppLayout></PrivateRoute>} />
            <Route path="/subscriptions"         element={<PrivateRoute><AppLayout><Subscriptions /></AppLayout></PrivateRoute>} />
            <Route path="/reports"               element={<PrivateRoute><AppLayout><Reports /></AppLayout></PrivateRoute>} />
            <Route path="/settings"              element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
