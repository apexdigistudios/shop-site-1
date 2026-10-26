import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../lib/types";
import { formatPrice, safeImages } from "../lib/helpers";

export default function ProductCard({ product }: { product: Product }) {
  const [hovering, setHovering] = useState(false);
  const images = safeImages(product.images);
  const primary = images[0] ?? null;
  const secondary = images[1] ?? null;
  const soldOut = product.availability_status !== "Available" || product.stock_status === "out_of_stock";

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block transition-transform duration-250 ease-out hover:-translate-y-[3px]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-pure-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all duration-250 ease-out group-hover:border-slate-300 group-hover:shadow-[0_10px_26px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-dark-card dark:shadow-[0_8px_22px_rgba(255,255,255,0.03)] dark:group-hover:border-slate-500 dark:group-hover:shadow-[0_10px_28px_rgba(255,255,255,0.05)]">
        <img
          src={(hovering && secondary ? secondary : primary) || "/artwork-placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.new_arrival && (
            <span className="rounded-full bg-luxury-black px-3 py-1 text-[10px] uppercase tracking-widest text-pure-white dark:bg-dark-accent dark:text-luxury-black">
              New
            </span>
          )}
          {product.compare_price && product.compare_price > product.price && (
            <span className="rounded-full bg-alert-red px-3 py-1 text-[10px] uppercase tracking-widest text-pure-white">
              Sale
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-deep-black/40">
            <span className="rounded-full bg-pure-white px-4 py-1.5 text-xs uppercase tracking-widest text-luxury-black">
              {product.availability_status}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-0.5">
        <h3 className="font-display text-lg leading-snug tracking-wide text-luxury-black transition-colors duration-250 group-hover:text-ash-grey dark:text-dark-text dark:group-hover:text-dark-secondary">
          {product.title || product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-luxury-black dark:text-dark-text">{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs text-muted-grey line-through dark:text-dark-muted">{formatPrice(product.compare_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
