import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, HomeText, Product, Testimonial } from "../lib/types";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { safeImages } from "../lib/helpers";

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
    <div>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100vh-76px)] items-center justify-center overflow-hidden bg-[#fafafc] text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(226,232,240,0.75),transparent_65%)]" />
        <div className="absolute inset-x-[12%] top-[14%] h-[72%] border border-slate-200/70" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-6 text-[11px] uppercase tracking-[0.5em] text-slate-600 animate-fade-up">
            ORIGINAL ARTWORKS BY CHRISTY BLACK
          </p>
          <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-wide text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl animate-fade-up">
            {homeText?.hero_title || "The Christy Black Art Gallery"}
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base animate-fade-up">
            {homeText?.hero_subtitle || "Discover original paintings and masterworks by Christy Black."}
          </p>
          <div className="mt-12 animate-fade-up">
            <Link
              to="/shop"
              className="inline-flex h-12 items-center rounded-full bg-slate-900 px-10 text-xs uppercase tracking-[0.3em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700"
            >
              Explore the Collection
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] text-slate-500">
          Scroll to Discover
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-pure-white py-24 transition-theme dark:bg-dark-card">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl tracking-wide text-luxury-black dark:text-dark-text sm:text-4xl">
            Our Story
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-grey dark:text-dark-muted sm:text-base">
            {homeText?.about_text ||
              "The Christy Black Art Gallery presents a collection of original paintings, created with expressive technique and enduring vision."}
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide text-luxury-black dark:text-dark-text">
            Explore the Collection
          </h2>
          <Link to="/categories" className="text-xs uppercase tracking-widest text-muted-grey transition-colors duration-200 hover:text-luxury-black dark:text-dark-muted dark:hover:text-dark-text">
            View All
          </Link>
        </div>

        {!loading && categories.length === 0 ? (
          <EmptyState title="No categories yet" message="Categories added by the admin will appear here." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mx-auto aspect-[1/1.1] w-full max-w-[255px] animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-elevated" />
                ))
              : categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.id}`}
                    className="group relative mx-auto block aspect-[1/1.1] w-full max-w-[255px] overflow-hidden rounded-2xl border border-soft-grey/40 bg-beige-cream transition-all duration-250 hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] dark:border-dark-border dark:bg-dark-card dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
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
                    <div className="absolute inset-0 bg-linear-to-t from-deep-black/75 via-deep-black/20 to-transparent" />
                    <span className="absolute bottom-4 left-4 font-display text-lg tracking-wide text-pure-white">
                      {cat.name}
                    </span>
                  </Link>
                ))}
          </div>
        )}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-pure-white py-16 transition-theme dark:bg-dark-elevated">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-3xl tracking-wide text-luxury-black dark:text-dark-text">
              Featured Pieces
            </h2>
            <Link to="/shop" className="text-xs uppercase tracking-widest text-muted-grey transition-colors duration-200 hover:text-luxury-black dark:text-dark-muted dark:hover:text-dark-text">
              Shop All
            </Link>
          </div>

          {!loading && featured.length === 0 ? (
            <EmptyState title="No artworks yet" message="Featured artworks added by the gallery will appear here soon." />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-3/4 w-full animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
                  ))
                : featured.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="bg-beige-cream py-20 transition-theme dark:bg-dark-card">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center font-display text-3xl tracking-wide text-luxury-black dark:text-dark-text">
              Words From Our Clients
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col items-center rounded-2xl border border-soft-grey/40 bg-pure-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-elevated dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                >
                  {safeImages(t.image ? [t.image] : []).length > 0 ? (
                    <img src={t.image as string} alt={t.name} className="mb-4 h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-luxury-black font-display text-lg text-pure-white dark:bg-dark-accent dark:text-luxury-black">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <p className="text-sm italic text-muted-grey dark:text-dark-muted">&ldquo;{t.message}&rdquo;</p>
                  <span className="mt-4 text-xs uppercase tracking-widest text-luxury-black dark:text-dark-text">
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
