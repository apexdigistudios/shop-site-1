import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { AppUser, UserRole } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { formatCompactNumber } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminUsers() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Confirmation state for role changes
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    newRole: UserRole;
    currentRole: UserRole;
    userName: string;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers((data as AppUser[]) || []);
        setLoading(false);
      });
  }, []);

  async function executeRoleChange() {
    if (!pendingChange) return;
    const { userId, newRole } = pendingChange;

    if (userId === currentUser?.id) {
      showToast("You cannot change your own role.", "error");
      setPendingChange(null);
      return;
    }

    const { data, error } = await supabase.from("users").update({ role: newRole }).eq("id", userId).select().maybeSingle();
    if (error) {
      showToast(error.message, "error");
      setPendingChange(null);
      return;
    }
    if (data) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? (data as AppUser) : u)));
      showToast("Customer role updated.", "success");
    }
    setPendingChange(null);
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.phone || "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6 pb-24">
      <AdminSectionHeader
        emoji="👥"
        title="Customers Management"
        subtitle={`${formatCompactNumber(users.length)} registered customer${users.length !== 1 ? "s" : ""}`}
        action={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 shadow-xs"
          />
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
            {search.trim() ? "No customers match your search." : "No registered customers found."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-md"
                >
                  {/* Left: Customer Info */}
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto sm:flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xs">
                      {(u.display_name || "C").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-display text-sm font-bold text-slate-900">
                          {u.display_name || "Anonymous Customer"}
                        </h3>
                        {isSelf && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>📞 {u.phone || "No phone"}</span>
                        <span>·</span>
                        <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Role Selector & Badge */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</span>
                      <select
                        value={u.role}
                        onChange={(e) =>
                          setPendingChange({
                            userId: u.id,
                            newRole: e.target.value as UserRole,
                            currentRole: u.role,
                            userName: u.display_name || "Customer",
                          })
                        }
                        disabled={isSelf}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 outline-none disabled:opacity-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR ROLE CHANGES */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">Confirm Customer Role Change</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to change <strong className="text-slate-900">{pendingChange.userName}</strong>&apos;s role from{" "}
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                {pendingChange.currentRole}
              </span>{" "}
              to{" "}
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                {pendingChange.newRole}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRoleChange}
                className="rounded-2xl bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-slate-800"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}