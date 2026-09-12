import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus, X, ChevronRight, Users, DollarSign,
  CheckCircle, AlertCircle, Clock, Loader2, CalendarDays, Receipt, Trash2,
} from 'lucide-react';
import feeAPI from '../../api/fee.api';
import { adminAPI } from '../../api/admin.api';
import { useAuth } from '../../context/AuthContext';
import ReceiptModal from '../../components/ReceiptModal';
import { TermApi } from '../../api/term.api';

const inputCls = "w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const STATUS_STYLES = {
  paid:     { label: 'Paid',     cls: 'bg-emerald-100 text-emerald-700' },
  partial:  { label: 'Partial',  cls: 'bg-yellow-100  text-yellow-700' },
  not_paid: { label: 'Not Paid', cls: 'bg-red-100     text-red-700' },
};

const GATEWAY_BADGE = {
  monnify:  'bg-purple-100 text-purple-700',
  paystack: 'bg-blue-100   text-blue-700',
};

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Group transactions by calendar date ──────────────────────────────────────
function groupByDate(payments) {
  const map = {};
  payments.forEach((payment) => {
    (payment.transactions || []).forEach((txn) => {
      const d     = new Date(txn.paidAt);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { label, entries: [] };
      map[key].entries.push({
        txn,
        student:       payment.student,
        fee:           payment.fee,
        className:     payment.class?.name || '',
        paymentStatus: payment.status,
        balance:       payment.balance,
        fullPayment:   payment, // kept for receipt
      });
    });
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, group]) => group);
}

// ── Paid students tab ─────────────────────────────────────────────────────────
function PaidStudentsView() {
  const [payments,       setPayments]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [receiptData,    setReceiptData]    = useState(null); // { payment, transaction }

  useEffect(() => {
    feeAPI.getPaidStudents()
      .then(({ data }) => setPayments(data.payments || []))
      .catch(() => toast.error('Failed to load paid students'))
      .finally(() => setLoading(false));
  }, []);

  const fmt  = (n) => `₦${Number(n || 0).toLocaleString()}`;
  const groups = groupByDate(payments);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <Users size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 font-medium">No payments yet</p>
        <p className="text-gray-400 text-sm">Students who pay will appear here grouped by date</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((group, gi) => (
          <div key={gi}>
            {/* ── Date tag ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                <CalendarDays size={12} />
                {group.label}
              </span>
              <span className="text-xs text-gray-400">{group.entries.length} payment{group.entries.length !== 1 ? 's' : ''}</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            {/* ── Student cards ──────────────────────────────────────────── */}
            <div className="space-y-2">
              {group.entries.map((entry, ei) => {
                const ss = STATUS_STYLES[entry.paymentStatus] || STATUS_STYLES.not_paid;
                const gw = entry.txn.gateway || 'paystack';

                return (
                  <div key={ei} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                      {(entry.student?.fullname || '?')[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {entry.student?.fullname || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {entry.student?.registrationNumber}
                        {entry.className ? ` · ${entry.className}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {entry.fee?.title || '—'}{entry.fee?.term ? ` · ${entry.fee.term}` : ''}
                      </p>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-600">{fmt(entry.txn.amount)}</p>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ss.cls}`}>
                          {ss.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${GATEWAY_BADGE[gw] || GATEWAY_BADGE.paystack}`}>
                          {gw}
                        </span>
                      </div>
                      {entry.paymentStatus === 'partial' && (
                        <p className="text-[10px] text-gray-400">Bal: {fmt(entry.balance)}</p>
                      )}
                      <button
                        onClick={() => setReceiptData({ payment: entry.fullPayment, transaction: entry.txn })}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition font-semibold mt-0.5"
                      >
                        <Receipt size={10} /> Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ReceiptModal
        isOpen={!!receiptData}
        payment={receiptData?.payment}
        transaction={receiptData?.transaction}
        onClose={() => setReceiptData(null)}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function FeeManagementPage() {
  const { isPrincipal } = useAuth();
  const [tab,      setTab]      = useState('fees'); // 'fees' | 'paid'
  const [fees,     setFees]     = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [paymentModal,    setPaymentModal]    = useState(null);
  const [payments,        setPayments]        = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [summary,         setSummary]         = useState(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState(null);
  const [deleteFee, setDeleteFee] = useState([]);
  const [Terms, setTerms] = useState([]);
  const [loadingTerms, setLoadingTerms] =
      useState(false);
        const [activeTerm, setActiveTerm] = useState(null);
      
        const [selectedTermId, setSelectedTermId] = useState("");
  const [form, setForm] = useState({
    title: '', classId: '', term: "", session: '', amount: '', dueDate: '',
    paymentOptions: { fullPayment: true, installment: false, customAmount: false },
  });
 const [studentForm, setStudentForm] = useState({  classId: '' });
 

  const loadFees = async () => {
    try {
      setLoading(true);
      const { data } = await feeAPI.getFees();
      setFees(data.fees || []);
    } catch {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };
const loadTerms = async () => {
    try {
      setLoadingTerms(true);

      const results = await Promise.allSettled([
        TermApi.getAllTerms(),
        TermApi.getCurrentTerm(),
      ]);

      if (results[0].status === "fulfilled") {
        setTerms(results[0].value?.data?.terms || []);
      } else {
        throw results[0].reason || new Error("Failed to fetch terms");
      }

      if (results[1].status === "fulfilled") {
        const currentTerm = results[1].value?.data?.term || null;
        setActiveTerm(currentTerm);

        if (currentTerm) {
          setForm((prev) => ({
            ...prev,
            term: currentTerm.term || "",
            session: currentTerm.session || "",
          }));
        }
      } else if (results[1].reason?.response?.status === 404) {
        setActiveTerm(null);
      } else {
        throw results[1].reason;
      }
    } catch (error) {
      console.error("Failed to load terms:", error);
      if (error?.response?.status === 404) {
        setActiveTerm(null);
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Failed to load academic terms"
        );
      }
    } finally {
      setLoadingTerms(false);
    }
  };

  useEffect(() => {
    loadFees();
    loadClasses();
    loadTerms()
  }, []);
  const loadClasses = async () => {
    try {
      const { data } = await adminAPI.getClasses();
      setClasses(data.classes || data || []);
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Fee title is required");
    if (!form.classId) return toast.error("Select a class");

    if (!activeTerm) {
      return toast.error(
        "There is no active academic term. Activate a term first."
      );
    }

    if (!form.amount || Number(form.amount) <= 0) {
      return toast.error("Enter a valid amount");
    }

    setSubmitting(true);
    // setStudentForm(true);
    try {
      const payload = {
        ...form,
        term: activeTerm.term,
        session: activeTerm.session,
      };

      const { data } = await feeAPI.createFee(payload);

      toast.success(data.message || "Fee created successfully");
      setFees((prev) => [data.fee, ...prev]);
      setAddModal(false);

      setForm({
        title: "",
        classId: "",
        term: activeTerm.term || "",
        session: activeTerm.session || "",
        amount: "",
        dueDate: "",
        paymentOptions: {
          fullPayment: true,
          installment: false,
          customAmount: false,
        },
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create fee"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openPayments = async (fee) => {
    setPaymentModal(fee);
    setPaymentsLoading(true);
    setPayments([]);
    setSummary(null);
    try {
      const { data } = await feeAPI.getFeePayments(fee._id);
      setPayments(data.payments || []);
      setSummary(data.summary);
    } catch {
      toast.error('Failed to load payment records');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleDeleteFee = async (fee) => {
    if (!fee?._id) return;

    const confirmed = window.confirm(
      `Delete "${fee.title}" for ${fee.class?.name || "this class"}?\n\n` +
        "The fee and its unpaid payment records will be deleted. " +
        "A fee cannot be deleted once a payment has been made."
    );

    if (!confirmed) return;

    try {
      setDeletingFeeId(fee._id);

      const { data } = await feeAPI.deleteFee(fee._id);

      toast.success(data?.message || "Fee deleted successfully");
      setFees((prev) => prev.filter((item) => item._id !== fee._id));

      if (paymentModal?._id === fee._id) {
        setPaymentModal(null);
        setPayments([]);
        setSummary(null);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete fee"
      );
    } finally {
      setDeletingFeeId(null);
    }
  };

  const fmt = (n) => `₦${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create fees and track student payments
          </p>
          {activeTerm && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Active Term: {activeTerm.term} · {activeTerm.session}
            </div>
          )}
        </div>
        {tab === 'fees' && !isPrincipal && (
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={15} /> Add Fee
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'fees', label: 'All Fees',       Icon: DollarSign },
          { id: 'paid', label: 'Students Paid',  Icon: CheckCircle },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Fees tab ─────────────────────────────────────────────────────── */}
      {tab === 'fees' && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : fees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No fees yet</p>
            <p className="text-gray-400 text-sm">Click "Add Fee" to create the first one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map((fee) => (
              <div
                key={fee._id}
                onClick={() => openPayments(fee)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer group"
              >
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{fee.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fee.class?.name} · {fee.term}{fee.session ? ` · ${fee.session}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">{fmt(fee.amount)}</p>
                  <p className="text-xs text-gray-400">
                    {fee.paymentOptions?.installment ? 'Installment allowed' : 'Full / Custom'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFee(fee);
                  }}
                  disabled={deletingFeeId === fee._id || isPrincipal}
                  className="w-9 h-9 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title={isPrincipal ? 'View only' : 'Delete fee'}
                >
                  {deletingFeeId === fee._id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition flex-shrink-0" />
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Paid students tab ─────────────────────────────────────────────── */}
      {tab === 'paid' && <PaidStudentsView />}

      {/* Add Fee Modal */}
      {!isPrincipal && (
        <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Fee">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fee Title *</label>
            <input className={inputCls} placeholder="e.g. First Term School Fees" value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Academic Term *
              </label>

              {loadingTerms ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  <Loader2 size={15} className="animate-spin" />
                  Loading active term...
                </div>
              ) : activeTerm ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-green-800">
                        {activeTerm.term}
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {activeTerm.session}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      ACTIVE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">
                    No active academic term
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Activate an academic term before creating a fee.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Amount (₦) *
              </label>
              <input
                type="number"
                min="0"
                className={inputCls}
                placeholder="e.g. 50000"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Class</label>
              <select className={inputCls} value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
             </div>
             <input type="text"  className='' form />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Options</label>
            <div className="space-y-2">
              {[
                { key: 'fullPayment',  label: 'Full Payment' },
                { key: 'installment',  label: '3rd-Party / Installment (fee ÷ 3)' },
                { key: 'customAmount', label: 'Custom Amount (student sets how much)' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={form.paymentOptions[key]}
                    onChange={(e) => setForm((p) => ({ ...p, paymentOptions: { ...p.paymentOptions, [key]: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddModal(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Creating…' : 'Create Fee & Notify'}
            </button>
          </div>
        </form>
      </Modal>
      )}

      {/* Payment Status Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)}
        title={paymentModal ? `Payments — ${paymentModal.title}` : ''}>
        {paymentsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {summary && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{summary.paid}</p>
                  <p className="text-xs text-emerald-600 font-medium">Paid</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-yellow-600">{summary.partial}</p>
                  <p className="text-xs text-yellow-600 font-medium">Partial</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{summary.not_paid}</p>
                  <p className="text-xs text-red-600 font-medium">Not Paid</p>
                </div>
              </div>
            )}
            {summary && (
              <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-sm">
                <span className="text-gray-500">Collected</span>
                <span className="font-bold text-gray-900">
                  {fmt(summary.totalCollected)} / {fmt(summary.totalExpected)}
                </span>
              </div>
            )}
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {payments.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">No records found</p>
              ) : payments.map((p) => {
                const s = STATUS_STYLES[p.status] || STATUS_STYLES.not_paid;
                return (
                  <div key={p._id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.student?.fullname || '—'}</p>
                      <p className="text-xs text-gray-400">{p.student?.registrationNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                      {p.status === 'partial' && (
                        <p className="text-xs text-gray-400 mt-0.5">Balance: {fmt(p.balance)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
