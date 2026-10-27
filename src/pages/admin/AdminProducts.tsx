import { useEffect, useState } from "react";
import { supabase, IMAGES_BUCKET } from "../../lib/supabase";
import type { ArtworkAvailability, Category, Product, Visibility } from "../../lib/types";
import { formatCompactNumber, safeImages, slugify } from "../../lib/helpers";
import { useToast } from "../../contexts/ToastContext";
import AdminSectionHeader from "../../components/AdminSectionHeader";
import { WhatsAppIcon } from "../../components/icons";

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

function formatCompactAmount(value: number | null | undefined): string {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  if (n >= 1_000_000_000) {
    return "GH₵" + (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (n >= 1_000_000) {
    return "GH₵" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return "GH₵" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return "GH₵" + n.toLocaleString();
}

export default function AdminProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Confirmation Wizard State for Quick Changes
  const [pendingChange, setPendingChange] = useState<{
    productId: string;
    type: "availability" | "visibility";
    newValue: any;
    currentValue: any;
  } | null>(null);

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
    setCurrentStep(1);
    setPreviewMode(false);
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
    setCurrentStep(1);
    setPreviewMode(false);
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

  async function executeConfirmedChange() {
    if (!pendingChange) return;
    const { productId, type, newValue } = pendingChange;

    let updatePayload: any = {};
    if (type === "availability") {
      updatePayload = {
        availability_status: newValue,
        stock_status: newValue === "Available" ? "in_stock" : "out_of_stock",
      };
    }
    if (type === "visibility") {
      updatePayload = { visibility: newValue };
    }

    const { data, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId)
      .select()
      .maybeSingle();

    if (error) {
      showToast(error.message, "error");
      setPendingChange(null);
      return;
    }

    if (data) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? (data as Product) : p)));
      showToast("Artwork status updated.", "success");
    }
    setPendingChange(null);
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
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400";

  // IF SHOWFORM IS TRUE, RENDER AS A CLEAN DEDICATED PAGEVIEW INSTEAD OF A POPUP MODAL
  if (showForm) {
    return (
      <div className="space-y-6 pb-24 animate-fadeIn">
        {/* PageView Top Bar */}
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
              ← Back to Artworks List
            </button>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {form.id ? "Edit Artwork" : "Create New Artwork"}
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Step {currentStep} of 4 — {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Collection & Specs"}
              {currentStep === 3 && "Descriptions & Images"}
              {currentStep === 4 && "Availability & Status"}
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

        {/* STEP PROGRESS INDICATOR PILLS */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(step)}
              className={`h-2 rounded-full transition-all ${
                currentStep >= step ? "bg-slate-900" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* PREVIEW MODE (IPHONE FRAME VIEW - ALL WHITE BACKGROUND) */}
        {previewMode ? (
          <div className="flex flex-col items-center justify-center py-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">
              Live Shop Preview (iPhone Simulator)
            </p>
            
            {/* iPhone Frame */}
            <div className="relative w-[300px] sm:w-[320px] h-[600px] bg-black rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800">
              {/* Dynamic Island */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-25 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Screen Display */}
              <div className="relative h-full w-full bg-white rounded-[36px] overflow-y-auto pt-10 px-4 pb-6 space-y-4">
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">The Christy Black Gallery</span>
                  <h4 className="font-display text-sm font-bold text-slate-900">Gallery Storefront</h4>
                </div>

                {/* Simulated Product Card with Smaller Aspect & Buttons */}
                <div className="group relative block aspect-square w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
                  <img
                    src={form.images[0] || "/artwork-placeholder.svg"}
                    alt={form.name || "Preview Artwork"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                    {form.new_arrival && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-slate-900">
                        New
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                    <span className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-400">
                      {form.medium || "Original Art"}
                    </span>
                    <h3 className="font-display text-sm font-semibold leading-tight text-white truncate">
                      {form.name || "Untitled Artwork"}
                    </h3>
                    <p className="mt-0.5 text-xs font-bold text-slate-200">
                      {formatCompactAmount(parseFloat(form.price) || 0)}
                    </p>
                  </div>
                </div>

                {/* Action buttons inside preview */}
                <div className="space-y-2 pt-1">
                  <div className="w-full rounded-xl bg-slate-900 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    Order Now
                  </div>
                  <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-whatsapp-green py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    <WhatsAppIcon size={14} className="text-white" />
                    <span>Chat on WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* WIZARD FORM PAGEVIEW CONTAINER */
          <form onSubmit={saveProduct} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
            {/* STEP 1: BASIC INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Artwork Title *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Royal Sunset Canvas"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price (GH₵) *</label>
                    <input
                      className={inputClass}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compare Price</label>
                    <input
                      className={inputClass}
                      placeholder="Optional sale price"
                      type="number"
                      step="0.01"
                      value={form.compare_price}
                      onChange={(e) => setForm((p) => ({ ...p, compare_price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URL Slug</label>
                    <input
                      className={inputClass}
                      placeholder="Auto-generated if empty"
                      value={form.slug}
                      onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SKU Code</label>
                    <input
                      className={inputClass}
                      placeholder="SKU-001"
                      value={form.sku}
                      onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: COLLECTION & SPECS */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collection</label>
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
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Artist</label>
                    <input
                      className={inputClass}
                      value={form.artist}
                      onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Medium</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Oil on Canvas"
                      value={form.medium}
                      onChange={(e) => setForm((p) => ({ ...p, medium: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dimensions</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. 24 x 36 in"
                      value={form.dimensions}
                      onChange={(e) => setForm((p) => ({ ...p, dimensions: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DESCRIPTIONS & IMAGES */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Short Description</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Long Description</label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={form.long_description}
                    onChange={(e) => setForm((p) => ({ ...p, long_description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Artwork Images</label>
                  <div className="flex flex-wrap gap-3">
                    {form.images.map((img) => (
                      <div key={img} className="relative h-20 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                        <img src={img} alt="preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(img)}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:bg-slate-50 shadow-xs">
                    <span>{uploading ? "Uploading..." : "+ Upload Image Files"}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
            )}

            {/* STEP 4: AVAILABILITY & TAGS */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Availability</label>
                    <select
                      className={inputClass}
                      value={form.availability_status}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          availability_status: e.target.value as ArtworkAvailability,
                        }))
                      }
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visibility</label>
                    <select
                      className={inputClass}
                      value={form.visibility ? "true" : "false"}
                      onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value === "true" }))}
                    >
                      <option value="true">Visible</option>
                      <option value="false">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                      className="rounded border-slate-300 h-4 w-4 text-slate-900"
                    />
                    Featured Artwork
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.new_arrival}
                      onChange={(e) => setForm((p) => ({ ...p, new_arrival: e.target.checked }))}
                      className="rounded border-slate-300 h-4 w-4 text-slate-900"
                    />
                    New Arrival Badge
                  </label>
                </div>
              </div>
            )}

            {/* STEP WIZARD NAVIGATION FOOTER */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow hover:bg-slate-800"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save & Publish"}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    );
  }

  // DEFAULT VIEW: RECTANGULAR HORIZONTAL ARTWORKS LIST
  return (
    <div className="space-y-6 pb-24">
      <AdminSectionHeader
        emoji="🖼️"
        title="Artworks Management"
        subtitle={`${formatCompactNumber(products.length)} total artwork(s) available`}
        action={
          <button
            onClick={openNewForm}
            className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
          >
            <span>+</span> Add Artwork
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
          No artworks yet. Click "Add Artwork" to create your first listing.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const image = safeImages(product.images)[0];
            return (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-md"
              >
                {/* Left: Thumbnail & Details (Rectangular Card Structure) */}
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto sm:flex-1">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs">
                    {image ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-400">N/A</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate font-display text-sm font-bold text-slate-900">
                      {product.title || product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-semibold text-slate-900">
                        {formatCompactAmount(product.price)}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[11px] text-slate-500 truncate">{product.medium || "Original Art"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Selectors & Action Icon Buttons */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <select
                      value={product.availability_status || "Available"}
                      onChange={(e) =>
                        setPendingChange({
                          productId: product.id,
                          type: "availability",
                          newValue: e.target.value as ArtworkAvailability,
                          currentValue: product.availability_status || "Available",
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-900 outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                    </select>

                    <select
                      value={product.visibility ? "true" : "false"}
                      onChange={(e) =>
                        setPendingChange({
                          productId: product.id,
                          type: "visibility",
                          newValue: e.target.value === "true",
                          currentValue: product.visibility ? "Visible" : "Hidden",
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-900 outline-none"
                    >
                      <option value="true">Visible</option>
                      <option value="false">Hidden</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditForm(product)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                      title="Edit Artwork"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete Artwork"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION MODAL WIZARD */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">Confirm Artwork Update</h3>
            <p className="text-xs text-slate-600">
              You are about to change the artwork <span className="font-semibold capitalize">{pendingChange.type}</span> from{" "}
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {String(pendingChange.currentValue).replace(/_/g, " ")}
              </span>{" "}
              to{" "}
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                {String(pendingChange.newValue).replace(/_/g, " ")}
              </span>
              .
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedChange}
                className="rounded-2xl bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-slate-800"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}