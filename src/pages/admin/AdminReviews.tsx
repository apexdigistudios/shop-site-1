import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Review } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import { formatCompactNumber, timeAgo } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminReviews() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  // Confirmation state for review status/deletion changes
  const [pendingAction, setPendingAction] = useState<{
    reviewId: string;
    action: "approve" | "delete";
    reviewerName: string;
  } | null>(null);

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

  async function executeAction() {
    if (!pendingAction) return;
    const { reviewId, action } = pendingAction;

    if (action === "approve") {
      const { data, error } = await supabase.from("reviews").update({ approved: true }).eq("id", reviewId).select().maybeSingle();
      if (error) {
        showToast(error.message, "error");
        setPendingAction(null);
        return;
      }
      if (data) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? (data as Review) : r)));
        showToast("Review approved successfully.", "success");
      }
    } else if (action === "delete") {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) {
        showToast(error.message, "error");
        setPendingAction(null);
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("Review deleted successfully.", "success");
    }
    setPendingAction(null);
  }

  return (
    <div className="space-y-6 pb-24">
      <AdminSectionHeader
        emoji="⭐"
        title="Reviews Management"
        subtitle={`${formatCompactNumber(reviews.length)} review${reviews.length !== 1 ? "s" : ""}`}
      />

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
            No reviews submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md"
              >
                {/* Left: Reviewer & Comment Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      {review.reviewer_name || "Anonymous Customer"}
                    </h3>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-600">
                      {productNames[review.product_id] || "Artwork"}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-[11px] text-slate-400">{timeAgo(review.created_at)}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        review.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                  </div>

                  <div className="text-amber-500 text-xs">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {review.comment}
                  </p>
                </div>

                {/* Right: Action Icon Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                  {!review.approved && (
                    <button
                      onClick={() =>
                        setPendingAction({
                          reviewId: review.id,
                          action: "approve",
                          reviewerName: review.reviewer_name || "Anonymous",
                        })
                      }
                      className="flex h-9 px-3 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                      title="Approve Review"
                    >
                      ✓ Approve
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setPendingAction({
                        reviewId: review.id,
                        action: "delete",
                        reviewerName: review.reviewer_name || "Anonymous",
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Review"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Confirm Review {pendingAction.action === "approve" ? "Approval" : "Deletion"}
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to {pendingAction.action} the review submitted by{" "}
              <strong className="text-slate-900">{pendingAction.reviewerName}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                className={`rounded-2xl px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow ${
                  pendingAction.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}