import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AppUser } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
  updateAppUser: (updates: Partial<Pick<AppUser, "display_name" | "phone">>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Ensure a row always exists in public.users for the given auth user.
// IMPORTANT: role is only ever written when the row is first created.
// Existing rows are never touched by this function — their role is preserved.
async function ensureUserRow(authUser: User): Promise<AppUser | null> {
  // 1. Check if the user already has a row.
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (selectError) {
    console.warn("[users] select failed:", selectError.message);
    return null;
  }

  // 2. If the row exists — return it as-is. NEVER overwrite role.
  if (existing) {
    return existing as AppUser;
  }

  // 3. Brand-new user → insert with default role = "customer".
  const insertPayload = {
    id: authUser.id,
    display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.display_name || null,
    phone: authUser.user_metadata?.phone || null,
    role: "customer",
  };

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert(insertPayload)
    .select()
    .maybeSingle();

  if (insertError) {
    // Race condition safety: if insert failed because the row was just created
    // (e.g. by another tab), fall back to a plain read — do NOT upsert.
    const { data: refetch } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();
    return (refetch as AppUser) ?? null;
  }

  return (inserted as AppUser) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from public.users; if missing, create the row automatically.
  const loadAppUser = useCallback(async (authUser: User) => {
    const syncedRow = await ensureUserRow(authUser);
    setAppUser(syncedRow);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadAppUser(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setLoading(true);
        loadAppUser(newSession.user).finally(() => setLoading(false));
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAppUser]);

  const signUp = useCallback(async (email: string, password: string, displayName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName, phone } },
    });
    if (error) return { error: error.message };
    const newUser = data.user;
    if (newUser) {
      // Brand new user: check first, then insert with role = "customer".
      // NEVER use upsert here — that could overwrite role if the row somehow already exists.
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("id", newUser.id)
        .maybeSingle();

      if (existing) {
        // Row already exists (rare) — only update display_name/phone, preserve role.
        const { data: updated } = await supabase
          .from("users")
          .update({ display_name: displayName, phone })
          .eq("id", newUser.id)
          .select()
          .maybeSingle();
        if (updated) setAppUser(updated as AppUser);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert({ id: newUser.id, display_name: displayName, phone, role: "customer" })
          .select()
          .maybeSingle();
        if (!insertError && inserted) setAppUser(inserted as AppUser);
      }
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAppUser(null);
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (user) await loadAppUser(user);
  }, [user, loadAppUser]);

  const updateAppUser = useCallback(
    async (updates: Partial<Pick<AppUser, "display_name" | "phone">>) => {
      if (!user) return { error: "Not authenticated" };
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .maybeSingle();
      if (error) return { error: error.message };
      if (data) setAppUser(data as AppUser);
      return { error: null };
    },
    [user]
  );

  const isAdmin = appUser?.role === "admin";

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, appUser, loading, isAdmin, signUp, signIn, signOut, refreshAppUser, updateAppUser }),
    [user, session, appUser, loading, isAdmin, signUp, signIn, signOut, refreshAppUser, updateAppUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
