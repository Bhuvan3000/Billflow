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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto" }}>
        <React.Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <div style={{ width: 28, height: 28, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          </div>
        }>
          {children}
        </React.Suspense>
      </main>
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
