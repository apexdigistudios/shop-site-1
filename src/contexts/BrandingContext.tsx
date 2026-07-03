import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface BrandingContextValue {
  logoUrl: string | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  setLogoUrl: (url: string | null) => void;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBranding = useCallback(async () => {
    const { data } = await supabase.from("home_text").select("logo_url").limit(1).maybeSingle();
    const url = (data as { logo_url?: string | null } | null)?.logo_url ?? null;
    setLogoUrlState(url && url.trim().length > 0 ? url : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  const value = useMemo<BrandingContextValue>(
    () => ({ logoUrl, loading, refreshBranding, setLogoUrl: setLogoUrlState }),
    [logoUrl, loading, refreshBranding]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
}
