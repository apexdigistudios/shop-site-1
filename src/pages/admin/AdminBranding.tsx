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
    <div className="space-y-6 pb-24">
      <AdminSectionHeader
        emoji="🖼️"
        title="Site Branding"
        subtitle="Upload, preview, replace, or remove the site logo shown in the header."
      />

      {loading ? (
        <div className="mt-8 h-56 w-full max-w-2xl animate-pulse rounded-3xl bg-slate-100" />
      ) : (
        <div className="mt-8 grid max-w-4xl grid-cols-1 gap-6">
          {/* LOGO PREVIEW CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Logo Preview</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Header Branding
              </span>
            </div>
            <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6">
              {logoUrl ? (
                <img src={logoUrl} alt="Site logo preview" className="h-14 w-auto max-w-full object-contain" />
              ) : (
                <p className="text-xs font-medium text-slate-400">No logo uploaded — standard text mark will display</p>
              )}
            </div>
          </div>

          {/* ACTIONS CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Branding Actions</p>
            <p className="text-xs text-slate-500">
              PNG or SVG recommended. Transparent backgrounds work best. The logo will automatically scale to fit the header height (max ~44px).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="flex h-11 cursor-pointer items-center rounded-2xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800">
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
                  className="flex h-11 items-center rounded-2xl border border-red-200 bg-red-50 px-5 text-xs font-semibold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  Remove Logo
                </button>
              )}

              {logoUrl && (
                <a
                  href={logoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-5 text-xs font-semibold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50 shadow-xs"
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