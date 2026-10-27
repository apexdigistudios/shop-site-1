import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { usePaystackSettings } from "../contexts/PaystackSettingsContext";
import { supabase } from "../lib/supabase";
import { paystackAmount } from "../lib/helpers";
import { useToast } from "../contexts/ToastContext";
import EmptyState from "../components/EmptyState";
import { WhatsAppIcon } from "../components/icons";
import type { Order, OrderItem, PaymentMethod } from "../lib/types";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, any>) => { openIframe: () => void };
    };
  }
}

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;
const WHATSAPP_NUMBER = "233548648357";

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

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, appUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(appUser?.display_name || "");
  const [phone, setPhone] = useState(appUser?.phone || "");
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const { enabled: paystackEnabled } = usePaystackSettings();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(paystackEnabled ? "paystack_deposit" : "meetup");
  const [paystackReady, setPaystackReady] = useState(false);

  // If admin disabled Paystack, force selection to meetup.
  useEffect(() => {
    if (!paystackEnabled && paymentMethod === "paystack_deposit") {
      setPaymentMethod("meetup");
    }
  }, [paystackEnabled, paymentMethod]);

  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  const total = Math.max(subtotal - discount, 0);

  // Load Paystack inline script once.
  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackReady(true);
    script.onerror = () => showToast("Could not load Paystack. Try meetup payment.", "error");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [showToast]);

  if (items.length === 0 && !createdOrder) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Your acquisition bag is empty"
          message="Add artworks to your acquisition bag before checking out."
          action={
            <Link
              to="/shop"
              className="mt-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800"
            >
              Shop Now
            </Link>
          }
        />
      </div>
    );
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", couponCode.trim())
      .eq("active", true)
      .maybeSingle();
    setApplyingCoupon(false);
    if (error || !data) {
      showToast("Invalid or inactive coupon code.", "error");
      setDiscount(0);
      return;
    }
    const discountAmount = (subtotal * data.discount) / 100;
    setDiscount(discountAmount);
    showToast(`Coupon applied: ${data.discount}% off!`, "success");
  }

  async function createOrder(method: PaymentMethod, _reference?: string) {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast("Please fill in all delivery details.", "error");
      return null;
    }

    const orderItems: OrderItem[] = items.map((it) => ({
      product_id: it.product_id,
      name: it.product?.title || it.product?.name || "Artwork",
      artist: it.product?.artist || "Christy Black",
      medium: it.product?.medium || null,
      dimensions: it.product?.dimensions || null,
      price: it.product?.price || 0,
      quantity: it.quantity,
      image: it.product?.images?.[0] || null,
    }));

    const totalAmount = Number(total.toFixed(2));
    const depositAmount = method === "paystack_deposit" ? Number((totalAmount * 0.5).toFixed(2)) : 0;
    const remainingBalance = Number((totalAmount - depositAmount).toFixed(2));

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        items: orderItems,
        total: totalAmount,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        remaining_balance: remainingBalance,
        status: method === "paystack_deposit" ? "pending" : "pending_payment",
        payment_method: method,
        payment_status: method === "paystack_deposit" ? "deposit_paid" : "pending_meetup_payment",
        meetup_status: "awaiting_meetup",
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: address.trim(),
      })
      .select()
      .maybeSingle();

    if (error || !data) {
      showToast(error?.message || "Could not place order.", "error");
      return null;
    }

    await clearCart();
    return data;
  }

  function triggerSuccessAndRedirect(order: Order) {
    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const summary = safeItems
      .map((it) => `${it?.quantity ?? 1}x ${it?.name ?? "Item"}`)
      .join(", ");

    const orderId = order?.id ? order.id.slice(0, 8).toUpperCase() : "";

    const whatsappMessage = [
      `*The Christy Black Art Gallery — Acquisition #${orderId}*`,
      ``,
      `*Collector Details:*`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      ``,
      `*Order Details:*`,
      `Items: ${summary}`,
      `Total Amount: ${formatCompactAmount(order?.total_amount ?? order?.total ?? 0)}`,
      `Deposit Paid: ${formatCompactAmount(order?.deposit_amount ?? 0)}`,
      `Remaining Balance: ${formatCompactAmount(order?.remaining_balance ?? 0)}`,
      `Payment Method: ${order?.payment_method === "paystack_deposit" ? "50% Deposit (Paystack)" : "Pay Full on Meetup"}`,
      `Payment Status: ${order?.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Meetup Payment"}`,
      `Meetup Status: ${(order?.meetup_status ?? "awaiting_meetup").replace("_", " ")}`,
      ``,
      `Hello, I have placed an artwork acquisition and would like to arrange delivery.`,
    ].join("\n");

    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    setCreatedOrder(order);
    setRedirectUrl(whatsappLink);

    setTimeout(() => {
      window.location.href = whatsappLink;
    }, 2000);
  }

  async function handlePlaceOrder() {
    if (paymentMethod === "paystack_deposit" && !paystackEnabled) {
      showToast("Paystack payments are currently disabled. Please use Pay on Meetup.", "info");
      setPaymentMethod("meetup");
      return;
    }
    if (paymentMethod === "paystack_deposit") {
      if (!PAYSTACK_KEY || PAYSTACK_KEY.includes("your_paystack")) {
        showToast("Paystack public key is not configured.", "error");
        return;
      }
      if (!paystackReady || !window.PaystackPop) {
        showToast("Paystack is still loading. Please wait.", "info");
        return;
      }
      if (!name.trim() || !phone.trim() || !address.trim()) {
        showToast("Please fill in all delivery details.", "error");
        return;
      }

      const depositAmount = Number((total * 0.5).toFixed(2));
      setPlacingOrder(true);

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY,
        email: user?.email || `${phone.trim()}@placeholder.com`,
        amount: paystackAmount(depositAmount),
        currency: "GHS",
        channels: ["mobile_money", "card"],
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: name.trim() },
            { display_name: "Phone", variable_name: "customer_phone", value: phone.trim() },
            { display_name: "Address", variable_name: "customer_address", value: address.trim() },
          ],
        },
        callback: async (response: { reference: string; status: string }) => {
          if (response.status === "success" || response.reference) {
            const order = await createOrder("paystack_deposit", response.reference);
            if (order) {
              showToast("Deposit successful. Order placed.", "success");
              triggerSuccessAndRedirect(order);
            }
          } else {
            showToast("Payment was not completed.", "error");
          }
          setPlacingOrder(false);
        },
        onClose: () => {
          setPlacingOrder(false);
          showToast("Payment window closed.", "info");
        },
      });

      handler.openIframe();
      return;
    }

    setPlacingOrder(true);
    const order = await createOrder("meetup");
    setPlacingOrder(false);
    if (order) {
      showToast("Order placed. Arrange meetup via WhatsApp.", "success");
      triggerSuccessAndRedirect(order);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 pb-24 space-y-8">
      {/* SUCCESS MODAL OVERLAY */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xl space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
              ✓
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                Order Placed Successfully
              </h2>
              <p className="text-xs text-slate-500">
                Redirecting to WhatsApp in 2 seconds to arrange your meetup handover...
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  #{createdOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Payment Method:</span>
                <span className="font-semibold text-slate-900">
                  {createdOrder.payment_method === "paystack_deposit" ? "50% Deposit (Paystack)" : "Pay Full on Meetup"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Payment Status:</span>
                <span className="font-semibold text-slate-900">
                  {createdOrder.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Meetup Payment"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Remaining Balance:</span>
                <span className="font-semibold text-slate-900">
                  {formatCompactAmount(createdOrder.remaining_balance ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Meetup Status:</span>
                <span className="font-semibold capitalize text-slate-900">
                  {(createdOrder.meetup_status ?? "awaiting_meetup").replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={redirectUrl}
                aria-label="Chat on WhatsApp"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp-green px-6 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#1EBE5A]"
              >
                <WhatsAppIcon size={20} className="text-white" />
                Chat on WhatsApp Now
              </a>
              <p className="text-[11px] text-slate-400 italic">Auto-redirecting in 2 seconds...</p>
            </div>
          </div>
        </div>
      )}

      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-slate-900">
        Checkout
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Acquisition &amp; Delivery Details
            </h2>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +233..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your delivery location or address"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Method</h2>
            <div className={`grid grid-cols-1 gap-3 ${paystackEnabled ? "sm:grid-cols-2" : ""}`}>
              {paystackEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paystack_deposit")}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    paymentMethod === "paystack_deposit"
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-wider">Pay 50% Deposit</span>
                  <span className={`mt-1 block text-[10px] ${paymentMethod === "paystack_deposit" ? "text-slate-300" : "text-slate-500"}`}>
                    Paystack / Mobile Money / Card
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaymentMethod("meetup")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  paymentMethod === "meetup"
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs font-bold uppercase tracking-wider">Pay on Meetup</span>
                <span className={`mt-1 block text-[10px] ${paymentMethod === "meetup" ? "text-slate-300" : "text-slate-500"}`}>
                  100% due at meetup. Arrange handover via WhatsApp.
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Have a Coupon?</h2>
            <div className="flex gap-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={applyingCoupon}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-900 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        <div className="h-fit space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="font-display text-lg font-bold text-slate-900">Order Summary</h2>
          <div className="space-y-2 pt-1">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-xs text-slate-600">
                <span className="truncate pr-3">
                  {it.quantity}x {it.product?.title || it.product?.name}
                </span>
                <span className="shrink-0 font-medium text-slate-900">
                  {formatCompactAmount((it.product?.price || 0) * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCompactAmount(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-{formatCompactAmount(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm sm:text-base font-bold text-slate-900">
              <span>Total</span>
              <span className="font-display">{formatCompactAmount(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="w-full rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {paymentMethod === "paystack_deposit"
              ? placingOrder
                ? "Please wait..."
                : "Pay 50% Deposit"
              : placingOrder
              ? "Placing Order..."
              : "Confirm Acquisition"}
          </button>
        </div>
      </div>
    </div>
  );
}