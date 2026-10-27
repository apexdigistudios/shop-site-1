import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category } from "../lib/types";
import EmptyState from "../components/EmptyState";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!mounted) return;
        if (data) setCategories(data as Category[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 pb-24 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-slate-900">
          Collections
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Explore curated collections of paintings, prints, and masterworks.
        </p>
      </div>

      {/* Grid Display: 2 items per row on mobile, 3 on tablet, 4 on desktop */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" message="Categories added by the admin will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.id}`}
              className="group relative block aspect-4/5 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-xs transition-all hover:shadow-md"
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-4 text-slate-400">
                  <span className="font-display text-sm font-bold text-center">{cat.name}</span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Content Box */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 sm:p-5 space-y-0.5 sm:space-y-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 block truncate">
                  Collection
                </span>
                <h3 className="font-display text-xs sm:text-base font-bold text-white truncate">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="line-clamp-2 text-[10px] sm:text-xs text-slate-200 leading-relaxed opacity-90">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}