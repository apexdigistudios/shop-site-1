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
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />;
  }

  return (
    <div>
      <AdminSectionHeader
        emoji="💳"
        title="Payment Settings"
        subtitle="Control which payment options appear at checkout"
      />

      <div className="mt-8 max-w-2xl space-y-6">
        {/* PAYSTACK CARD */}
        <div className="rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-xl tracking-wide text-luxury-black dark:text-dark-text">
                  Paystack Payments
                </h2>
                {local ? (
                  <span className="rounded-full bg-whatsapp-green/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-whatsapp-green">
                    🟢 Active
                  </span>
                ) : (
                  <span className="rounded-full bg-alert-red/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-alert-red">
                    🔴 Disabled
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-grey dark:text-dark-muted">
                Enable the 50% deposit option via Paystack / Mobile Money. When disabled, only the
                "Pay on Meetup" option will appear at checkout.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={local}
              aria-label="Enable Paystack Payments"
              disabled={saving}
              onClick={() => handleToggle(!local)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border transition-all duration-250 disabled:opacity-50 ${
                local
                  ? "border-whatsapp-green/40 bg-whatsapp-green"
                  : "border-soft-grey/60 bg-soft-grey/60 dark:border-dark-border dark:bg-dark-elevated"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-pure-white shadow-sm transition-transform duration-250 ease-out ${
                  local ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Status Block */}
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-soft-grey/40 bg-beige-cream/40 p-4 sm:grid-cols-2 dark:border-dark-border dark:bg-dark-elevated">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                Current State
              </p>
              <p className="mt-1 text-sm font-medium text-luxury-black dark:text-dark-text">
                {local ? "ON — Paystack deposit shown at checkout" : "OFF — Only meetup option shown at checkout"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                Customer Experience
              </p>
              <p className="mt-1 text-sm text-muted-grey dark:text-dark-muted">
                {local
                  ? "Customers can choose between Paystack (50% deposit) and Pay on Meetup."
                  : "Customers will only see the Pay on Meetup option."}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[11px] text-muted-grey dark:text-dark-muted">
            Future ready: when Paystack credentials are configured, simply toggle this switch to ON. No
            code changes are required.
          </p>
        </div>
      </div>
    </div>
  );
}
