import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { AppUser, UserRole } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminUsers() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  async function updateRole(id: string, role: UserRole) {
    if (id === currentUser?.id) {
      showToast("You cannot change your own role.", "error");
      return;
    }
    const { data, error } = await supabase.from("users").update({ role }).eq("id", id).select().maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (data) {
      setUsers((prev) => prev.map((p) => (p.id === id ? (data as AppUser) : p)));
      showToast("Role updated.", "success");
    }
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.phone || "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div>
      <AdminSectionHeader
        emoji="👥"
        title="Users"
        subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
        action={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full max-w-xs rounded-lg border border-soft-grey/60 bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
          />
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-grey dark:text-dark-muted">
            {search.trim() ? "No users match your search." : "No registered users yet."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-soft-grey/40 dark:border-dark-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-beige-cream text-xs uppercase tracking-widest text-muted-grey dark:bg-dark-card dark:text-dark-muted">
                <tr>
                  <th className="px-5 py-3.5">Display Name</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-soft-grey/30 transition-colors duration-150 hover:bg-beige-cream/40 dark:border-dark-border dark:hover:bg-dark-elevated">
                    <td className="px-5 py-3.5 text-luxury-black dark:text-dark-text">{u.display_name || "—"}</td>
                    <td className="px-5 py-3.5 text-muted-grey dark:text-dark-muted">{u.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                        disabled={u.id === currentUser?.id}
                        className="rounded-full border border-soft-grey/60 bg-transparent px-3 py-1.5 text-xs uppercase tracking-widest outline-none disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:text-dark-text"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-muted-grey dark:text-dark-muted">
                      {new Date(u.created_at).toLocaleDateString()}
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
