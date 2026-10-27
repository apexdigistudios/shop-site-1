import { useEffect, useState } from "react";
import { supabase, IMAGES_BUCKET } from "../../lib/supabase";
import type { Testimonial } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { formatCompactNumber } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

interface FormState {
  id: string | null;
  name: string;
  message: string;
  image: string;
}

const EMPTY_FORM: FormState = { id: null, name: "", message: "", image: "" };

export default function AdminTestimonials() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*");
    if (data) setTestimonials(data as Testimonial[]);
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `testimonials/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file);
    if (error) {
      showToast(error.message, "error");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) setForm((prev) => ({ ...prev, image: data.publicUrl }));
    setUploading(false);
    e.target.value = "";
  }

  async function saveTestimonial(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      showToast("Name and message are required.", "error");
      return;
    }
    setSaving(true);
    const payload = { name: form.name.trim(), message: form.message.trim(), image: form.image || null };

    if (form.id) {
      const { data, error } = await supabase.from("testimonials").update(payload).eq("id", form.id).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setTestimonials((prev) => prev.map((t) => (t.id === form.id ? (data as Testimonial) : t)));
        showToast("Testimonial updated.", "success");
      }
    } else {
      const { data, error } = await supabase.from("testimonials").insert(payload).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setTestimonials((prev) => [data as Testimonial, ...prev]);
        showToast("Testimonial added.", "success");
      }
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function deleteTestimonial(id: string) {
    if (!window.confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    showToast("Testimonial deleted.", "success");
  }

  const inputClass =
    "w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white";

  return (
    <div>
      <AdminSectionHeader
        emoji="💬"
        title="Testimonials"
        subtitle={`${formatCompactNumber(testimonials.length)} testimonial${testimonials.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="flex h-10 items-center rounded-full bg-luxury-black px-5 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black"
          >
            + Add Testimonial
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={saveTestimonial}
          className="mt-6 space-y-4 rounded-2xl border border-border-ash bg-pure-white p-6 transition-theme dark:border-dark-grey dark:bg-dark-grey"
        >
          <h2 className="font-display text-xl">{form.id ? "Edit Testimonial" : "New Testimonial"}</h2>
          <input
            className={inputClass}
            placeholder="Client name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <textarea
            className={inputClass}
            placeholder="Testimonial message"
            rows={3}
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          />
          <div>
            {form.image && (
              <div className="mb-3 h-20 w-20 overflow-hidden rounded-full border border-border-ash dark:border-dark-grey">
                <img src={form.image} alt="preview" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="inline-block cursor-pointer rounded-full border border-luxury-black px-5 py-2 text-xs uppercase tracking-widest dark:border-pure-white">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
            >
              {saving ? "Saving..." : "Save Testimonial"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-border-ash px-6 py-2.5 text-xs uppercase tracking-widest dark:border-dark-grey"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="h-20 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
        ) : testimonials.length === 0 ? (
          <p className="text-sm text-ash-grey">No testimonials added yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border border-border-ash p-5 transition-theme dark:border-dark-grey">
                <div className="flex items-center gap-3">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-luxury-black text-pure-white dark:bg-pure-white dark:text-luxury-black">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium">{t.name}</span>
                </div>
                <p className="mt-3 text-sm text-ash-grey">{t.message}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => {
                      setForm({ id: t.id, name: t.name, message: t.message, image: t.image || "" });
                      setShowForm(true);
                    }}
                    className="text-xs uppercase tracking-widest text-luxury-black underline dark:text-pure-white"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteTestimonial(t.id)} className="text-xs uppercase tracking-widest text-alert-red underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
