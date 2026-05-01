import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Mail, Phone, MapPin, Building } from "lucide-react";
import toast from "react-hot-toast";
import { customerAPI } from "../services/api";
import { fmt, fmtDate, INDIAN_STATES } from "../utils/helpers";
import { Card, Button, StatusBadge, Spinner, MetricCard, PageHeader, Modal } from "../components/shared";
import { TrendingUp, Clock, FileText } from "lucide-react";

function EditModal({ customer, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...customer });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const mut = useMutation({
    mutationFn: () => customerAPI.update(customer._id, form),
    onSuccess: () => {
      toast.success("Customer updated");
      qc.invalidateQueries(["customer", customer._id]);
      onClose();
    },
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
        {[
          { label: "Name *",   key: "name",    type: "text" },
          { label: "Email *",  key: "email",   type: "email" },
          { label: "Phone",    key: "phone",   type: "tel" },
          { label: "GSTIN",    key: "gstin",   type: "text" },
          { label: "PAN",      key: "pan",     type: "text" },
          { label: "City",     key: "city",    type: "text" },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>{f.label}</label>
            <input type={f.type} value={form[f.key] || ""} onChange={set(f.key)} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>State</label>
          <select value={form.state || ""} onChange={set("state")}>
            <option value="">Select...</option>
            {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>State Code</label>
          <input value={form.stateCode || ""} onChange={set("stateCode")} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Address</label>
        <textarea value={form.address || ""} onChange={set("address")} rows={2} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mut.mutate()} loading={mut.isPending}>Save Changes</Button>
      </div>
    </div>
  );
}

export default function CustomerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editModal, setEditModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerAPI.getOne(id).then(r => r.data),
  });

  if (isLoading) return <Spinner />;
  if (!data?.data) return <div style={{ padding: 24 }}>Customer not found</div>;

  const c        = data.data;
  const invoices = data.invoices || [];

  const totalBilled  = invoices.reduce((a, i) => a + i.total, 0);
  const outstanding  = invoices.reduce((a, i) => a + (i.balanceDue || 0), 0);
  const paidInvoices = invoices.filter(i => i.status === "paid").length;

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader
        title={c.name}
        subtitle={c.email}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
            <Button variant="secondary" onClick={() => setEditModal(true)}><Edit size={13} /> Edit</Button>
            <Button onClick={() => navigate(`/invoices/new?customer=${id}`)}>
              <Plus size={13} /> New Invoice
            </Button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
        {/* Profile card */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16, border: "1px solid var(--accent-border)" }}>
              {c.name[0]?.toUpperCase()}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>{c.name}</div>
            {c.contactPerson && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{c.contactPerson}</div>}

            {[
              { icon: Mail,     value: c.email },
              { icon: Phone,    value: c.phone },
              { icon: MapPin,   value: [c.address, c.city, c.state, c.pincode].filter(Boolean).join(", ") },
              { icon: Building, value: c.gstin ? `GSTIN: ${c.gstin}` : null },
            ].filter(r => r.value).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                <r.icon size={13} style={{ color: "var(--faint)", marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--muted)", wordBreak: "break-word" }}>{r.value}</span>
              </div>
            ))}

            {c.pan && (
              <div style={{ marginTop: 8, padding: 10, background: "var(--surface)", borderRadius: 6, fontSize: 11, color: "var(--faint)", fontFamily: "var(--mono)" }}>
                PAN: {c.pan}
              </div>
            )}
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <MetricCard label="Total Billed"   value={fmt(totalBilled)}  color="var(--text)"  icon={TrendingUp} />
            <MetricCard label="Outstanding"    value={fmt(outstanding)}  color={outstanding > 0 ? "var(--amber)" : "var(--green)"} icon={Clock} />
            <MetricCard label="Paid Invoices"  value={paidInvoices}      color="var(--green)" icon={FileText} />
          </div>
        </div>

        {/* Invoice history */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Invoice History ({invoices.length})</span>
          </div>
          {invoices.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>No invoices yet for this customer.</div>
          ) : (
            <table>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/invoices/${inv._id}`)}>
                    <td><span style={{ color: "var(--accent)", fontWeight: 600 }}>{inv.invoiceNumber}</span></td>
                    <td style={{ color: "var(--muted)" }}>{fmtDate(inv.issueDate)}</td>
                    <td style={{ color: inv.status === "overdue" ? "var(--red)" : "var(--muted)" }}>{fmtDate(inv.dueDate)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(inv.total)}</td>
                    <td style={{ textAlign: "right", color: (inv.balanceDue || 0) > 0 ? "var(--amber)" : "var(--green)", fontWeight: 600 }}>{fmt(inv.balanceDue || 0)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Customer" width={660}>
        <EditModal customer={c} onClose={() => setEditModal(false)} />
      </Modal>
    </div>
  );
}
