import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface PaystackSettingsValue {
  enabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  setEnabled: (next: boolean) => Promise<{ error: string | null }>;
}

const PaystackSettingsContext = createContext<PaystackSettingsValue | undefined>(undefined);

export function PaystackSettingsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("home_text")
      .select("paystack_enabled")
      .limit(1)
      .maybeSingle();
    if (error) {
      // If the column doesn't exist yet, fall back to disabled (safest default).
      setEnabledState(false);
      setLoading(false);
      return;
    }
    setEnabledState(Boolean(data?.paystack_enabled));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      // Ensure a row exists, then update.
      const { data: existing } = await supabase
        .from("home_text")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.from("home_text").insert({
          hero_title: "ADOB'S IMPORTS HUB",
          hero_subtitle: "Curated luxury imports, delivered with editorial precision.",
          about_text: "We source the finest imported pieces for the modern connoisseur.",
          paystack_enabled: next,
        });
        if (insertError) return { error: insertError.message };
      } else {
        const { error: updateError } = await supabase
          .from("home_text")
          .update({ paystack_enabled: next })
          .eq("id", existing.id);
        if (updateError) return { error: updateError.message };
      }

      setEnabledState(next);
      return { error: null };
    },
    []
  );

  const value = useMemo<PaystackSettingsValue>(
    () => ({ enabled, loading, refresh, setEnabled }),
    [enabled, loading, refresh, setEnabled]
  );

  return <PaystackSettingsContext.Provider value={value}>{children}</PaystackSettingsContext.Provider>;
}

export function usePaystackSettings() {
  const ctx = useContext(PaystackSettingsContext);
  if (!ctx) throw new Error("usePaystackSettings must be used within PaystackSettingsProvider");
  return ctx;
}
