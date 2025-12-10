export function SeverityPill({ severity }) {
  const colors = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-rose-100 text-rose-700",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[severity]}`}>{severity}</span>;
}

export function StatusPill({ status }) {
  const colors = {
    open: "bg-blue-100 text-blue-700",
    in_review: "bg-amber-100 text-amber-700",
    fixed: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-200 text-slate-700",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{status}</span>;
}


