import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Download, Send, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { invoiceAPI } from "../services/api";
import { fmt, fmtDate } from "../utils/helpers";
import { StatusBadge, Card, Button, FilterBar, PageHeader, Spinner, EmptyState } from "../components/shared";
import { FileText } from "lucide-react";

const FILTERS = [
  { value: "all",     label: "All" },
  { value: "draft",   label: "Draft" },
  { value: "sent",    label: "Sent" },
  { value: "paid",    label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
];

export default function Invoices() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", status, search],
    queryFn: () => invoiceAPI.getAll({ ...(status !== "all" && { status }), ...(search && { search }) }).then(r => r.data),
  });

  const sendMut = useMutation({
    mutationFn: (id) => invoiceAPI.send(id),
    onSuccess: () => { toast.success("Invoice sent"); qc.invalidateQueries(["invoices"]); },
  });

  const invoices = data?.data || [];

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <PageHeader
        title="Invoices"
        subtitle={`${data?.total || 0} total invoices`}
        actions={
          <Button onClick={() => navigate("/invoices/new")}>
            <Plus size={14} /> New Invoice
          </Button>
        }
      />

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
          <input placeholder="Search invoice number..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
      </div>

      <FilterBar filters={FILTERS} active={status} onChange={setStatus} />

      <Card padding="0">
        {isLoading ? <Spinner /> : invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice to get started."
            action={<Button onClick={() => navigate("/invoices/new")}><Plus size={14} /> New Invoice</Button>} />
        ) : (
          <table>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th style={{ textAlign: "right" }}>GST</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/invoices/${inv._id}`)}>
                  <td><span style={{ color: "var(--accent)", fontWeight: 600 }}>{inv.invoiceNumber}</span></td>
                  <td>{inv.customer?.name || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{fmtDate(inv.issueDate)}</td>
                  <td style={{ color: inv.status === "overdue" ? "var(--red)" : "var(--muted)" }}>{fmtDate(inv.dueDate)}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>{fmt(inv.totalTax)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(inv.total)}</td>
                  <td style={{ textAlign: "right", color: inv.balanceDue > 0 ? "var(--amber)" : "var(--green)", fontWeight: 600 }}>{fmt(inv.balanceDue)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => navigate(`/invoices/${inv._id}`)} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}><Eye size={11} /></button>
                      {inv.status === "draft" && (
                        <button onClick={() => sendMut.mutate(inv._id)} style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}><Send size={11} /></button>
                      )}
                      <a href={invoiceAPI.pdfUrl(inv._id)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11, textDecoration: "none" }}><Download size={11} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
