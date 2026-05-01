import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { invoiceAPI, customerAPI } from "../services/api";
import { fmt, INDIAN_STATES } from "../utils/helpers";
import { Card, Button, PageHeader } from "../components/shared";

const EMPTY_ITEM = { description: "", hsn: "", quantity: 1, rate: 0, discount: 0, taxRate: 18 };

const calcTotals = (items, gstType) => {
  let subtotal = 0, discountTotal = 0, taxableAmount = 0, totalTax = 0;
  items.forEach(it => {
    const gross = it.quantity * it.rate;
    const disc  = gross * (it.discount || 0) / 100;
    const taxable = gross - disc;
    subtotal      += gross;
    discountTotal += disc;
    taxableAmount += taxable;
    totalTax      += taxable * (it.taxRate || 18) / 100;
  });
  const isIntra = gstType === "intra";
  return {
    subtotal:     +subtotal.toFixed(2),
    discountTotal:+discountTotal.toFixed(2),
    taxableAmount:+taxableAmount.toFixed(2),
    cgst:         isIntra ? +(totalTax / 2).toFixed(2) : 0,
    sgst:         isIntra ? +(totalTax / 2).toFixed(2) : 0,
    igst:         isIntra ? 0 : +totalTax.toFixed(2),
    totalTax:     +totalTax.toFixed(2),
    total:        +(taxableAmount + totalTax).toFixed(2),
  };
};

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const today = new Date().toISOString().split("T")[0];
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    customer: "", issueDate: today, dueDate: due30, gstType: "intra",
    paymentTerms: "Net 30", notes: "", terms: "",
    items: [{ ...EMPTY_ITEM }],
  });
  const [totals, setTotals] = useState({ subtotal: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, total: 0, discountTotal: 0 });

  // Load existing invoice for edit
  const { data: existing } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceAPI.getOne(id).then(r => r.data.data),
    enabled: isEdit,
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => customerAPI.getAll({ limit: 100 }).then(r => r.data),
  });

  useEffect(() => {
    if (existing) {
      setForm({
        customer: existing.customer?._id || "",
        issueDate: existing.issueDate?.split("T")[0] || today,
        dueDate:   existing.dueDate?.split("T")[0] || due30,
        gstType:   existing.gstType || "intra",
        paymentTerms: existing.paymentTerms || "Net 30",
        notes:     existing.notes || "",
        terms:     existing.terms || "",
        items:     existing.items?.map(it => ({
          description: it.description, hsn: it.hsn, quantity: it.quantity,
          rate: it.rate, discount: it.discount || 0, taxRate: it.taxRate || 18,
        })) || [{ ...EMPTY_ITEM }],
      });
      const t = calcTotals(existing.items || [], existing.gstType || "intra");
      setTotals(t);
    }
  }, [existing]);

  const updateItems = (newItems, gstType) => {
    const t = calcTotals(newItems, gstType || form.gstType);
    setTotals(t);
    return newItems;
  };

  const setItem = (idx, field, val) => {
    const items = form.items.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: ["quantity", "rate", "discount", "taxRate"].includes(field) ? Number(val) : val };
      return updated;
    });
    setForm(f => ({ ...f, items: updateItems(items) }));
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, items: updateItems(items.length ? items : [{ ...EMPTY_ITEM }]) }));
  };

  const setGstType = (gt) => {
    setForm(f => ({ ...f, gstType: gt }));
    setTotals(calcTotals(form.items, gt));
  };

  const saveMut = useMutation({
    mutationFn: (data) => isEdit ? invoiceAPI.update(id, data) : invoiceAPI.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      qc.invalidateQueries(["invoices"]);
      navigate(`/invoices/${res.data.data._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  const handleSave = (status) => {
    if (!form.customer) { toast.error("Please select a customer"); return; }
    if (form.items.some(it => !it.description)) { toast.error("All items need a description"); return; }
    saveMut.mutate({ ...form, status });
  };

  const customers = customersData?.data || [];

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 960 }}>
      <PageHeader
        title={isEdit ? "Edit Invoice" : "New Invoice"}
        subtitle={isEdit ? `Editing ${existing?.invoiceNumber || ""}` : "Create a new GST invoice"}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Invoice Details */}
        <Card>
          <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>INVOICE DETAILS</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Issue Date</label>
            <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Payment Terms</label>
            <select value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}>
              {["Net 15","Net 30","Net 45","Net 60","Due on Receipt"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </Card>

        {/* Customer + GST */}
        <Card>
          <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>CUSTOMER & GST</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Customer *</label>
            <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>GST Type</label>
            <select value={form.gstType} onChange={e => setGstType(e.target.value)}>
              <option value="intra">Intra-State (CGST + SGST @ 18%)</option>
              <option value="inter">Inter-State (IGST @ 18%)</option>
            </select>
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Thank you for your business." />
          </div>
        </Card>
      </div>

      {/* Line Items */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>LINE ITEMS</div>
        <table>
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              <th style={{ width: "35%" }}>Description *</th>
              <th style={{ width: "10%" }}>HSN/SAC</th>
              <th style={{ textAlign: "right", width: "8%" }}>Qty</th>
              <th style={{ textAlign: "right", width: "12%" }}>Rate (₹)</th>
              <th style={{ textAlign: "right", width: "8%" }}>Disc%</th>
              <th style={{ textAlign: "right", width: "8%" }}>GST%</th>
              <th style={{ textAlign: "right", width: "12%" }}>Amount</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {form.items.map((it, idx) => {
              const gross   = it.quantity * it.rate;
              const disc    = gross * (it.discount || 0) / 100;
              const amount  = gross - disc;
              return (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <input value={it.description} onChange={e => setItem(idx, "description", e.target.value)} placeholder="Service / Product description" style={{ background: "transparent", border: "none", padding: 0 }} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <input value={it.hsn} onChange={e => setItem(idx, "hsn", e.target.value)} placeholder="998313" style={{ background: "transparent", border: "none", padding: 0, fontFamily: "var(--mono)", fontSize: 11 }} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <input type="number" min="0" value={it.quantity} onChange={e => setItem(idx, "quantity", e.target.value)} style={{ background: "transparent", border: "none", padding: 0, textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <input type="number" min="0" value={it.rate} onChange={e => setItem(idx, "rate", e.target.value)} style={{ background: "transparent", border: "none", padding: 0, textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <input type="number" min="0" max="100" value={it.discount} onChange={e => setItem(idx, "discount", e.target.value)} style={{ background: "transparent", border: "none", padding: 0, textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <select value={it.taxRate} onChange={e => setItem(idx, "taxRate", e.target.value)} style={{ background: "transparent", border: "none", padding: 0, textAlign: "right" }}>
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500 }}>{fmt(amount)}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: "2px 4px" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button onClick={addItem} style={{ marginTop: 12, width: "100%", background: "transparent", border: "1px dashed var(--border)", color: "var(--muted)", borderRadius: "var(--radius)", padding: "8px 16px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={13} /> Add Line Item
        </button>
      </Card>

      {/* Totals + Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => handleSave("draft")} loading={saveMut.isPending}>Save Draft</Button>
          <Button onClick={() => handleSave("sent")} loading={saveMut.isPending}><Plus size={14} /> Save & Send</Button>
        </div>
        <Card style={{ width: 280 }} padding="16px 20px">
          {[
            { label: "Subtotal", value: fmt(totals.subtotal) },
            ...(totals.discountTotal ? [{ label: "Discount", value: `-${fmt(totals.discountTotal)}` }] : []),
            ...(totals.cgst ? [{ label: "CGST (9%)", value: fmt(totals.cgst) }, { label: "SGST (9%)", value: fmt(totals.sgst) }] : []),
            ...(totals.igst ? [{ label: "IGST (18%)", value: fmt(totals.igst) }] : []),
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{r.label}</span>
              <span>{r.value}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>{fmt(totals.total)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
