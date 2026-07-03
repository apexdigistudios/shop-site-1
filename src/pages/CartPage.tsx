import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { formatPrice, safeImages } from "../lib/helpers";
import EmptyState from "../components/EmptyState";
import { useToast } from "../contexts/ToastContext";

export default function CartPage() {
  const { items, loading, subtotal, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleRemove(id: string) {
    try {
      await removeFromCart(id);
      showToast("Removed from bag.", "info");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <h1 className="mb-10 font-display text-4xl tracking-wide text-luxury-black dark:text-dark-text">Your Bag</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 w-full animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your bag is empty"
          message="Discover pieces from our latest collection."
          action={
            <Link to="/shop" className="mt-2 rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black">
              Shop Now
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {items.map((item) => {
              const image = safeImages(item.product?.images)[0];
              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-soft-grey/40 bg-pure-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                >
                  <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-beige-cream dark:bg-dark-elevated">
                    <img
                      src={image || "/placeholder.jpg"}
                      alt={item.product?.name || "Product"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={item.product ? `/product/${item.product.slug}` : "#"}
                          className="font-display text-lg text-luxury-black transition-colors duration-200 hover:text-ash-grey dark:text-dark-text dark:hover:text-dark-secondary"
                        >
                          {item.product?.name || "Product"}
                        </Link>
                        <p className="mt-1 text-xs text-muted-grey dark:text-dark-muted">
                          {item.size ? `Size: ${item.size}` : ""} {item.color ? `• Color: ${item.color}` : ""}
                        </p>
                      </div>
                      <button onClick={() => handleRemove(item.id)} className="text-xs uppercase tracking-widest text-alert-red transition-colors duration-200 hover:text-alert-red/70">
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-soft-grey/60 dark:border-dark-border">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-luxury-black transition-colors duration-200 hover:text-ash-grey dark:text-dark-text"
                        >
                          −
                        </button>
                        <span className="min-w-[2ch] text-center text-sm text-luxury-black dark:text-dark-text">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-luxury-black transition-colors duration-200 hover:text-ash-grey dark:text-dark-text"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-luxury-black dark:text-dark-text">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
            <h2 className="font-display text-xl tracking-wide text-luxury-black dark:text-dark-text">Order Summary</h2>
            <div className="mt-4 flex justify-between text-sm text-muted-grey dark:text-dark-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-muted-grey dark:text-dark-muted">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-soft-grey/40 pt-4 text-base text-luxury-black transition-theme dark:border-dark-border dark:text-dark-text">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full rounded-full bg-luxury-black px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-pure-white transition-all duration-250 hover:scale-[1.02] dark:bg-dark-accent dark:text-luxury-black"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
