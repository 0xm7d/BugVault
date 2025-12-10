const toneMap = {
  default: "bg-slate-100 text-slate-800",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
};

export default function StatCard({ label, value, tone = "default" }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`inline-block px-2 py-1 mt-2 rounded-md text-sm font-semibold ${toneMap[tone]}`}>
        {value}
      </div>
    </div>
  );
}

