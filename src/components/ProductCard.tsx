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

  const rawCategory = (product as any).category || (product as any).collection_name || "Original Art";
  const categoryName = typeof rawCategory === 'object' && rawCategory !== null 
    ? (rawCategory.name || "Original Art") 
    : (rawCategory || "Original Art");

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative block aspect-4/5 w-full overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-dark-card"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <img
        src={(hovering && secondary ? secondary : primary) || "/artwork-placeholder.svg"}
        alt={product.title || product.name}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />

      {/* Dark Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

      {/* Top Badges */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
        {product.new_arrival && (
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-900 shadow">
            New
          </span>
        )}
        {product.compare_price && product.compare_price > product.price && (
          <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow">
            Sale
          </span>
        )}
      </div>

      {/* Sold Out Overlay */}
      {soldOut && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <span className="rounded-full bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-slate-900 shadow">
            {product.availability_status}
          </span>
        </div>
      )}

      {/* Card Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-6 sm:p-7">
        <span className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400">
          {categoryName}
        </span>
        <h3 className="font-display text-xl font-semibold leading-tight text-white drop-shadow-sm sm:text-2xl">
          {product.title || product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="text-sm font-medium text-slate-200">
            {formatPrice(product.price)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}