import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import type { Order } from "../lib/types";
import { formatPrice } from "../lib/helpers";
import EmptyState from "../components/EmptyState";

export default function AccountPage() {
  const { user, appUser, loading, signIn, signUp, signOut, updateAppUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const tab = searchParams.get("tab") || "profile";

  useEffect(() => {
    if (!user || tab !== "orders") return;
    setOrdersLoading(true);
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) || []);
        setOrdersLoading(false);
      });
  }, [user, tab]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password.", "error");
      return;
    }
    setSubmitting(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      setSubmitting(false);
      if (error) {
        showToast(error, "error");
        return;
      }
      showToast("Welcome back!", "success");
    } else {
      if (!displayName.trim()) {
        setSubmitting(false);
        showToast("Please enter your name.", "error");
        return;
      }
      const { error } = await signUp(email.trim(), password, displayName.trim(), phone.trim());
      setSubmitting(false);
      if (error) {
        showToast(error, "error");
        return;
      }
      showToast("Account created! Welcome to The Christy Black Art Gallery.", "success");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <div className="h-64 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <div className="rounded-2xl border border-border-ash p-8 transition-theme dark:border-dark-grey">
          <div className="mb-6 flex rounded-full border border-border-ash p-1 dark:border-dark-grey">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-xs uppercase tracking-widest transition-theme ${
                mode === "login" ? "bg-luxury-black text-pure-white dark:bg-pure-white dark:text-luxury-black" : "text-ash-grey"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-xs uppercase tracking-widest transition-theme ${
                mode === "signup" ? "bg-luxury-black text-pure-white dark:bg-pure-white dark:text-luxury-black" : "text-ash-grey"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h1 className="mb-6 text-center font-display text-2xl tracking-wide text-luxury-black dark:text-pure-white">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-border-ash bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-border-ash bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white"
                />
              </>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-border-ash bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-border-ash bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-luxury-black px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-pure-white transition-transform hover:scale-[1.02] disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
      <h1 className="mb-8 font-display text-4xl tracking-wide text-luxury-black dark:text-pure-white">My Account</h1>

      <div className="mb-8 flex gap-2 border-b border-border-ash dark:border-dark-grey">
        {[
          { id: "profile", label: "Profile" },
          { id: "orders", label: "Orders" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSearchParams({ tab: t.id })}
            className={`px-4 py-3 text-xs uppercase tracking-widest transition-theme ${
              tab === t.id
                ? "border-b-2 border-luxury-black text-luxury-black dark:border-pure-white dark:text-pure-white"
                : "text-ash-grey"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileTab
          displayName={appUser?.display_name || ""}
          phone={appUser?.phone || ""}
          email={user.email || ""}
          isAdmin={isAdmin}
          onUpdate={updateAppUser}
          onGoAdmin={() => navigate("/admin")}
          onSignOut={async () => {
            await signOut();
            navigate("/");
          }}
        />
      )}

      {tab === "orders" && (
        <div>
          {ordersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet" message="Your order history will appear here after checkout." />
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border-ash p-5 transition-theme dark:border-dark-grey">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-luxury-black dark:text-pure-white">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
                          order.status === "delivered"
                            ? "bg-whatsapp-green/15 text-whatsapp-green"
                            : order.status === "cancelled"
                            ? "bg-alert-red/15 text-alert-red"
                            : "bg-beige-cream text-luxury-black dark:bg-dark-grey dark:text-pure-white"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
                          order.payment_status === "deposit_paid"
                            ? "bg-whatsapp-green/15 text-whatsapp-green"
                            : "bg-alert-red/15 text-alert-red"
                        }`}
                      >
                        {order.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Meetup Payment"}
                      </span>
                      <span className="rounded-full bg-beige-cream px-3 py-1 text-[10px] uppercase tracking-widest text-luxury-black dark:bg-dark-grey dark:text-pure-white">
                        {order.payment_method === "paystack_deposit" ? "Paystack Deposit" : "Meetup"}
                      </span>
                      <span className="rounded-full bg-beige-cream px-3 py-1 text-[10px] uppercase tracking-widest text-luxury-black dark:bg-dark-grey dark:text-pure-white">
                        {(order.meetup_status ?? "pending").replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-ash-grey">{new Date(order.created_at).toLocaleString()}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-ash-grey sm:grid-cols-3">
                    <p>
                      <span className="text-luxury-black dark:text-pure-white">Total:</span>{" "}
                      {formatPrice(order.total_amount ?? order.total ?? 0)}
                    </p>
                    <p>
                      <span className="text-luxury-black dark:text-pure-white">Deposit:</span> {formatPrice(order.deposit_amount ?? 0)}
                    </p>
                    <p>
                      <span className="text-luxury-black dark:text-pure-white">Balance:</span> {formatPrice(order.remaining_balance ?? 0)}
                    </p>
                  </div>
                  <div className="mt-3 space-y-1">
                    {(Array.isArray(order.items) ? order.items : []).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-ash-grey">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span>{formatPrice(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-border-ash pt-3 text-sm font-medium text-luxury-black transition-theme dark:border-dark-grey dark:text-pure-white">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount ?? order.total ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileTab({
  displayName,
  phone,
  email,
  isAdmin,
  onGoAdmin,
  onUpdate,
  onSignOut,
}: {
  displayName: string;
  phone: string;
  email: string;
  isAdmin: boolean;
  onGoAdmin: () => void;
  onUpdate: (updates: { display_name: string; phone: string }) => Promise<{ error: string | null }>;
  onSignOut: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(displayName);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await onUpdate({ display_name: name.trim(), phone: phoneNumber.trim() });
    setSaving(false);
    if (error) {
      showToast(error, "error");
      return;
    }
    showToast("Profile updated.", "success");
  }

  return (
    <div className="max-w-lg space-y-4 rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <div>
        <span className="text-xs uppercase tracking-widest text-muted-grey dark:text-dark-muted">Email</span>
        <p className="text-sm text-luxury-black dark:text-dark-text">{email}</p>
      </div>
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-muted-grey dark:text-dark-muted">Display Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-soft-grey/60 bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
        />
      </div>
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-muted-grey dark:text-dark-muted">Phone</span>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full rounded-lg border border-soft-grey/60 bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="flex h-12 w-full items-center justify-center rounded-full bg-luxury-black px-6 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] disabled:opacity-50 dark:bg-dark-accent dark:text-luxury-black"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {isAdmin && (
        <button
          onClick={onGoAdmin}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-luxury-black text-xs uppercase tracking-widest text-luxury-black transition-all duration-250 hover:bg-luxury-black hover:text-pure-white dark:border-dark-accent dark:text-dark-accent dark:hover:bg-dark-accent dark:hover:text-luxury-black"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Enter Admin Dashboard
        </button>
      )}

      <button onClick={onSignOut} className="block h-12 w-full rounded-full border border-alert-red px-6 text-center text-xs uppercase tracking-widest text-alert-red transition-all duration-250 hover:bg-alert-red/10">
        Sign Out
      </button>
    </div>
  );
}
