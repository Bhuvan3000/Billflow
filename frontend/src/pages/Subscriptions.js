import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { subscriptionAPI, customerAPI } from "../services/api";
import { fmt, fmtDate } from "../utils/helpers";
import { Card, Button, StatusBadge, Spinner, PageHeader, MetricCard, Modal, SectionTitle } from "../components/shared";
import { TrendingUp, Users, Zap } from "lucide-react";

function NewSubscriptionModal({ plans, onClose }) {
  const qc = useQueryClient();
  const { data: custData } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => customerAPI.getAll({ limit: 100 }).then(r => r.data),
  });
  const [form, setForm] = useState({ customer: "", plan: "", autoRenew: true });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const mut = useMutation({
    mutationFn: () => subscriptionAPI.create(form),
    onSuccess: () => { toast.success("Subscription created"); qc.invalidateQueries(["subscriptions"]); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const customers = custData?.data || [];

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 5 }}>Customer *</label>
        <select value={form.customer} onChange={set("customer")}>
          <option value="">Select customer...</option>
          {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 5 }}>Plan *</label>
        <select value={form.plan} onChange={set("plan")}>
          <option value="">Select plan...</option>
          {plans.map(p => <option key={p._id} value={p._id}>{p.name} — {fmt(p.price)}/{p.interval}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <input type="checkbox" id="autoRenew" checked={form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))} style={{ width: "auto" }} />
        <label htmlFor="autoRenew" style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>Enable auto-renewal</label>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mut.mutate()} loading={mut.isPending} disabled={!form.customer || !form.plan}>Create Subscription</Button>
      </div>
    </div>
  );
}

export default function Subscriptions() {
  const [modal, setModal] = useState(false);
  const qc = useQueryClient();

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => subscriptionAPI.getPlans().then(r => r.data),
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionAPI.getAll().then(r => r.data),
  });

  const cancelMut = useMutation({
    mutationFn: (id) => subscriptionAPI.cancel(id),
    onSuccess: () => { toast.success("Subscription cancelled"); qc.invalidateQueries(["subscriptions"]); },
  });

  const plans = plansData?.data || [];
  const subs  = subsData?.data  || [];

  const mrr = subs
    .filter(s => s.status === "active")
    .reduce((a, s) => a + (s.plan?.price || 0), 0);

  const activeSubs = subs.filter(s => s.status === "active").length;

  if (plansLoading || subsLoading) return <Spinner />;

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader
        title="Subscriptions"
        subtitle="Recurring billing & plan management"
        actions={<Button onClick={() => setModal(true)}><Plus size={14} /> New Subscription</Button>}
      />

      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Monthly Recurring Revenue" value={fmt(mrr)}       color="var(--green)"  icon={TrendingUp} />
        <MetricCard label="Active Subscribers"         value={activeSubs}     color="var(--accent)" icon={Users}      />
        <MetricCard label="Annual Run Rate"            value={fmt(mrr * 12)} color="var(--purple)" icon={Zap}        />
      </div>

      {/* Plans */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Subscription Plans</SectionTitle>
        {plans.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>No plans created yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {plans.map(plan => {
              const planSubs = subs.filter(s => s.plan?._id === plan._id && s.status === "active").length;
              return (
                <div key={plan._id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: plan.color || "var(--accent)" }} />
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: plan.color || "var(--accent)" }}>{fmt(plan.price)}</span>
                    <span style={{ fontSize: 11, color: "var(--faint)" }}>/{plan.interval}</span>
                  </div>
                  {plan.features?.map(f => (
                    <div key={f} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                      <span style={{ color: plan.color || "var(--accent)", fontSize: 11 }}>✓</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{f}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--faint)" }}>{planSubs} active</span>
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{fmt(plan.price * planSubs)}/mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Subscriptions table */}
      <Card padding="0">
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <SectionTitle>Active Subscriptions ({subs.length})</SectionTitle>
        </div>
        {subs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>No subscriptions yet.</div>
        ) : (
          <table>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th>Customer</th>
                <th>Plan</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Interval</th>
                <th>Start Date</th>
                <th>Next Billing</th>
                <th>Auto-Renew</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 500 }}>{s.customer?.name || "—"}</td>
                  <td>
                    <span style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 10px", fontSize: 11 }}>
                      {s.plan?.name || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--green)" }}>{fmt(s.plan?.price || 0)}</td>
                  <td style={{ color: "var(--muted)", textTransform: "capitalize" }}>{s.plan?.interval || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{fmtDate(s.startDate)}</td>
                  <td style={{ color: "var(--amber)" }}>{fmtDate(s.nextBillingDate)}</td>
                  <td>
                    <span style={{ fontSize: 11, color: s.autoRenew ? "var(--green)" : "var(--faint)" }}>
                      {s.autoRenew ? "● Auto" : "○ Manual"}
                    </span>
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    {s.status === "active" && (
                      <button onClick={() => { if (window.confirm("Cancel this subscription?")) cancelMut.mutate(s._id); }} style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                        <X size={10} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="New Subscription">
        <NewSubscriptionModal plans={plans} onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
}
