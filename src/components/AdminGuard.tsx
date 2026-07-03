import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import Loader from "./Loader";
import EmptyState from "./EmptyState";

type GuardState = "loading" | "allowed" | "no-profile" | "denied";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    // Wait for the initial session resolution before deciding anything.
    if (authLoading) return;

    // No authenticated user -> send to login.
    if (!user) {
      console.log("AUTH USER:", null);
      setState("denied");
      return;
    }

    let active = true;
    setState("loading");

    // Admin role comes ONLY from public.users.role, matched by auth.user.id.
    // Never query by email, metadata, or auth.users.role.
    (async () => {
      console.log("AUTH USER:", user.id);

      const { data: profile, error } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();

      console.log("DB USER:", profile);

      if (!active) return;

      // No row in public.users for this auth id.
      if (error || !profile) {
        console.log("ADMIN GUARD: profile missing for user", user.id, error?.message);
        setState("no-profile");
        return;
      }

      // Exact, lowercase comparison against public.users.role
      if (profile.role === "admin") {
        console.log("ADMIN GUARD: access granted for", user.id);
        setState("allowed");
      } else {
        console.log("ADMIN GUARD: access denied, role =", profile.role);
        setState("denied");
      }
    })();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  // Do NOT redirect before the query finishes.
  if (authLoading || state === "loading") return <Loader />;

  if (!user || state === "denied") return <Navigate to="/" replace />;

  if (state === "no-profile") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-cream px-5 transition-theme dark:bg-deep-black">
        <EmptyState
          title="Admin profile missing"
          message="Your account has no linked record in public.users. Please contact an administrator to create your users row with role set to 'admin'."
          action={
            <a
              href="/account"
              className="mt-2 rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white dark:bg-pure-white dark:text-luxury-black"
            >
              Back to Account
            </a>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
