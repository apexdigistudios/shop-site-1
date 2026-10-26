import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import type { WishlistItem } from "../lib/types";
import EmptyState from "../components/EmptyState";
import { formatPrice, safeImages } from "../lib/helpers";

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
      <div className="mx-auto max-w-3xl px-5 py-24">
        <EmptyState
          title="Sign in to view your wishlist"
          message="Save your favorite pieces to revisit them anytime."
          action={
            <Link to="/account" className="mt-2 rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white dark:bg-pure-white dark:text-luxury-black">
              Login / Signup
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <h1 className="mb-10 font-display text-4xl tracking-wide text-luxury-black dark:text-pure-white">Wishlist</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Tap the heart icon on any product to save it here."
          action={
            <Link to="/shop" className="mt-2 rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white dark:bg-pure-white dark:text-luxury-black">
              Shop Now
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {items.map((item) => {
            const image = safeImages(item.product?.images)[0];
            return (
              <div key={item.id} className="group">
                <Link to={item.product ? `/product/${item.product.slug}` : "#"} className="block">
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-soft-grey/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-250 group-hover:-translate-y-[3px] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
                    <img
                      src={image || "/artwork-placeholder.svg"}
                      alt={item.product?.name || "Product"}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-3 font-display text-lg text-luxury-black dark:text-dark-text">{item.product?.title || item.product?.name}</h3>
                  <p className="text-sm text-muted-grey dark:text-dark-muted">{formatPrice(item.product?.price)}</p>
                </Link>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 rounded-full bg-luxury-black px-3 py-2 text-[10px] uppercase tracking-widest text-pure-white dark:bg-pure-white dark:text-luxury-black"
                  >
                    Add to Bag
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="rounded-full border border-border-ash px-3 py-2 text-[10px] uppercase tracking-widest text-alert-red dark:border-dark-grey"
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
