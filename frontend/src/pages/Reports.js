import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { reportAPI } from "../services/api";
import { fmt, fmtDate } from "../utils/helpers";
import { Card, StatusBadge, Spinner, PageHeader, MetricCard, SectionTitle, FilterBar } from "../components/shared";
import { TrendingUp, FileText, AlertTriangle } from "lucide-react";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TABS = [
  { value: "revenue", label: "Revenue Report" },
  { value: "gst",     label: "GST Summary"    },
  { value: "aging",   label: "Aging Report"   },
];

export default function Reports() {
  const [tab, setTab] = useState("revenue");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", tab],
    queryFn: () => reportAPI.get({ type: tab }).then(r => r.data.data),
  });

  const renderRevenue = () => {
    if (isLoading) return <Spinner />;
    const rows = data || [];
    const chartData = rows.map(r => ({
      month: MONTH_NAMES[(r._id?.month || 1) - 1] + " " + (r._id?.year || ""),
      revenue: r.revenue || 0,
      tax: r.totalTax || 0,
    }));
    const totalRevenue = rows.reduce((a, r) => a + (r.revenue || 0), 0);
    const totalTax     = rows.reduce((a, r) => a + (r.totalTax || 0), 0);
    const totalInvoices= rows.reduce((a, r) => a + (r.invoiceCount || 0), 0);

    return (
      <>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <MetricCard label="Total Revenue"   value={fmt(totalRevenue)}   color="var(--green)"  icon={TrendingUp} />
          <MetricCard label="Total GST Paid"  value={fmt(totalTax)}       color="var(--amber)"  icon={FileText}   />
          <MetricCard label="Paid Invoices"   value={totalInvoices}       color="var(--accent)" icon={FileText}   />
        </div>
        <Card>
          <SectionTitle>Monthly Revenue</SectionTitle>
          {chartData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontSize: 13 }}>No revenue data found</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} width={55} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#1c2333", border: "1px solid #2a3348", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </>
    );
  };

  const renderGST = () => {
    if (isLoading) return <Spinner />;
    const { invoices = [], totals = {} } = data || {};

    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "CGST Collected", value: fmt(totals.cgst || 0),      color: "var(--accent)"  },
            { label: "SGST Collected", value: fmt(totals.sgst || 0),      color: "var(--teal)"    },
            { label: "IGST Collected", value: fmt(totals.igst || 0),      color: "var(--purple)"  },
            { label: "Total GST",      value: fmt(totals.totalTax || 0),  color: "var(--green)"   },
          ].map(g => (
            <Card key={g.label}>
              <div style={{ fontSize: 10, color: "var(--faint)", marginBottom: 6, letterSpacing: 0.5 }}>{g.label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{g.value}</div>
            </Card>
          ))}
        </div>

        <Card padding="0">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <SectionTitle>GSTR-1 — Outward Supplies</SectionTitle>
          </div>
          <table>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>GSTIN</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Taxable Value</th>
                <th style={{ textAlign: "right" }}>CGST</th>
                <th style={{ textAlign: "right" }}>SGST</th>
                <th style={{ textAlign: "right" }}>IGST</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td style={{ color: "var(--accent)", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td style={{ color: "var(--text)" }}>{inv.customer?.name || "—"}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)" }}>{inv.customer?.gstin || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{fmtDate(inv.issueDate)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(inv.taxableAmount)}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>{fmt(inv.cgst)}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>{fmt(inv.sgst)}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>{fmt(inv.igst)}</td>
                  <td>
                    <span style={{ fontSize: 10, background: inv.igst ? "var(--purple-dim)" : "rgba(20,184,166,0.1)", color: inv.igst ? "var(--purple)" : "var(--teal)", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                      {inv.igst ? "IGST" : "CGST+SGST"}
                    </span>
                  </td>
                  <td><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--surface)", borderTop: "2px solid var(--border)" }}>
                <td colSpan={4} style={{ fontWeight: 700, color: "var(--text)" }}>TOTALS</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totals.taxableAmount)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totals.cgst)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totals.sgst)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totals.igst)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </Card>

        <div style={{ marginTop: 12, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", borderRadius: 10, padding: 14, fontSize: 12, color: "var(--accent)" }}>
          ℹ GSTR-1 filing due: 11th of following month · GSTR-3B due: 20th of following month · Export via JSON coming soon
        </div>
      </>
    );
  };

  const renderAging = () => {
    if (isLoading) return <Spinner />;
    const buckets = data || {};
    const bucketConfig = [
      { key: "0-30",  label: "0–30 days",            color: "var(--green)" },
      { key: "31-60", label: "31–60 days",            color: "var(--amber)" },
      { key: "61-90", label: "61–90 days",            color: "var(--red)"   },
      { key: "90+",   label: "90+ days (Critical)",   color: "#dc2626"      },
    ];
    const maxAmt = Math.max(...bucketConfig.map(b => (buckets[b.key] || []).reduce((a, i) => a + i.balanceDue, 0)), 1);

    return (
      <>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          {bucketConfig.map(b => {
            const invs = buckets[b.key] || [];
            const total = invs.reduce((a, i) => a + (i.balanceDue || 0), 0);
            return <MetricCard key={b.key} label={b.label} value={fmt(total)} sub={`${invs.length} invoice(s)`} color={b.color} icon={AlertTriangle} />;
          })}
        </div>

        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Aging Visual</SectionTitle>
          {bucketConfig.map(b => {
            const invs  = buckets[b.key] || [];
            const total = invs.reduce((a, i) => a + (i.balanceDue || 0), 0);
            return (
              <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 130, fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{b.label}</div>
                <div style={{ flex: 1, height: 24, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: b.color, width: `${(total / maxAmt) * 100}%`, borderRadius: 4, opacity: 0.75, transition: "width 0.4s" }} />
                </div>
                <div style={{ width: 110, fontSize: 13, fontWeight: 600, color: b.color, textAlign: "right" }}>{fmt(total)}</div>
                <div style={{ width: 50, fontSize: 11, color: "var(--faint)", textAlign: "right" }}>{invs.length} inv</div>
              </div>
            );
          })}
        </Card>

        {bucketConfig.map(b => {
          const invs = buckets[b.key] || [];
          if (invs.length === 0) return null;
          return (
            <Card key={b.key} padding="0" style={{ marginBottom: 14 }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: b.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: b.color }}>{b.label}</span>
                <span style={{ fontSize: 12, color: "var(--faint)", marginLeft: 4 }}>({invs.length} invoice{invs.length > 1 ? "s" : ""})</span>
              </div>
              <table>
                <thead>
                  <tr style={{ background: "var(--surface)" }}>
                    <th>Invoice #</th><th>Customer</th><th>Email</th><th>Due Date</th><th style={{ textAlign: "right" }}>Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invs.map(inv => (
                    <tr key={inv._id}>
                      <td style={{ color: "var(--accent)", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                      <td>{inv.customer?.name}</td>
                      <td style={{ color: "var(--faint)" }}>{inv.customer?.email}</td>
                      <td style={{ color: b.color }}>{fmtDate(inv.dueDate)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: b.color }}>{fmt(inv.balanceDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          );
        })}
      </>
    );
  };

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader title="Financial Reports" subtitle="GST summaries · Revenue · Receivable aging" />
      <FilterBar filters={TABS} active={tab} onChange={setTab} />
      {tab === "revenue" && renderRevenue()}
      {tab === "gst"     && renderGST()}
      {tab === "aging"   && renderAging()}
    </div>
  );
}
