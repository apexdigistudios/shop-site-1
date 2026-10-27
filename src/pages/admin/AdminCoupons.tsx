import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Coupon } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { formatCompactNumber } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

interface CouponFormState {
  id: string | null;
  code: string;
  discount: string;
  active: boolean;
}

const EMPTY_FORM: CouponFormState = { id: null, code: "", discount: "", active: true };

export default function AdminCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadCoupons() {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("code");
    if (data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function saveCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.discount) {
      showToast("Code and discount percentage are required.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount: parseFloat(form.discount) || 0,
      active: form.active,
    };

    if (form.id) {
      const { data, error } = await supabase.from("coupons").update(payload).eq("id", form.id).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setCoupons((prev) => prev.map((c) => (c.id === form.id ? (data as Coupon) : c)));
        showToast("Coupon updated.", "success");
      }
    } else {
      const { data, error } = await supabase.from("coupons").insert(payload).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setCoupons((prev) => [data as Coupon, ...prev]);
        showToast("Coupon created.", "success");
      }
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function toggleActive(coupon: Coupon) {
    const { data, error } = await supabase
      .from("coupons")
      .update({ active: !coupon.active })
      .eq("id", coupon.id)
      .select()
      .maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (data) setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? (data as Coupon) : c)));
  }

  async function deleteCoupon(id: string) {
    if (!window.confirm("Delete this coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    showToast("Coupon deleted.", "success");
  }

  const inputClass =
    "w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white";

  return (
    <div>
      <AdminSectionHeader
        emoji="🎟️"
        title="Coupons"
        subtitle={`${formatCompactNumber(coupons.length)} coupon${coupons.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="flex h-10 items-center rounded-full bg-luxury-black px-5 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black"
          >
            + Add Coupon
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={saveCoupon}
          className="mt-6 space-y-4 rounded-2xl border border-border-ash bg-pure-white p-6 transition-theme dark:border-dark-grey dark:bg-dark-grey"
        >
          <h2 className="font-display text-xl">{form.id ? "Edit Coupon" : "New Coupon"}</h2>
          <input
            className={inputClass}
            placeholder="Coupon code (e.g. LUXURY10)"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Discount percentage"
            type="number"
            value={form.discount}
            onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
            Active
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
            >
              {saving ? "Saving..." : "Save Coupon"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-border-ash px-6 py-2.5 text-xs uppercase tracking-widest dark:border-dark-grey"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="h-20 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
        ) : coupons.length === 0 ? (
          <p className="text-sm text-ash-grey">No coupons created yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border-ash dark:border-dark-grey">
            <table className="w-full text-left text-sm">
              <thead className="bg-beige-cream text-xs uppercase tracking-widest text-ash-grey dark:bg-luxury-black">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-border-ash dark:border-dark-grey">
                    <td className="px-4 py-3 font-medium">{coupon.code}</td>
                    <td className="px-4 py-3">{formatCompactNumber(coupon.discount)}%</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
                          coupon.active ? "bg-whatsapp-green/15 text-whatsapp-green" : "bg-ash-grey/15 text-ash-grey"
                        }`}
                      >
                        {coupon.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setForm({ id: coupon.id, code: coupon.code, discount: String(coupon.discount), active: coupon.active });
                            setShowForm(true);
                          }}
                          className="text-xs uppercase tracking-widest text-luxury-black underline dark:text-pure-white"
                        >
                          Edit
                        </button>
                        <button onClick={() => deleteCoupon(coupon.id)} className="text-xs uppercase tracking-widest text-alert-red underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
