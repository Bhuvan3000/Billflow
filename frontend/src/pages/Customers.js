import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { customerAPI } from "../services/api";
import { fmt, INDIAN_STATES } from "../utils/helpers";
import { Card, Button, PageHeader, Spinner, EmptyState, Modal } from "../components/shared";

function CustomerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: "", email: "", phone: "", gstin: "", pan: "", state: "",
    stateCode: "", address: "", city: "", pincode: "", contactPerson: "", notes: "",
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
        {[
          { label: "Business Name *",   key: "name",          type: "text" },
          { label: "Email *",           key: "email",         type: "email" },
          { label: "Phone",             key: "phone",         type: "tel" },
          { label: "Contact Person",    key: "contactPerson", type: "text" },
          { label: "GSTIN",             key: "gstin",         type: "text", placeholder: "27AAPCS1000R1Z9" },
          { label: "PAN",               key: "pan",           type: "text", placeholder: "AAPCS1000R" },
          { label: "City",              key: "city",          type: "text" },
          { label: "Pincode",           key: "pincode",       type: "text" },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder || ""} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>State</label>
          <select value={form.state} onChange={set("state")}>
            <option value="">Select state...</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>State Code</label>
          <input value={form.stateCode} onChange={set("stateCode")} placeholder="27" />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Address</label>
        <textarea value={form.address} onChange={set("address")} rows={2} placeholder="Full billing address" />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, color: "var(--faint)", display: "block", marginBottom: 4 }}>Notes</label>
        <textarea value={form.notes} onChange={set("notes")} rows={2} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>
          {initial ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </div>
  );
}

export default function Customers() {
  const [search, setSearch]   = useState("");
  const [modal,  setModal]    = useState(false);
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => customerAPI.getAll({ search, limit: 50 }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (d) => customerAPI.create(d),
    onSuccess: () => { toast.success("Customer added"); qc.invalidateQueries(["customers"]); setModal(false); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const customers = data?.data || [];

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader
        title="Customers"
        subtitle={`${data?.total || 0} clients`}
        actions={
          <Button onClick={() => setModal(true)}>
            <Plus size={14} /> Add Customer
          </Button>
        }
      />

      <div style={{ position: "relative", maxWidth: 320, marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
        <input placeholder="Search by name, email, GSTIN..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>

      {isLoading ? <Spinner /> : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" description="Add your first customer to start billing."
          action={<Button onClick={() => setModal(true)}><Plus size={13} /> Add Customer</Button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {customers.map(c => (
            <Card key={c._id} style={{ cursor: "pointer", transition: "border-color 0.15s" }} onClick={() => navigate(`/customers/${c._id}`)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.email}</div>
                </div>
                {c.state && (
                  <span style={{ fontSize: 10, color: "var(--faint)", background: "var(--surface)", padding: "3px 8px", borderRadius: 12, border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    {c.state}
                  </span>
                )}
              </div>
              {c.gstin && (
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)", marginBottom: 10, letterSpacing: 0.5 }}>{c.gstin}</div>
              )}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--faint)", marginBottom: 2 }}>Total Billed</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(c.totalBilled || 0)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--faint)", marginBottom: 2 }}>Outstanding</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: (c.outstanding || 0) > 0 ? "var(--amber)" : "var(--green)" }}>
                    {fmt(c.outstanding || 0)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--faint)", marginBottom: 2 }}>Invoices</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>{c.invoiceCount || 0}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Customer" width={660}>
        <CustomerForm onSave={createMut.mutate} onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
}
