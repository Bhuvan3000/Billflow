import { format, formatDistanceToNow, isPast } from "date-fns";

export const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

export const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
};

export const fmtRelative = (d) => {
  if (!d) return "";
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; }
};

export const isOverdue = (dueDate, status) =>
  status !== "paid" && status !== "cancelled" && isPast(new Date(dueDate));

export const STATUS_CONFIG = {
  paid:      { label: "Paid",      bg: "#052e16", color: "#10b981" },
  sent:      { label: "Sent",      bg: "#1e3a5f", color: "#4f8ef7" },
  viewed:    { label: "Viewed",    bg: "#1a2a4a", color: "#60a5fa" },
  draft:     { label: "Draft",     bg: "#1c1f2e", color: "#94a3b8" },
  overdue:   { label: "Overdue",   bg: "#2d0a0a", color: "#ef4444" },
  partial:   { label: "Partial",   bg: "#2d1a00", color: "#f59e0b" },
  cancelled: { label: "Cancelled", bg: "#1a1a1a", color: "#64748b" },
  active:    { label: "Active",    bg: "#052e16", color: "#10b981" },
  paused:    { label: "Paused",    bg: "#2d1a00", color: "#f59e0b" },
  success:   { label: "Success",   bg: "#052e16", color: "#10b981" },
  failed:    { label: "Failed",    bg: "#2d0a0a", color: "#ef4444" },
  pending:   { label: "Pending",   bg: "#1c1f2e", color: "#94a3b8" },
};

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh","Puducherry",
];
