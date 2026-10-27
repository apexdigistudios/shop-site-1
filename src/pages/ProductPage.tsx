import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Product, Review } from "../lib/types";
import { buildWhatsappOrderLink, formatPrice, safeImages, timeAgo } from "../lib/helpers";
import { useAuth } from "../contexts/AuthContext";
import { WhatsAppIcon } from "../components/icons";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import EmptyState from "../components/EmptyState";

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
    const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-8 md:grid-cols-2">
        <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-beige-cream dark:bg-dark-grey" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-beige-cream dark:bg-dark-grey" />
          <div className="h-24 w-full animate-pulse rounded bg-beige-cream dark:bg-dark-grey" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <EmptyState
          title="Product not found"
          message="This product may have been removed or is no longer available."
          action={
            <Link to="/shop" className="mt-2 text-xs uppercase tracking-widest text-luxury-black underline dark:text-pure-white">
              Back to Shop
            </Link>
          }
        />
      </div>
    );
  }

  const images = safeImages(product.images);
  const soldOut = product.availability_status !== "Available" || product.stock_status === "out_of_stock";

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border-ash bg-beige-cream transition-theme dark:border-dark-grey dark:bg-dark-grey">
            <img
              src={images[activeImage] || "/artwork-placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img + idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border transition-theme ${
                    idx === activeImage ? "border-luxury-black dark:border-pure-white" : "border-border-ash dark:border-dark-grey"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.new_arrival && (
            <span className="mb-3 inline-block rounded-full bg-luxury-black px-3 py-1 text-[10px] uppercase tracking-widest text-pure-white dark:bg-pure-white dark:text-luxury-black">
              New Arrival
            </span>
          )}
          <h1 className="font-display text-4xl tracking-wide text-luxury-black dark:text-pure-white">{product.title || product.name}</h1>
          <p className="mt-2 text-sm text-muted-grey dark:text-dark-muted">By {product.artist || "Christy Black"}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl text-luxury-black dark:text-pure-white">{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-ash-grey line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>
          {product.description && <p className="mt-5 text-sm leading-relaxed text-ash-grey">{product.description}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border-ash py-4 text-sm dark:border-dark-grey">
            <dt className="text-muted-grey dark:text-dark-muted">Medium</dt>
            <dd className="text-right text-luxury-black dark:text-dark-text">{product.medium || "Not specified"}</dd>
            <dt className="text-muted-grey dark:text-dark-muted">Dimensions</dt>
            <dd className="text-right text-luxury-black dark:text-dark-text">{product.dimensions || "Not specified"}</dd>
            <dt className="text-muted-grey dark:text-dark-muted">Availability</dt>
            <dd className="text-right text-luxury-black dark:text-dark-text">{product.availability_status}</dd>
          </dl>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest text-ash-grey">Quantity</span>
            <div className="flex items-center rounded-full border border-border-ash dark:border-dark-grey">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-luxury-black dark:text-pure-white"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center text-sm text-luxury-black dark:text-pure-white">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-1.5 text-luxury-black dark:text-pure-white">
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={soldOut || busy}
              onClick={handleAddToCart}
              className="flex-1 rounded-full bg-luxury-black px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-pure-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-pure-white dark:text-luxury-black"
            >
              {soldOut ? product.availability_status : busy ? "Adding..." : "Acquire Artwork"}
            </button>
            <button
              disabled={soldOut || busy}
              onClick={handleBuyNow}
              className="flex-1 rounded-full border border-luxury-black px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-luxury-black transition-colors hover:bg-luxury-black hover:text-pure-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-pure-white dark:text-pure-white dark:hover:bg-pure-white dark:hover:text-luxury-black"
            >
              Secure Piece
            </button>
            <button
              onClick={toggleWishlist}
              aria-label="Toggle wishlist"
              className={`flex items-center justify-center rounded-full border px-5 py-3.5 transition-theme ${
                isWishlisted ? "border-alert-red text-alert-red" : "border-border-ash text-ash-grey dark:border-dark-grey"
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
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-xs uppercase tracking-[0.2em] text-white shadow-[0_6px_20px_rgba(37,211,102,0.35)] transition-all duration-250 hover:scale-[1.02] hover:bg-[#1EBE5A]"
          >
            <WhatsAppIcon size={20} className="text-white" />
            Order via WhatsApp
          </a>

          {product.sku && <p className="mt-6 text-xs text-ash-grey">SKU: {product.sku}</p>}

          {product.long_description && (
            <div className="mt-10 border-t border-border-ash pt-6 dark:border-dark-grey">
              <h3 className="mb-2 text-xs uppercase tracking-widest text-ash-grey">Details</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-luxury-black dark:text-pure-white">
                {product.long_description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REVIEWS */}
      <div className="mt-20 border-t border-border-ash pt-12 dark:border-dark-grey">
        <h2 className="font-display text-2xl tracking-wide text-luxury-black dark:text-pure-white">Customer Reviews</h2>

        <div className="mt-6 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-sm text-ash-grey">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border-ash p-5 transition-theme dark:border-dark-grey">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-luxury-black dark:text-pure-white">
                    {review.reviewer_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-ash-grey">{timeAgo(review.created_at)}</span>
                </div>
                <div className="mt-1 text-sm text-luxury-black dark:text-pure-white">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                <p className="mt-2 text-sm text-ash-grey">{review.comment}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submitReview} className="mt-10 max-w-lg space-y-4 rounded-2xl border border-border-ash p-6 transition-theme dark:border-dark-grey">
          <h3 className="text-sm uppercase tracking-widest text-luxury-black dark:text-pure-white">Write a Review</h3>
          <input
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white"
          />
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setReviewRating(star)} className="text-xl">
                {star <= reviewRating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white"
          />
          <button
            type="submit"
            disabled={submittingReview}
            className="rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
