import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { paymentAPI } from "../services/api";
import { fmt, fmtDate } from "../utils/helpers";
import { Card, StatusBadge, Spinner, PageHeader, MetricCard, FilterBar } from "../components/shared";
import { TrendingUp, CreditCard, RefreshCw } from "lucide-react";

const METHODS = [
  { value: "all",           label: "All Methods" },
  { value: "razorpay",      label: "Razorpay" },
  { value: "upi",           label: "UPI" },
  { value: "neft",          label: "NEFT" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash",          label: "Cash" },
];

const GATEWAYS = [
  { name: "Razorpay",   icon: "🔵", status: "Connected",     color: "var(--green)" },
  { name: "PayPal",     icon: "🔷", status: "Not Connected", color: "var(--faint)" },
  { name: "UPI / NEFT", icon: "🟢", status: "Active",        color: "var(--green)" },
];

export default function Payments() {
  const [method, setMethod] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["payments", method],
    queryFn: () => paymentAPI.getAll({ ...(method !== "all" && { method }), limit: 50 }).then(r => r.data),
  });

  const payments = data?.data || [];
  const total    = payments.filter(p => p.status === "success").reduce((a, b) => a + b.amount, 0);
  const count    = payments.filter(p => p.status === "success").length;
  const avgAmt   = count > 0 ? total / count : 0;

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader title="Payments" subtitle="Transaction history & gateway logs" />

      {/* Metrics */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Total Collected"  value={fmt(total)}   color="var(--green)"  icon={TrendingUp} sub="Successful payments" />
        <MetricCard label="Transactions"     value={count}        color="var(--accent)" icon={CreditCard} sub="Successful" />
        <MetricCard label="Average Payment"  value={fmt(avgAmt)}  color="var(--purple)" icon={RefreshCw}  sub="Per transaction" />
      </div>

      {/* Gateway status */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Payment Gateways</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {GATEWAYS.map(g => (
            <div key={g.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 140, textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{g.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: g.color, fontWeight: 500 }}>{g.status}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter + table */}
      <FilterBar filters={METHODS} active={method} onChange={setMethod} />

      <Card padding="0">
        {isLoading ? <Spinner /> : payments.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>No payments found</div>
        ) : (
          <table>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th>Receipt #</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)" }}>{p.receiptNumber || "—"}</td>
                  <td><span style={{ color: "var(--accent)", fontWeight: 600 }}>{p.invoice?.invoiceNumber || "—"}</span></td>
                  <td style={{ color: "var(--muted)" }}>{p.customer?.name || "—"}</td>
                  <td>
                    <span style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 10px", fontSize: 11, textTransform: "capitalize" }}>
                      {p.method?.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)" }}>{p.gatewayPaymentId || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--green)" }}>{fmt(p.amount)}</td>
                  <td style={{ color: "var(--muted)" }}>{fmtDate(p.paidAt || p.createdAt)}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Webhook log */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Recent Webhook Events</div>
        {[
          { event: "payment.captured",      source: "Razorpay", time: "2025-03-01 14:22:31", status: "processed" },
          { event: "subscription.renewed",  source: "Razorpay", time: "2025-02-15 00:00:01", status: "processed" },
        ].map((w, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>{w.event}</span>
              <span style={{ fontSize: 11, color: "var(--faint)" }}>{w.source}</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--faint)" }}>{w.time}</span>
              <span style={{ fontSize: 10, background: w.status === "processed" ? "var(--green-dim)" : "var(--amber-dim)", color: w.status === "processed" ? "var(--green)" : "var(--amber)", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>{w.status}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
