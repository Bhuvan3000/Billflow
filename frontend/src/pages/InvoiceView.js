import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Send, Edit, CreditCard, X } from "lucide-react";
import toast from "react-hot-toast";
import { invoiceAPI, paymentAPI } from "../services/api";
import { fmt, fmtDate } from "../utils/helpers";
import { StatusBadge, Card, Button, Modal, Spinner, PageHeader } from "../components/shared";

function RecordPaymentModal({ invoice, onClose }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(invoice.balanceDue);
  const [method, setMethod] = useState("bank_transfer");
  const [notes,  setNotes]  = useState("");

  const mut = useMutation({
    mutationFn: () => invoiceAPI.recordPayment(invoice._id, { amount, method, notes }),
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries(["invoice", invoice._id]);
      qc.invalidateQueries(["invoices"]);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Amount (₹) *</label>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={1} max={invoice.balanceDue} />
        <span style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, display: "block" }}>Balance due: {fmt(invoice.balanceDue)}</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Payment Method *</label>
        <select value={method} onChange={e => setMethod(e.target.value)}>
          <option value="bank_transfer">Bank Transfer / NEFT</option>
          <option value="upi">UPI</option>
          <option value="razorpay">Razorpay</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: "var(--faint)", display: "block", marginBottom: 5 }}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Transaction ID, reference, etc." />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mut.mutate()} loading={mut.isPending} variant="success">
          <CreditCard size={13} /> Record Payment
        </Button>
      </div>
    </div>
  );
}

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceAPI.getOne(id).then(r => r.data.data),
  });

  const sendMut = useMutation({
    mutationFn: () => invoiceAPI.send(id),
    onSuccess: () => {
      toast.success("Invoice marked as sent");
      qc.invalidateQueries(["invoice", id]);
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => invoiceAPI.cancel(id),
    onSuccess: () => {
      toast.success("Invoice cancelled");
      qc.invalidateQueries(["invoices"]);
      navigate("/invoices");
    },
  });

  // ── Download PDF with auth token ─────────────────────────────────────────
  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("bf_token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "/api"}/invoices/${id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${data.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Could not download PDF");
    }
  };

  // ── Pay Online via Razorpay ───────────────────────────────────────────────
  const payOnline = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay script not loaded. Add it to public/index.html");
      return;
    }
    if (!inv.balanceDue || inv.balanceDue <= 0) {
      toast.error("Balance due is ₹0 — nothing to pay");
      return;
    }
    setPayingOnline(true);
    try {
      const { data: orderRes } = await paymentAPI.createRazorpayOrder({ invoiceId: id });
      const order = orderRes.data;

      const options = {
        key:         process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    "INR",
        name:        "BillFlow",
        description: `Payment for ${inv.invoiceNumber}`,
        order_id:    order.orderId,
        handler: async (response) => {
          try {
            await paymentAPI.verifyRazorpay({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              invoiceId: id,
              amount:    order.amount,
            });
            toast.success("Payment successful! 🎉");
            qc.invalidateQueries(["invoice", id]);
            qc.invalidateQueries(["invoices"]);
            qc.invalidateQueries(["payments"]);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name:  inv.customer?.name  || "",
          email: inv.customer?.email || "",
          contact: inv.customer?.phone || "",
        },
        theme:  { color: "#b87333" },
        modal: {
          ondismiss: () => toast("Payment cancelled", { icon: "ℹ️" }),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not initiate payment");
    } finally {
      setPayingOnline(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (!data) return <div style={{ padding: 24 }}>Invoice not found</div>;

  const inv     = data;
  const c       = inv.customer || {};
  const canEdit = !["paid", "cancelled"].includes(inv.status);
  const canPay  = ["sent", "viewed", "partial", "overdue"].includes(inv.status);

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader
        title={inv.invoiceNumber}
        subtitle={<StatusBadge status={inv.status} />}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canEdit && (
              <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/edit`)}>
                <Edit size={13} /> Edit
              </Button>
            )}
            {inv.status === "draft" && (
              <Button variant="secondary" onClick={() => sendMut.mutate()} loading={sendMut.isPending}>
                <Send size={13} /> Send
              </Button>
            )}
            {canPay && (
              <Button variant="success" onClick={() => setPayModal(true)}>
                <CreditCard size={13} /> Record Payment
              </Button>
            )}
            {canPay && (
              <Button
                onClick={payOnline}
                loading={payingOnline}
                style={{ background: "#b87333", color: "#fff", border: "none" }}
              >
                💳 Pay Online
              </Button>
            )}
            <Button variant="secondary" onClick={downloadPDF}>
              <Download size={13} /> PDF
            </Button>
            {canEdit && (
              <Button
                variant="danger"
                onClick={() => { if (window.confirm("Cancel this invoice?")) cancelMut.mutate(); }}
              >
                <X size={13} /> Cancel
              </Button>
            )}
          </div>
        }
      />

      {/* Invoice Paper */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, color: "#1a1a2e", marginBottom: 16, boxShadow: "0 4px 40px rgba(0,0,0,0.1)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: "#b87333", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>₹</div>
              <span style={{ fontWeight: 800, fontSize: 18 }}>BillFlow</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>GST Registered Business</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>INVOICE</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#b87333" }}>{inv.invoiceNumber}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Issue Date: {fmtDate(inv.issueDate)}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Due Date: {fmtDate(inv.dueDate)}</div>
          </div>
        </div>

        <div style={{ height: 1, background: "#e2e8f0", marginBottom: 24 }} />

        {/* Bill to / Payment summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          <div style={{ background: "#faf6ef", borderRadius: 10, padding: 16, border: "1px solid #e5ddd0" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5, marginBottom: 8 }}>BILL TO</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.name}</div>
            {c.gstin   && <div style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>GSTIN: {c.gstin}</div>}
            {c.address && <div style={{ fontSize: 12, color: "#475569" }}>{c.address}</div>}
            {c.email   && <div style={{ fontSize: 12, color: "#475569" }}>{c.email}</div>}
            {c.phone   && <div style={{ fontSize: 12, color: "#475569" }}>{c.phone}</div>}
          </div>
          <div style={{ background: "#faf6ef", borderRadius: 10, padding: 16, border: "1px solid #e5ddd0" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5, marginBottom: 8 }}>PAYMENT SUMMARY</div>
            {[
              { label: "Invoice Total", value: fmt(inv.total),      bold: true },
              { label: "Amount Paid",   value: fmt(inv.paidAmount), color: "#2e7d52" },
              { label: "Balance Due",   value: fmt(inv.balanceDue), color: inv.balanceDue > 0 ? "#b83232" : "#2e7d52", bold: true },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{r.label}</span>
                <span style={{ fontWeight: r.bold ? 700 : 400, color: r.color || "#1a1a2e" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line items */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ background: "#28200f" }}>
              {["Description", "HSN/SAC", "Qty", "Rate", "Disc%", "Amount"].map((h, i) => (
                <th key={h} style={{ color: "#fff", padding: "10px 12px", textAlign: i > 1 ? "right" : "left", fontSize: 11, letterSpacing: 0.5, ...(i === 0 && { borderRadius: "8px 0 0 8px" }), ...(i === 5 && { borderRadius: "0 8px 8px 0" }) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items?.map((it, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5ddd0", background: i % 2 === 0 ? "#faf6ef" : "#fff" }}>
                <td style={{ padding: "10px 12px", color: "#1a1a2e", fontSize: 13 }}>{it.description}</td>
                <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>{it.hsn || "—"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13 }}>{it.quantity}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13 }}>{fmt(it.rate)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748b" }}>{it.discount || 0}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 13 }}>{fmt(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 280 }}>
            {[
              { l: "Subtotal", v: fmt(inv.subtotal) },
              ...(inv.discountTotal ? [{ l: "Discount", v: `-${fmt(inv.discountTotal)}` }] : []),
              ...(inv.cgst ? [{ l: "CGST (9%)", v: fmt(inv.cgst) }, { l: "SGST (9%)", v: fmt(inv.sgst) }] : []),
              ...(inv.igst ? [{ l: "IGST (18%)", v: fmt(inv.igst) }] : []),
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{r.l}</span>
                <span style={{ color: "#1a1a2e" }}>{r.v}</span>
              </div>
            ))}
            <div style={{ background: "#28200f", borderRadius: 8, padding: "10px 14px", marginTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#b87333" }}>{fmt(inv.total)}</span>
            </div>
            {inv.gstType && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, textAlign: "center" }}>
                {inv.gstType === "intra" ? "Intra-State Supply (CGST + SGST)" : "Inter-State Supply (IGST)"}
              </div>
            )}
          </div>
        </div>

        {inv.notes && (
          <div style={{ marginTop: 24, padding: 14, background: "#faf6ef", borderRadius: 8, fontSize: 12, color: "#64748b", border: "1px solid #e5ddd0" }}>
            <strong>Notes: </strong>{inv.notes}
          </div>
        )}

        <div style={{ marginTop: 24, borderTop: "1px solid #e5ddd0", paddingTop: 14, fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
          This is a computer-generated invoice · BillFlow Technologies · support@billflow.in
        </div>
      </div>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment">
        <RecordPaymentModal invoice={inv} onClose={() => setPayModal(false)} />
      </Modal>
    </div>
  );
}