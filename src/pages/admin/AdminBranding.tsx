import { useEffect, useState } from "react";
import { supabase, IMAGES_BUCKET } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import { useBranding } from "../../contexts/BrandingContext";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminBranding() {
  const { showToast } = useToast();
  const { logoUrl, refreshBranding, setLogoUrl } = useBranding();
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("home_text")
      .select("id, logo_url")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRowId((data as { id: string }).id);
        setLoading(false);
      });
  }, []);

  async function ensureRow(): Promise<string | null> {
    if (rowId) return rowId;
    const { data, error } = await supabase.from("home_text").insert({}).select("id").maybeSingle();
    if (error || !data) {
      showToast(error?.message || "Could not create home_text row.", "error");
      return null;
    }
    setRowId((data as { id: string }).id);
    return (data as { id: string }).id;
  }

  async function saveLogoUrl(url: string | null): Promise<boolean> {
    setSaving(true);
    const id = await ensureRow();
    if (!id) {
      setSaving(false);
      return false;
    }
    const { error } = await supabase.from("home_text").update({ logo_url: url }).eq("id", id);
    setSaving(false);
    if (error) {
      showToast(error.message, "error");
      return false;
    }
    setLogoUrl(url);
    await refreshBranding();
    return true;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `branding/site-logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      showToast(`Upload failed: ${uploadError.message}`, "error");
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: publicUrlData } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
    const publicUrl = publicUrlData?.publicUrl || null;

    if (publicUrl) {
      const ok = await saveLogoUrl(publicUrl);
      if (ok) showToast("Logo uploaded and applied.", "success");
    }

    setUploading(false);
    e.target.value = "";
  }

  async function handleRemove() {
    if (!window.confirm("Remove the current logo and revert to the text mark?")) return;
    const ok = await saveLogoUrl(null);
    if (ok) showToast("Logo removed.", "info");
  }

  return (
    <div>
      <AdminSectionHeader
        emoji="🖼️"
        title="Site Branding"
        subtitle="Upload, preview, replace, or remove the site logo shown in the header."
      />

      {loading ? (
        <div className="mt-8 h-56 w-full max-w-2xl animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
      ) : (
        <div className="mt-8 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LIGHT PREVIEW */}
          <div className="rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey">Light Preview</p>
              <span className="rounded-full bg-beige-cream px-2.5 py-1 text-[10px] uppercase tracking-widest text-luxury-black">Header</span>
            </div>
            <div className="flex min-h-[100px] items-center justify-center rounded-xl bg-warm-cream p-6">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview (light)" className="h-14 w-auto max-w-full object-contain" />
              ) : (
                <p className="text-xs text-muted-grey">No logo uploaded — text mark will show</p>
              )}
            </div>
          </div>

          {/* DARK PREVIEW */}
          <div className="rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">Dark Preview</p>
              <span className="rounded-full bg-dark-elevated px-2.5 py-1 text-[10px] uppercase tracking-widest text-dark-text">Header</span>
            </div>
            <div className="flex min-h-[100px] items-center justify-center rounded-xl bg-dark-bg p-6">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview (dark)" className="h-14 w-auto max-w-full object-contain" />
              ) : (
                <p className="text-xs text-dark-muted">No logo uploaded — text mark will show</p>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] lg:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">Actions</p>
            <p className="mt-2 text-xs text-muted-grey dark:text-dark-muted">
              PNG or SVG recommended. Transparent background works best. Logo will scale to fit the header height (max ~44px).
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex h-11 cursor-pointer items-center rounded-full bg-luxury-black px-5 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black">
                {uploading ? "Uploading..." : logoUrl ? "Replace Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading || saving}
                />
              </label>

              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={saving}
                  className="flex h-11 items-center rounded-full border border-alert-red px-5 text-xs uppercase tracking-widest text-alert-red transition-colors duration-200 hover:bg-alert-red/10 disabled:opacity-50"
                >
                  Remove Logo
                </button>
              )}

              {logoUrl && (
                <a
                  href={logoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center rounded-full border border-soft-grey/60 px-5 text-xs uppercase tracking-widest text-luxury-black transition-colors duration-200 hover:bg-luxury-black hover:text-pure-white dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-accent dark:hover:text-luxury-black"
                >
                  Open Full Size
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
