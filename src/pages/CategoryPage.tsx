import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../lib/types";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";

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
      <div className="mx-auto max-w-3xl px-5 py-24">
        <EmptyState
          title="Collection not found"
          message="This collection may have been removed."
          action={
            <Link to="/categories" className="mt-2 text-xs uppercase tracking-widest text-luxury-black underline dark:text-pure-white">
              Back to Collections
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="relative flex h-64 items-end overflow-hidden bg-luxury-black sm:h-80">
        {category?.image && (
          <img src={category.image} alt={category.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-deep-black/90 via-deep-black/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8">
          <h1 className="font-display text-4xl tracking-wide text-pure-white">{category?.name || "Collection"}</h1>
          {category?.description && <p className="mt-2 max-w-xl text-sm text-soft-grey">{category.description}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-3/4 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState title="No artworks yet" message="Artworks in this collection will appear here soon." />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
