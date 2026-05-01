import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, AlertTriangle, Users, DollarSign, CheckCircle } from "lucide-react";
import { dashboardAPI } from "../services/api";
import { fmt, fmtShort, fmtDate } from "../utils/helpers";
import { MetricCard, Card, StatusBadge, Spinner, SectionTitle, PageHeader } from "../components/shared";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardAPI.get().then(r => r.data.data),
  });
  const navigate = useNavigate();

  if (isLoading) return <Spinner />;

  const { metrics = {}, monthlyRevenue = [], recentInvoices = [], invoiceStatusBreakdown = [], overdueInvoices = [] } = data || {};

  const chartData = monthlyRevenue.map(m => ({
    month: MONTH_NAMES[(m._id?.month || 1) - 1],
    revenue: m.revenue || 0,
  }));

  const statusColors = { paid: "#10b981", sent: "#4f8ef7", overdue: "#ef4444", partial: "#f59e0b", draft: "#64748b", viewed: "#60a5fa" };
  const pieData = invoiceStatusBreakdown
    .filter(s => s._id)
    .map(s => ({ name: s._id, value: s.count, fill: statusColors[s._id] || "#64748b" }));

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader title="Dashboard" subtitle={`Financial overview · ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`} />

      {/* Metrics */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Total Revenue" value={fmtShort(metrics.totalRevenue)} sub="All collected payments" color="var(--green)" icon={TrendingUp} />
        <MetricCard label="Outstanding"   value={fmtShort(metrics.totalOutstanding)} sub="Pending collection" color="var(--amber)" icon={Clock} />
        <MetricCard label="This Month"    value={fmtShort(metrics.thisMonthPayments)} sub="Collected this month" color="var(--accent)" icon={DollarSign} />
        <MetricCard label="Overdue"       value={metrics.overdueCount || 0} sub="Need attention" color={metrics.overdueCount > 0 ? "var(--red)" : "var(--green)"} icon={AlertTriangle} />
        <MetricCard label="Customers"     value={metrics.customerCount || 0} sub="Active clients" color="var(--purple)" icon={Users} />
        <MetricCard label="Paid Invoices" value={metrics.paidCount || 0} sub="Successfully collected" color="var(--green)" icon={CheckCircle} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>Monthly Revenue (FY {new Date().getFullYear()})</SectionTitle>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f8ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => fmtShort(v)} width={60} />
                <Tooltip formatter={v => [fmt(v), "Revenue"]} contentStyle={{ background: "#1c2333", border: "1px solid #2a3348", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#4f8ef7" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontSize: 13 }}>No revenue data yet</div>
          )}
        </Card>

        <Card>
          <SectionTitle>Invoice Breakdown</SectionTitle>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: d.fill, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "var(--muted)", textTransform: "capitalize" }}>{d.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontSize: 13 }}>No data yet</div>
          )}
        </Card>
      </div>

      {/* Tables row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent invoices */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <SectionTitle action={<span onClick={() => navigate("/invoices")} style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer" }}>View all →</span>}>Recent Invoices</SectionTitle>
          </div>
          {recentInvoices.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>No invoices yet</div>
            : recentInvoices.map(inv => (
              <div key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: 11, color: "var(--faint)" }}>{inv.customer?.name} · {fmtDate(inv.issueDate)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(inv.total)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))
          }
        </Card>

        {/* Overdue invoices */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <SectionTitle>
              <span>Overdue Invoices {overdueInvoices.length > 0 && <span style={{ color: "var(--red)", marginLeft: 4 }}>({overdueInvoices.length})</span>}</span>
            </SectionTitle>
          </div>
          {overdueInvoices.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: "var(--green)", fontSize: 13 }}>✓ No overdue invoices</div>
            : overdueInvoices.map(inv => (
              <div key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)" }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: 11, color: "var(--faint)" }}>{inv.customer?.name} · Due {fmtDate(inv.dueDate)}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--red)" }}>{fmt(inv.balanceDue)}</span>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}
