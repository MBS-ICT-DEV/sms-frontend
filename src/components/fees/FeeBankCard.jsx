import { CheckCircle2, Wallet } from "lucide-react";

const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function FeeBankCard({
  title,
  subtitle,
  totalAmount,
  amountPaid,
  balance,
  status,
  onClick,
  footer,
}) {
  const paid = status === "paid" || Number(balance || 0) <= 0 && Number(amountPaid || 0) > 0;
  const partial = status === "partial" || (!paid && Number(amountPaid || 0) > 0);

  const tone = paid
    ? "from-emerald-500 via-green-600 to-emerald-800"
    : partial
      ? "from-amber-500 via-orange-500 to-amber-800"
      : "from-slate-700 via-slate-800 to-slate-950";

  const statusLabel = paid ? "PAID" : partial ? "BALANCE" : "NOT PAID";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left rounded-3xl p-5 text-white shadow-lg bg-gradient-to-br ${tone} overflow-hidden ${
        onClick ? "hover:scale-[1.01] transition" : "cursor-default"
      }`}
    >
      <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/10" />
      <div className="absolute right-8 -bottom-10 w-28 h-28 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/70">School Fee Card</p>
          <h3 className="text-lg font-bold mt-1 leading-tight">{title || "School Fee"}</h3>
          {subtitle ? <p className="text-xs text-white/75 mt-1">{subtitle}</p> : null}
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
          paid ? "bg-white text-emerald-700" : "bg-white/15 text-white"
        }`}>
          {statusLabel}
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/70">Total</p>
          <p className="text-sm font-semibold">{fmt(totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/70">Paid</p>
          <p className="text-sm font-semibold flex items-center gap-1">
            {paid ? <CheckCircle2 size={14} /> : null}
            {fmt(amountPaid)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/70">Balance</p>
          <p className="text-sm font-semibold flex items-center gap-1">
            {!paid ? <Wallet size={14} /> : null}
            {fmt(balance)}
          </p>
        </div>
      </div>

      {footer ? <div className="relative mt-4">{footer}</div> : null}
    </button>
  );
}
