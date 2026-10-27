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

  // If user is admin, force tab to be profile (ignore orders tab)
  const tab = isAdmin ? "profile" : (searchParams.get("tab") || "profile");

  useEffect(() => {
    if (!user || tab !== "orders" || isAdmin) return;
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
  }, [user, tab, isAdmin]);

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
        <div className="h-64 w-full animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === "login" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === "signup" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h1 className="mb-6 text-center font-display text-2xl font-bold text-slate-900">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +233..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 pb-24">
      <h1 className="mb-6 font-display text-3xl font-bold tracking-wide text-slate-900">My Account</h1>

      {/* Hide Orders Tab entirely if user is admin */}
      {!isAdmin && (
        <div className="mb-8 flex gap-2 border-b border-slate-200">
          {[
            { id: "profile", label: "Profile" },
            { id: "orders", label: "Orders" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSearchParams({ tab: t.id })}
              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                tab === t.id
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

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

      {tab === "orders" && !isAdmin && (
        <div>
          {ordersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-28 w-full animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet" message="Your order history will appear here after checkout." />
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          order.payment_status === "deposit_paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Payment"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">Placed on {new Date(order.created_at).toLocaleString()}</p>
                  
                  <div className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
                    <p>
                      <strong className="text-slate-900">Total:</strong> {formatPrice(order.total_amount ?? order.total ?? 0)}
                    </p>
                    <p>
                      <strong className="text-slate-900">Deposit:</strong> {formatPrice(order.deposit_amount ?? 0)}
                    </p>
                    <p>
                      <strong className="text-slate-900">Balance:</strong> {formatPrice(order.remaining_balance ?? 0)}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(Array.isArray(order.items) ? order.items : []).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                        <span className="truncate pr-2">
                          {it.quantity}x {it.name}
                        </span>
                        <span className="shrink-0 font-medium text-slate-900">{formatPrice(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-900">
                    <span>Final Amount</span>
                    <span className="font-display text-sm">{formatPrice(order.total_amount ?? order.total ?? 0)}</span>
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
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [saving, setSaving] = useState(false);

  // Sync internal state if props change from Supabase
  useEffect(() => {
    setName(displayName);
    setPhoneNumber(phone);
  }, [displayName, phone]);

  async function save() {
    setSaving(true);
    const { error } = await onUpdate({ display_name: name.trim(), phone: phoneNumber.trim() });
    setSaving(false);
    if (error) {
      showToast(error, "error");
      return;
    }
    showToast("Profile updated successfully.", "success");
    setIsEditing(false);
  }

  function handleCancel() {
    setName(displayName);
    setPhoneNumber(phone);
    setIsEditing(false);
  }

  return (
    <div className="max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
      {/* Header Row with Title and Edit Icon Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="font-display text-lg font-bold text-slate-900">Profile Details</h2>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            title="Edit Profile"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Profile Details Container: Saved Format vs Edit Form */}
      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
          <p className="text-xs font-semibold text-slate-900">{email}</p>
        </div>

        {isEditing ? (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Name</span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">{displayName || "Not set"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">{phone || "Not set"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Quick Action Button */}
      {isAdmin && (
        <button
          type="button"
          onClick={onGoAdmin}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-6 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
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

      {/* Sign Out Button with Icon */}
      <button
        type="button"
        onClick={onSignOut}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 text-xs font-semibold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign Out
      </button>
    </div>
  );
}