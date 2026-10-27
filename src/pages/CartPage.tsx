import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { safeImages } from "../lib/helpers";
import EmptyState from "../components/EmptyState";
import { useToast } from "../contexts/ToastContext";

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

export default function CartPage() {
  const { items, loading, subtotal, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleRemove(id: string) {
    try {
      await removeFromCart(id);
      showToast("Artwork removed from your acquisition bag.", "info");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 pb-24 space-y-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-slate-900">
        Your Acquisition Bag
      </h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 w-full animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your acquisition bag is empty"
          message="Discover paintings and masterworks from the collection."
          action={
            <Link
              to="/shop"
              className="mt-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
            >
              Browse Artworks
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const image = safeImages(item.product?.images)[0];
              const productKey = item.product?.slug || item.product?.id;
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md"
                >
                  <div className="h-24 w-24 sm:h-28 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    <img
                      src={image || "/artwork-placeholder.svg"}
                      alt={item.product?.name || "Product"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between w-full space-y-3 sm:space-y-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={productKey ? `/product/${productKey}` : "#"}
                          className="font-display text-sm sm:text-base font-bold text-slate-900 transition-colors hover:text-slate-600 line-clamp-1"
                        >
                          {item.product?.title || item.product?.name || "Artwork"}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.product?.medium || "Original artwork"}
                          {item.product?.dimensions ? ` • ${item.product.dimensions}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-slate-700 hover:bg-slate-50 rounded-l-2xl font-semibold"
                        >
                          −
                        </button>
                        <span className="min-w-[2.5ch] text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-slate-700 hover:bg-slate-50 rounded-r-2xl font-semibold"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display text-sm sm:text-base font-bold text-slate-900">
                        {formatCompactAmount((item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Order Summary</h2>
            <div className="flex justify-between text-xs sm:text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCompactAmount(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-slate-600">
              <span>Delivery</span>
              <span className="font-medium text-slate-500">Arranged after acquisition</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-4 text-sm sm:text-base font-bold text-slate-900">
              <span>Total</span>
              <span className="font-display">{formatCompactAmount(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="mt-2 w-full rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
            >
              Continue to Acquisition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}