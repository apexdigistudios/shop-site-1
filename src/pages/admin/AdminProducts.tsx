import { useEffect, useState } from "react";
import { supabase, IMAGES_BUCKET } from "../../lib/supabase";
import type { ArtworkAvailability, Category, Product, Visibility } from "../../lib/types";
import { formatPrice, safeImages, slugify } from "../../lib/helpers";
import { useToast } from "../../contexts/ToastContext";
import AdminSectionHeader from "../../components/AdminSectionHeader";

interface ProductFormState {
  id: string | null;
  name: string;
  artist: string;
  medium: string;
  dimensions: string;
  availability_status: ArtworkAvailability;
  slug: string;
  description: string;
  long_description: string;
  price: string;
  compare_price: string;
  images: string[];
  featured: boolean;
  new_arrival: boolean;
  sku: string;
  category_id: string;
  visibility: Visibility;
}

const EMPTY_FORM: ProductFormState = {
  id: null,
  name: "",
  artist: "Christy Black",
  medium: "",
  dimensions: "",
  availability_status: "Available",
  slug: "",
  description: "",
  long_description: "",
  price: "",
  compare_price: "",
  images: [],
  featured: false,
  new_arrival: false,
  sku: "",
  category_id: "",
  visibility: true,
};

export default function AdminProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    if (catRes.data) setCategories(catRes.data as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      artist: product.artist || "Christy Black",
      medium: product.medium || "",
      dimensions: product.dimensions || "",
      availability_status: product.availability_status || "Available",
      slug: product.slug,
      description: product.description || "",
      long_description: product.long_description || "",
      price: String(product.price ?? ""),
      compare_price: product.compare_price ? String(product.compare_price) : "",
      images: safeImages(product.images),
      featured: product.featured,
      new_arrival: product.new_arrival,
      sku: product.sku || "",
      category_id: product.category_id || "",
      visibility: product.visibility,
    });
    setShowForm(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file, { upsert: false });
      if (error) {
        showToast(`Upload failed: ${error.message}`, "error");
        continue;
      }
      const { data: publicUrlData } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
      if (publicUrlData?.publicUrl) uploadedUrls.push(publicUrlData.publicUrl);
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    setUploading(false);
    e.target.value = "";
    if (uploadedUrls.length > 0) showToast("Images uploaded.", "success");
  }

  function removeImage(url: string) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      showToast("Name and price are required.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      title: form.name.trim(),
      artist: form.artist.trim() || "Christy Black",
      medium: form.medium.trim() || null,
      dimensions: form.dimensions.trim() || null,
      availability_status: form.availability_status,
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      long_description: form.long_description.trim() || null,
      price: parseFloat(form.price) || 0,
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      images: form.images,
      stock_status: form.availability_status === "Available" ? "in_stock" : "out_of_stock",
      featured: form.featured,
      new_arrival: form.new_arrival,
      sku: form.sku.trim() || null,
      category_id: form.category_id || null,
      visibility: form.visibility,
    };

    if (form.id) {
      const { data, error } = await supabase.from("products").update(payload).eq("id", form.id).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setProducts((prev) => prev.map((p) => (p.id === form.id ? (data as Product) : p)));
        showToast("Artwork updated.", "success");
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setProducts((prev) => [data as Product, ...prev]);
        showToast("Artwork created.", "success");
      }
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("Delete this artwork permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Artwork deleted.", "success");
  }

  const inputClass =
    "w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white";

  return (
    <div>
      <AdminSectionHeader
        emoji="📦"
        title="Artworks"
        subtitle={`${products.length} artwork${products.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={openNewForm}
            className="flex h-10 items-center rounded-full bg-luxury-black px-5 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black"
          >
            + Add Artwork
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={saveProduct}
          className="mt-6 space-y-5 rounded-2xl border border-border-ash bg-pure-white p-6 transition-theme dark:border-dark-grey dark:bg-dark-grey"
        >
          <h2 className="font-display text-xl">{form.id ? "Edit Artwork" : "New Artwork"}</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Artwork title"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Slug (auto-generated if empty)"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Compare-at price (optional)"
              type="number"
              step="0.01"
              value={form.compare_price}
              onChange={(e) => setForm((p) => ({ ...p, compare_price: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
            />
            <select
              className={inputClass}
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">No collection</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={form.availability_status}
              onChange={(e) => setForm((p) => ({
                ...p,
                availability_status: e.target.value as ArtworkAvailability,
              }))}
            >
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
            <select
              className={inputClass}
              value={form.visibility ? "true" : "false"}
              onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value === "true" }))}
            >
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              className={inputClass}
              placeholder="Artist"
              value={form.artist}
              onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Medium (e.g. Oil & Gold Leaf on Linen)"
              value={form.medium}
              onChange={(e) => setForm((p) => ({ ...p, medium: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Dimensions (e.g. 24 × 36 in)"
              value={form.dimensions}
              onChange={(e) => setForm((p) => ({ ...p, dimensions: e.target.value }))}
            />
          </div>

          <textarea
            className={inputClass}
            placeholder="Short description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <textarea
            className={inputClass}
            placeholder="Long description / details"
            rows={4}
            value={form.long_description}
            onChange={(e) => setForm((p) => ({ ...p, long_description: e.target.value }))}
          />

          <div>
            <span className="text-xs uppercase tracking-widest text-ash-grey">Artwork Images</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {form.images.map((img) => (
                <div key={img} className="relative h-24 w-20 overflow-hidden rounded-lg border border-border-ash dark:border-dark-grey">
                  <img src={img} alt="preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-deep-black/70 text-xs text-pure-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <label className="mt-3 inline-block cursor-pointer rounded-full border border-luxury-black px-5 py-2 text-xs uppercase tracking-widest dark:border-pure-white">
              {uploading ? "Uploading..." : "Upload Images"}
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.new_arrival}
                onChange={(e) => setForm((p) => ({ ...p, new_arrival: e.target.checked }))}
              />
              New Arrival
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
            >
              {saving ? "Saving..." : "Save Artwork"}
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-ash-grey">No artworks yet. Click &quot;Add Artwork&quot; to create your first listing.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border-ash dark:border-dark-grey">
            <table className="w-full text-left text-sm">
              <thead className="bg-beige-cream text-xs uppercase tracking-widest text-ash-grey dark:bg-luxury-black">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Artwork</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Medium</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const image = safeImages(product.images)[0];
                  return (
                    <tr key={product.id} className="border-t border-border-ash dark:border-dark-grey">
                      <td className="px-4 py-3">
                        <div className="h-14 w-12 overflow-hidden rounded-lg bg-beige-cream dark:bg-luxury-black">
                          {image && <img src={image} alt={product.name} className="h-full w-full object-cover" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">{product.title || product.name}</td>
                      <td className="px-4 py-3">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">{product.availability_status}</td>
                      <td className="px-4 py-3">{product.medium || "—"}</td>
                      <td className="px-4 py-3">{product.visibility ? "Visible" : "Hidden"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openEditForm(product)} className="text-xs uppercase tracking-widest text-luxury-black underline dark:text-pure-white">
                            Edit
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="text-xs uppercase tracking-widest text-alert-red underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
