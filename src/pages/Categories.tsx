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
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl tracking-wide text-luxury-black dark:text-pure-white">Collections</h1>
        <p className="mt-3 text-sm text-ash-grey">Explore collections of paintings and masterworks.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mx-auto aspect-[1/1.1] w-full max-w-[270px] animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" message="Categories added by the admin will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.id}`}
              className="group relative mx-auto block aspect-[1/1.1] w-full max-w-[270px] overflow-hidden rounded-2xl border border-soft-grey/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-250 hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-grey dark:text-dark-muted">
                  <span className="font-display text-base">{cat.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black/75 via-deep-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="font-display text-xl tracking-wide text-pure-white">{cat.name}</span>
                {cat.description && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-soft-grey/90">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
