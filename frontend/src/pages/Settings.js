import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, Button, PageHeader, SectionTitle } from "../components/shared";
import { INDIAN_STATES } from "../utils/helpers";

export default function Settings() {
  const { user, updateUser } = useAuth();

  const [biz, setBiz] = useState({ ...user?.business });
  const [inv, setInv] = useState({ ...user?.invoiceSettings });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  const setBizF = (k) => (e) => setBiz(f => ({ ...f, [k]: e.target.value }));
  const setInvF = (k) => (e) => setInv(f => ({ ...f, [k]: e.target.value }));

  const profileMut = useMutation({
    mutationFn: () => authAPI.updateProfile({ business: biz, invoiceSettings: inv }),
    onSuccess: (res) => { toast.success("Settings saved"); updateUser(res.data.data); },
    onError: () => toast.error("Failed to save settings"),
  });

  const pwdMut = useMutation({
    mutationFn: () => {
      if (pwd.newPassword !== pwd.confirm) throw new Error("Passwords don't match");
      return authAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
    },
    onSuccess: () => { toast.success("Password changed"); setPwd({ currentPassword: "", newPassword: "", confirm: "" }); },
    onError: (err) => toast.error(err.message || err.response?.data?.message || "Failed"),
  });

  const Field = ({ label, value, onChange, type = "text", placeholder, readOnly }) => (
    <div>
      <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} readOnly={readOnly} style={{ opacity: readOnly ? 0.6 : 1 }} />
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 760 }}>
      <PageHeader title="Settings" subtitle="Business configuration & preferences" />

      {/* Business Profile */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Business Profile</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Business Name *" value={biz.name} onChange={setBizF("name")} placeholder="Acme Technologies Pvt Ltd" />
          <Field label="GSTIN"           value={biz.gstin} onChange={setBizF("gstin")} placeholder="27AAPCS1000R1Z9" />
          <Field label="PAN"             value={biz.pan}   onChange={setBizF("pan")}   placeholder="AAPCS1000R" />
          <Field label="Phone"           value={biz.phone} onChange={setBizF("phone")} placeholder="+91 98765 43210" />
          <div>
            <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>State</label>
            <select value={biz.state || ""} onChange={setBizF("state")}>
              <option value="">Select state...</option>
              {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Email" value={user?.email} readOnly />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Registered Address</label>
          <textarea value={biz.address || ""} onChange={setBizF("address")} rows={2} placeholder="Full business address" />
        </div>
        <Button onClick={() => profileMut.mutate()} loading={profileMut.isPending}>Save Business Profile</Button>
      </Card>

      {/* Invoice Settings */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Invoice Settings</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <Field label="Invoice Prefix"  value={inv.prefix}      onChange={setInvF("prefix")}      placeholder="INV" />
          <Field label="Start Number"    value={inv.startNumber} onChange={setInvF("startNumber")} type="number" placeholder="1" />
          <Field label="Default Due Days" value={inv.dueDays}    onChange={setInvF("dueDays")}     type="number" placeholder="30" />
          <div>
            <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Default GST Rate</label>
            <select value={inv.defaultGst || 18} onChange={setInvF("defaultGst")}>
              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Currency</label>
            <select value={inv.currency || "INR"} onChange={setInvF("currency")}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Default Invoice Notes</label>
          <textarea value={inv.notes || ""} onChange={setInvF("notes")} rows={2} placeholder="Thank you for your business." />
        </div>
        <Button onClick={() => profileMut.mutate()} loading={profileMut.isPending}>Save Invoice Settings</Button>
      </Card>

      {/* Payment Gateway config (display only) */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Payment Gateways</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
          {[
            { label: "Razorpay Key ID",    value: process.env.REACT_APP_RAZORPAY_KEY_ID || "Not configured" },
            { label: "Razorpay Secret",    value: "••••••••••••••••" },
            { label: "Stripe Publishable", value: "pk_test_••••••••" },
            { label: "Stripe Secret",      value: "sk_test_••••••••" },
          ].map(f => <Field key={f.label} label={f.label} value={f.value} readOnly />)}
        </div>
        <div style={{ marginTop: 10, padding: 12, background: "var(--amber-dim)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 12, color: "var(--amber)" }}>
          ⚠ Gateway credentials are configured via environment variables on the backend for security.
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <SectionTitle>Change Password</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <Field label="Current Password" value={pwd.currentPassword} onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} type="password" />
          <Field label="New Password"     value={pwd.newPassword}     onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))}     type="password" />
          <Field label="Confirm New"      value={pwd.confirm}         onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}         type="password" />
        </div>
        <Button variant="secondary" onClick={() => pwdMut.mutate()} loading={pwdMut.isPending}>Update Password</Button>
      </Card>
    </div>
  );
}
