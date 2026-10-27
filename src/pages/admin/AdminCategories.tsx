import { useEffect, useState } from "react";
import { supabase, IMAGES_BUCKET } from "../../lib/supabase";
import type { Category } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { formatCompactNumber } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

interface CategoryFormState {
  id: string | null;
  name: string;
  description: string;
  image: string;
}

const EMPTY_FORM: CategoryFormState = { id: null, name: "", description: "", image: "" };

export default function AdminCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  async function loadCategories() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    if (data) setCategories(data as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setCurrentStep(1);
    setPreviewMode(false);
    setShowForm(true);
  }

  function openEditForm(cat: Category) {
    setForm({ id: cat.id, name: cat.name, description: cat.description || "", image: cat.image || "" });
    setCurrentStep(1);
    setPreviewMode(false);
    setShowForm(true);
  }

  function handleNextStep() {
    if (currentStep === 1) {
      if (!form.name.trim()) {
        showToast("Collection name is required before proceeding.", "error");
        return;
      }
      setCurrentStep(2);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file, { upsert: false });
    if (error) {
      showToast(`Upload failed: ${error.message}`, "error");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) {
      setForm((prev) => ({ ...prev, image: data.publicUrl }));
      showToast("Image uploaded successfully.", "success");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function executeSave() {
    setShowConfirmModal(false);
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image: form.image || null,
    };

    if (form.id) {
      const { data, error } = await supabase.from("categories").update(payload).eq("id", form.id).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setCategories((prev) => prev.map((c) => (c.id === form.id ? (data as Category) : c)));
        showToast("Collection updated.", "success");
      }
    } else {
      const { data, error } = await supabase.from("categories").insert(payload).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setCategories((prev) => [data as Category, ...prev]);
        showToast("Collection created.", "success");
      }
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this collection? Artworks linked to it will remain but lose the collection tag.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast("Category deleted.", "success");
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400";

  if (showForm) {
    return (
      <div className="space-y-6 pb-24 animate-fadeIn">
        {/* Top Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 mb-1 inline-flex items-center gap-1"
            >
              ← Back to Collections List
            </button>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {form.id ? "Edit Collection" : "Create New Collection"}
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Step {currentStep} of 2 — {currentStep === 1 ? "Collection Details" : "Collection Banner Image"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`rounded-2xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs ${
                previewMode ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {previewMode ? "✏️ Edit Form View" : "📱 Customer Shop Preview"}
            </button>
          </div>
        </div>

        {/* Step Navigation Indicators */}
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                currentStep >= step ? "bg-slate-900" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Preview Frame */}
        {previewMode ? (
          <div className="flex flex-col items-center justify-center py-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">
              Live Shop Preview (iPhone Simulator)
            </p>
            <div className="relative w-[300px] sm:w-[320px] h-[600px] bg-black rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800">
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-25 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
              </div>

              <div className="relative h-full w-full bg-white rounded-[36px] overflow-y-auto pt-10 px-4 pb-6 space-y-4">
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">The Christy Black Gallery</span>
                  <h4 className="font-display text-sm font-bold text-slate-900">Collection View</h4>
                </div>

                <div className="group relative block aspect-[1/0.85] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
                  {form.image ? (
                    <img src={form.image} alt={form.name || "Collection"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image Uploaded</div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                    <h3 className="font-display text-base font-bold text-white truncate">
                      {form.name || "Untitled Collection"}
                    </h3>
                    {form.description && (
                      <p className="mt-1 text-[11px] text-slate-200 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step-by-Step Wizard */
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collection Name *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Abstract Masterpieces"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                  <textarea
                    className={inputClass}
                    placeholder="Brief collection overview"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collection Banner Image</label>
                  {form.image && (
                    <div className="mb-3 h-40 w-32 overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
                      <img src={form.image} alt="preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:bg-slate-50 shadow-xs">
                    <span>{uploading ? "Uploading..." : "+ Upload Image File"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow hover:bg-slate-800"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow hover:bg-slate-800"
                  >
                    Review & Save
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900">Confirm Collection Details</h3>
              <p className="text-xs text-slate-600">
                Are you ready to publish <strong className="text-slate-900">{form.name}</strong> to the gallery website?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <AdminSectionHeader
        emoji="🗂️"
        title="Collections Management"
        subtitle={`${formatCompactNumber(categories.length)} collection${categories.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={openNewForm}
            className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
          >
            <span>+</span> Add Collection
          </button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 w-full animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-slate-500">No collections yet. Click &quot;Add Collection&quot; to create one.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 mb-3">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditForm(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors text-xs"
                      title="Edit Collection"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs"
                      title="Delete Collection"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}