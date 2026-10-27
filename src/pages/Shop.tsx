import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../lib/types";
import { safeImages } from "../lib/helpers";
import EmptyState from "../components/EmptyState";

type SortOption = "newest" | "price_asc" | "price_desc" | "name";

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

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const mediumFilter = searchParams.get("medium") || "";
  const sort = (searchParams.get("sort") as SortOption) || "newest";

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data: catData } = await supabase.from("categories").select("*").order("name");
      const { data: prodData } = await supabase.from("products").select("*").eq("visibility", true);
      if (!mounted) return;
      if (catData) setCategories(catData as Category[]);
      if (prodData) setProducts(prodData as Product[]);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Extract unique mediums for the medium filter dropdown
  const availableMediums = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.medium) set.add(p.medium.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((p) => p.category_id === categoryFilter);
    }
    if (mediumFilter) {
      list = list.filter((p) => p.medium?.toLowerCase() === mediumFilter.toLowerCase());
    }
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [products, search, categoryFilter, mediumFilter, sort]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 pb-24 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-slate-900">
          The Gallery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Explore original paintings and masterworks from the collection.
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col gap-4 border-y border-slate-200 py-4">
        {/* Horizontal Scrollable Categories Pills (Fully accessible and unhidden on mobile) */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-none [-webkit-overflow-scrolling:touch]">
          <div className="flex items-center gap-2 min-w-max px-1">
            <button
              type="button"
              onClick={() => updateParam("category", "")}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs ${
                !categoryFilter
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Collections
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam("category", cat.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs ${
                  categoryFilter === cat.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Controls: Search, Medium Filter, and Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <input
              value={search}
              onChange={(e) => updateParam("search", e.target.value)}
              placeholder="Search artworks..."
              className="w-full sm:w-56 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 shadow-xs placeholder:text-slate-400"
            />
            <select
              value={mediumFilter}
              onChange={(e) => updateParam("medium", e.target.value)}
              className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-900 outline-none shadow-xs"
            >
              <option value="">All Mediums</option>
              {availableMediums.map((med) => (
                <option key={med} value={med}>
                  {med}
                </option>
              ))}
            </select>
          </div>

          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-900 outline-none shadow-xs"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Artworks Grid Display: 2 on mobile, 3 on desktop */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No artworks found"
          message={
            products.length === 0
              ? "Our collection is being curated. Please check back soon."
              : "No artworks match your search or filters."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {filtered.map((product) => {
            const image = safeImages(product.images)[0];
            return (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                className="group relative block aspect-4/5 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm transition-all hover:shadow-md"
              >
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
                  {product.new_arrival && (
                    <span className="rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-900 shadow-xs">
                      New
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 sm:p-5 space-y-0.5 sm:space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 block truncate">
                    {product.medium || "Original Art"}
                  </span>
                  <h3 className="font-display text-xs sm:text-base font-bold text-white truncate">
                    {product.title || product.name}
                  </h3>
                  <p className="font-display text-xs sm:text-sm font-semibold text-slate-200">
                    {formatCompactAmount(product.price)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}