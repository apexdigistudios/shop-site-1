import { useEffect, useState } from "react";
import { usePaystackSettings } from "../../contexts/PaystackSettingsContext";
import { useToast } from "../../contexts/ToastContext";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminPaymentSettings() {
  const { enabled, loading, setEnabled, refresh } = usePaystackSettings();
  const { showToast } = useToast();
  const [local, setLocal] = useState<boolean>(enabled);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setLocal(enabled);
  }, [enabled]);

  async function handleToggle(next: boolean) {
    setLocal(next);
    setSaving(true);
    const { error } = await setEnabled(next);
    setSaving(false);
    if (error) {
      // Revert UI if save failed.
      setLocal(!next);
      showToast(`Failed to update payment settings: ${error}`, "error");
      return;
    }
    showToast(
      next
        ? "Paystack payments are now ENABLED at checkout."
        : "Paystack payments are now DISABLED at checkout.",
      "success"
    );
    refresh();
  }

  if (loading) {
    return <div className="h-48 w-full animate-pulse rounded-3xl bg-slate-100" />;
  }

  return (
    <div className="space-y-6 pb-24">
      <AdminSectionHeader
        emoji="💳"
        title="Payment Settings"
        subtitle="Control which payment options appear at checkout"
      />

      <div className="mt-8 max-w-3xl space-y-6">
        {/* PAYSTACK CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 shrink-0">
                  <img src="/paystack.png" alt="Paystack" className="h-full w-full object-contain" />
                </div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 truncate">
                  Paystack Payments
                </h2>
                {local ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-800 shrink-0">
                    🟢 Active
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-800 shrink-0">
                    🔴 Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Enable the 50% deposit option via Paystack / Mobile Money. When disabled, only the
                &quot;Pay on Meetup&quot; option will appear at checkout.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-xs font-semibold text-slate-500 sm:hidden">Toggle Status</span>
              <button
                type="button"
                role="switch"
                aria-checked={local}
                aria-label="Enable Paystack Payments"
                disabled={saving}
                onClick={() => handleToggle(!local)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-250 disabled:opacity-50 ${
                  local
                    ? "border-emerald-300 bg-emerald-600"
                    : "border-slate-200 bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-250 ease-out ${
                    local ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status Block */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Current State
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {local ? "ON — Paystack deposit shown at checkout" : "OFF — Only meetup option shown at checkout"}
              </p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Customer Experience
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {local
                  ? "Customers can choose between Paystack (50% deposit) and Pay on Meetup."
                  : "Customers will only see the Pay on Meetup option."}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Future ready: when Paystack credentials are configured, simply toggle this switch to ON. No
            code changes are required.
          </p>
        </div>
      </div>
    </div>
  );
}