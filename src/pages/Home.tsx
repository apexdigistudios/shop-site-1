import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, HomeText, Product, Testimonial } from "../lib/types";
import EmptyState from "../components/EmptyState";
import Hero from "../components/Hero";
import { safeImages } from "../lib/helpers";

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

export default function Home() {
  const [homeText, setHomeText] = useState<HomeText | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const [homeTextRes, productsRes, categoriesRes, testimonialsRes] = await Promise.all([
        supabase.from("home_text").select("*").limit(1).maybeSingle(),
        supabase
          .from("products")
          .select("*")
          .eq("visibility", true)
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("categories").select("*").order("created_at", { ascending: false }).limit(4),
        supabase.from("testimonials").select("*").limit(6),
      ]);
      if (!mounted) return;
      if (homeTextRes.data) setHomeText(homeTextRes.data as HomeText);
      if (productsRes.data) setFeatured(productsRes.data as Product[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as Testimonial[]);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-12 pb-24">
      <Hero />

      {/* ABOUT */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center space-y-4">
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-wide text-slate-900">
            Our Story
          </h2>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
            {homeText?.about_text ||
              "The Christy Black Art Gallery presents a collection of original paintings, created with expressive technique and enduring vision."}
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl sm:text-3xl font-bold tracking-wide text-slate-900">
            Explore the Collection
          </h2>
          <Link
            to="/categories"
            className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
          >
            View All
          </Link>
        </div>

        {!loading && categories.length === 0 ? (
          <EmptyState title="No categories yet" message="Categories added by the admin will appear here." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
                ))
              : categories.map((cat) => (
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
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
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
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-slate-50 py-16 sm:py-20 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl sm:text-3xl font-bold tracking-wide text-slate-900">
              Featured Pieces
            </h2>
            <Link
              to="/shop"
              className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
            >
              Shop All
            </Link>
          </div>

          {!loading && featured.length === 0 ? (
            <EmptyState title="No artworks yet" message="Featured artworks added by the gallery will appear here soon." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
                  ))
                : featured.map((product) => {
                    const image = safeImages(product.images)[0];
                    const productKey = product.slug || product.id;
                    return (
                      <Link
                        key={product.id}
                        to={`/product/${productKey}`}
                        className="group relative block aspect-4/5 w-full overflow-hidden rounded-3xl bg-white shadow-xs transition-all hover:shadow-md"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No Image
                          </div>
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
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-8">
          <h2 className="text-center font-display text-2xl sm:text-3xl font-bold tracking-wide text-slate-900">
            Words From Our Clients
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xs space-y-4"
              >
                {safeImages(t.image ? [t.image] : []).length > 0 ? (
                  <img src={t.image as string} alt={t.name} className="h-16 w-16 rounded-full object-cover shadow-xs" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 font-display text-base font-bold text-white shadow-xs">
                    {t.name.charAt(0)}
                  </div>
                )}
                <p className="text-xs sm:text-sm italic text-slate-600 leading-relaxed">&ldquo;{t.message}&rdquo;</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}