import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Review } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { timeAgo } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminReviews() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    const list = (data as Review[]) || [];
    setReviews(list);

    const productIds = Array.from(new Set(list.map((r) => r.product_id)));
    if (productIds.length > 0) {
      const { data: products } = await supabase.from("products").select("id, name").in("id", productIds);
      const map: Record<string, string> = {};
      (products || []).forEach((p: any) => {
        map[p.id] = p.name;
      });
      setProductNames(map);
    }
    setLoading(false);
  }

  async function approveReview(id: string) {
    const { data, error } = await supabase.from("reviews").update({ approved: true }).eq("id", id).select().maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (data) {
      setReviews((prev) => prev.map((r) => (r.id === id ? (data as Review) : r)));
      showToast("Review approved.", "success");
    }
  }

  async function deleteReview(id: string) {
    if (!window.confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast("Review deleted.", "success");
  }

  return (
    <div>
      <AdminSectionHeader emoji="⭐" title="Reviews" subtitle={`${reviews.length} review${reviews.length !== 1 ? "s" : ""}`} />

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-ash-grey">No reviews submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border-ash bg-pure-white p-5 transition-theme dark:border-dark-grey dark:bg-dark-grey">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{review.reviewer_name || "Anonymous"}</p>
                    <p className="text-xs text-ash-grey">
                      {productNames[review.product_id] || "Product"} • {timeAgo(review.created_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
                      review.approved ? "bg-whatsapp-green/15 text-whatsapp-green" : "bg-alert-red/15 text-alert-red"
                    }`}
                  >
                    {review.approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <p className="mt-2 text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                <p className="mt-1 text-sm text-ash-grey">{review.comment}</p>
                <div className="mt-3 flex gap-3">
                  {!review.approved && (
                    <button onClick={() => approveReview(review.id)} className="text-xs uppercase tracking-widest text-whatsapp-green underline">
                      Approve
                    </button>
                  )}
                  <button onClick={() => deleteReview(review.id)} className="text-xs uppercase tracking-widest text-alert-red underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
