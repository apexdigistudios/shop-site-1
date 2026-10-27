import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import type { WishlistItem } from "../lib/types";
import EmptyState from "../components/EmptyState";
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

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("wishlist")
      .select("*, product:products(*)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setItems((data as unknown as WishlistItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  async function handleRemove(id: string) {
    const { error } = await supabase.from("wishlist").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      showToast("Removed from wishlist.", "info");
    }
  }

  async function handleMoveToCart(item: WishlistItem) {
    if (!item.product) return;
    try {
      await addToCart(item.product, 1, null, null);
      showToast("Added to bag.", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Sign in to view your wishlist"
          message="Save your favorite pieces to revisit them anytime."
          action={
            <Link
              to="/account"
              className="mt-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
            >
              Login / Signup
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 pb-24 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-slate-900">
          Saved Artworks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Your personal collection of saved masterworks and pieces.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Tap the heart icon on any product to save it here."
          action={
            <Link
              to="/shop"
              className="mt-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
            >
              Shop Now
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const image = safeImages(item.product?.images)[0];
            const productKey = item.product?.slug || item.product?.id;
            return (
              <div key={item.id} className="flex flex-col space-y-2">
                <Link
                  to={productKey ? `/product/${productKey}` : "#"}
                  className="group relative block aspect-4/5 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-xs transition-all hover:shadow-md"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={item.product?.name || "Product"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 sm:p-5 space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 block truncate">
                      {item.product?.medium || "Original Art"}
                    </span>
                    <h3 className="font-display text-xs sm:text-base font-bold text-white truncate">
                      {item.product?.title || item.product?.name || "Artwork"}
                    </h3>
                    <p className="font-display text-xs sm:text-sm font-semibold text-slate-200">
                      {formatCompactAmount(item.product?.price)}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 rounded-2xl bg-slate-900 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-slate-800"
                  >
                    Add to Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-50 hover:border-red-200 shadow-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}