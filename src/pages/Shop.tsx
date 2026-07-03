import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../lib/types";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";

type SortOption = "newest" | "price_asc" | "price_desc" | "name";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
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
  }, [products, search, categoryFilter, sort]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl tracking-wide text-luxury-black dark:text-dark-text">The Shop</h1>
        <p className="mt-3 text-sm text-muted-grey dark:text-dark-muted">Every piece, curated for the discerning wardrobe.</p>
      </div>

      <div className="mb-10 flex flex-col gap-4 border-y border-soft-grey/40 py-5 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => updateParam("category", "")}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition-all duration-200 ${
              !categoryFilter
                ? "border-luxury-black bg-luxury-black text-pure-white dark:border-dark-accent dark:bg-dark-accent dark:text-luxury-black"
                : "border-soft-grey/60 text-muted-grey dark:border-dark-border dark:text-dark-muted"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.id)}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition-all duration-200 ${
                categoryFilter === cat.id
                  ? "border-luxury-black bg-luxury-black text-pure-white dark:border-dark-accent dark:bg-dark-accent dark:text-luxury-black"
                  : "border-soft-grey/60 text-muted-grey dark:border-dark-border dark:text-dark-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
            placeholder="Search products..."
            className="w-44 border-b border-soft-grey/60 bg-transparent py-1.5 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text sm:w-56"
          />
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-full border border-soft-grey/60 bg-transparent px-3 py-1.5 text-xs uppercase tracking-widest text-luxury-black outline-none dark:border-dark-border dark:bg-dark-card dark:text-dark-text"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products yet"
          message={
            products.length === 0
              ? "Our collection is being curated. Please check back soon."
              : "No products match your filters. Try adjusting your search."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
