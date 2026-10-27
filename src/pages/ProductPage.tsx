import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Product, Review } from "../lib/types";
import { buildWhatsappOrderLink, safeImages, timeAgo } from "../lib/helpers";
import { useAuth } from "../contexts/AuthContext";
import { WhatsAppIcon } from "../components/icons";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import EmptyState from "../components/EmptyState";

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

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    // First try fetching by slug
    let { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();

    // Fallback to ID if not found by slug
    if (!data) {
      const { data: dataById } = await supabase.from("products").select("*").eq("id", slug).maybeSingle();
      data = dataById;
    }

    setProduct((data as Product) || null);
    setActiveImage(0);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (!product) return;
    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product.id)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews((data as Review[]) || []));

    if (user) {
      supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setIsWishlisted(true);
            setWishlistId(data.id);
          } else {
            setIsWishlisted(false);
            setWishlistId(null);
          }
        });
    }
  }, [product, user]);

  async function handleAddToCart(): Promise<boolean> {
    if (!product) return false;
    try {
      setBusy(true);
      await addToCart(product, quantity);
      showToast("Artwork added to your acquisition bag.", "success");
      return true;
    } catch (e: any) {
      showToast(e.message || "Could not add to bag.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyNow() {
    if (await handleAddToCart()) navigate("/cart");
  }

  async function toggleWishlist() {
    if (!product) return;
    if (!user) {
      showToast("Please sign in to save items.", "info");
      navigate("/account");
      return;
    }
    if (isWishlisted && wishlistId) {
      const { error } = await supabase.from("wishlist").delete().eq("id", wishlistId);
      if (!error) {
        setIsWishlisted(false);
        setWishlistId(null);
        showToast("Removed from wishlist.", "info");
      }
    } else {
      const { data, error } = await supabase
        .from("wishlist")
        .insert({ user_id: user.id, product_id: product.id })
        .select()
        .maybeSingle();
      if (!error && data) {
        setIsWishlisted(true);
        setWishlistId(data.id);
        showToast("Added to wishlist.", "success");
      }
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    if (!reviewComment.trim()) {
      showToast("Please write a comment.", "error");
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: product.id,
      user_id: user?.id || null,
      reviewer_name: reviewerName.trim() || "Anonymous",
      rating: reviewRating,
      comment: reviewComment.trim(),
      approved: false,
    });
    setSubmittingReview(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setReviewComment("");
    setReviewerName("");
    setReviewRating(5);
    showToast("Review submitted for approval. Thank you!", "success");
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:px-8 md:grid-cols-2">
        <div className="aspect-4/5 w-full animate-pulse rounded-3xl bg-slate-100" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-5 w-1/3 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 w-full animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Artwork not found"
          message="This piece may have been removed or is no longer available in the gallery."
          action={
            <Link to="/shop" className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-900 underline">
              Back to Gallery
            </Link>
          }
        />
      </div>
    );
  }

  const images = safeImages(product.images);
  const soldOut = product.availability_status !== "Available" || product.stock_status === "out_of_stock";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 pb-24 space-y-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-start">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="aspect-4/5 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-xs">
            <img
              src={images[activeImage] || "/artwork-placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-2xl border transition-all ${
                    idx === activeImage ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Meta & Purchase Actions */}
        <div className="space-y-6">
          <div className="space-y-2">
            {product.new_arrival && (
              <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                New Arrival
              </span>
            )}
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-slate-900">
              {product.title || product.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">By {product.artist || "Christy Black"}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-slate-900">
              {formatCompactAmount(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatCompactAmount(product.compare_price)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
            <dt className="text-slate-400 font-medium">Medium</dt>
            <dd className="text-right font-semibold text-slate-900">{product.medium || "Not specified"}</dd>
            <dt className="text-slate-400 font-medium">Dimensions</dt>
            <dd className="text-right font-semibold text-slate-900">{product.dimensions || "Not specified"}</dd>
            <dt className="text-slate-400 font-medium">Availability</dt>
            <dd className="text-right font-semibold text-slate-900">{product.availability_status}</dd>
          </dl>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity</span>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-l-2xl font-semibold"
              >
                −
              </button>
              <span className="min-w-[2.5ch] text-center text-xs font-bold text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-r-2xl font-semibold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={soldOut || busy}
              onClick={handleAddToCart}
              className="flex-1 rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800 disabled:opacity-40"
            >
              {soldOut ? product.availability_status : busy ? "Adding..." : "Acquire Artwork"}
            </button>
            <button
              type="button"
              disabled={soldOut || busy}
              onClick={handleBuyNow}
              className="flex-1 rounded-2xl border border-slate-900 bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-40 shadow-xs"
            >
              Secure Piece
            </button>
            <button
              type="button"
              onClick={toggleWishlist}
              aria-label="Toggle wishlist"
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                isWishlisted ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {isWishlisted ? "♥" : "♡"}
            </button>
          </div>

          <a
            href={buildWhatsappOrderLink()}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp-green px-6 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#1EBE5A]"
          >
            <WhatsAppIcon size={20} className="text-white" />
            Order via WhatsApp
          </a>

          {product.sku && <p className="text-[11px] text-slate-400">SKU: {product.sku}</p>}

          {product.long_description && (
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Artwork Details</h3>
              <p className="whitespace-pre-line text-xs text-slate-600 leading-relaxed">
                {product.long_description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-slate-200 pt-10 space-y-6">
        <h2 className="font-display text-xl font-bold text-slate-900">Customer Reviews</h2>

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500">No reviews yet. Be the first to share your thoughts on this artwork.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {review.reviewer_name || "Anonymous Customer"}
                  </span>
                  <span className="text-[10px] text-slate-400">{timeAgo(review.created_at)}</span>
                </div>
                <div className="text-amber-500 text-xs">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Submit Review Form */}
        <form onSubmit={submitReview} className="max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Write a Review</h3>
          <input
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
          />
          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setReviewRating(star)} className="text-lg">
                {star <= reviewRating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
          />
          <button
            type="submit"
            disabled={submittingReview}
            className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}