import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../lib/types";
import { safeImages } from "../lib/helpers";
import EmptyState from "../components/EmptyState";

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

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").eq("id", id).maybeSingle(),
        supabase.from("products").select("*").eq("category_id", id).eq("visibility", true),
      ]);
      if (!mounted) return;
      setCategory((catRes.data as Category) || null);
      setProducts((prodRes.data as Product[]) || []);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!loading && !category) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Collection not found"
          message="This collection may have been removed."
          action={
            <Link to="/categories" className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-900 underline">
              Back to Collections
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Category Banner (Reverted to object-cover) */}
      <div className="relative flex h-56 sm:h-72 items-end overflow-hidden bg-slate-900">
        {category?.image && (
          <img
            src={category.image}
            alt={category.name}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 pb-8 space-y-1">
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-wide text-white">
            {category?.name || "Collection"}
          </h1>
          {category?.description && (
            <p className="max-w-xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState title="No artworks yet" message="Artworks in this collection will appear here soon." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const image = safeImages(product.images)[0];
              const productKey = product.slug || product.id;
              return (
                <Link
                  key={product.id}
                  to={`/product/${productKey}`}
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
    </div>
  );
}