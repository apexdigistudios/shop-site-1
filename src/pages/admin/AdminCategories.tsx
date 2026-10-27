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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    setShowForm(true);
  }

  function openEditForm(cat: Category) {
    setForm({ id: cat.id, name: cat.name, description: cat.description || "", image: cat.image || "" });
    setShowForm(true);
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
      showToast("Image uploaded.", "success");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Category name is required.", "error");
      return;
    }
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
        showToast("Category updated.", "success");
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
        showToast("Category created.", "success");
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
    "w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white";

  return (
    <div>
      <AdminSectionHeader
        emoji="🗂️"
        title="Collections"
        subtitle={`${formatCompactNumber(categories.length)} collection${categories.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={openNewForm}
            className="flex h-10 items-center rounded-full bg-luxury-black px-5 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black"
          >
            + Add Collection
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={saveCategory}
          className="mt-6 space-y-4 rounded-2xl border border-border-ash bg-pure-white p-6 transition-theme dark:border-dark-grey dark:bg-dark-grey"
        >
          <h2 className="font-display text-xl">{form.id ? "Edit Collection" : "New Collection"}</h2>
          <input
            className={inputClass}
            placeholder="Collection name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <textarea
            className={inputClass}
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div>
            {form.image && (
              <div className="mb-3 h-32 w-28 overflow-hidden rounded-lg border border-border-ash dark:border-dark-grey">
                <img src={form.image} alt="preview" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="inline-block cursor-pointer rounded-full border border-luxury-black px-5 py-2 text-xs uppercase tracking-widest dark:border-pure-white">
              {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
            >
              {saving ? "Saving..." : "Save Collection"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="rounded-full border border-border-ash px-6 py-2.5 text-xs uppercase tracking-widest dark:border-dark-grey"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-ash-grey">No collections yet. Click &quot;Add Collection&quot; to create one.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <div key={cat.id} className="overflow-hidden rounded-2xl border border-soft-grey/40 bg-pure-white transition-all duration-250 dark:border-dark-border dark:bg-dark-card">
                <div className="aspect-[1/0.85] w-full bg-beige-cream dark:bg-dark-elevated">
                  {cat.image && <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />}
                </div>
                <div className="p-3.5">
                  <h3 className="font-display text-base font-medium text-luxury-black dark:text-dark-text">{cat.name}</h3>
                  {cat.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-grey dark:text-dark-muted">{cat.description}</p>}
                  <div className="mt-2.5 flex gap-3">
                    <button onClick={() => openEditForm(cat)} className="text-xs uppercase tracking-widest text-luxury-black underline dark:text-pure-white">
                      Edit
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-xs uppercase tracking-widest text-alert-red underline">
                      Delete
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
