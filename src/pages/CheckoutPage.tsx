import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { usePaystackSettings } from "../contexts/PaystackSettingsContext";
import { supabase } from "../lib/supabase";
import { formatPrice, paystackAmount } from "../lib/helpers";
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
      <div className="mx-auto max-w-3xl px-5 py-24">
        <EmptyState
          title="Your bag is empty"
          message="Add products to your bag before checking out."
          action={
            <Link to="/shop" className="mt-2 rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white dark:bg-pure-white dark:text-luxury-black">
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
      name: it.product?.name || "Product",
      price: it.product?.price || 0,
      quantity: it.quantity,
      size: it.size,
      color: it.color,
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
    console.log("ORDER RETURNED:", order);

    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const summary = safeItems
      .map((it) => `${it?.quantity ?? 1}x ${it?.name ?? "Item"}`)
      .join(", ");

    const orderId = order?.id ? order.id.slice(0, 8).toUpperCase() : "";

    const whatsappMessage = [
      `*ADOB'S IMPORTS HUB — Order #${orderId}*`,
      ``,
      `*Customer Details:*`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      ``,
      `*Order Details:*`,
      `Items: ${summary}`,
      `Total Amount: ${formatPrice(order?.total_amount ?? order?.total ?? 0)}`,
      `Deposit Paid: ${formatPrice(order?.deposit_amount ?? 0)}`,
      `Remaining Balance: ${formatPrice(order?.remaining_balance ?? 0)}`,
      `Payment Method: ${order?.payment_method === "paystack_deposit" ? "50% Deposit (Paystack)" : "Pay Full on Meetup"}`,
      `Payment Status: ${order?.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Meetup Payment"}`,
      `Meetup Status: ${(order?.meetup_status ?? "awaiting_meetup").replace("_", " ")}`,
      ``,
      `Hello, I have placed an order and would like to arrange a meetup for product handover.`,
    ].join("\n");

    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    setCreatedOrder(order);
    setRedirectUrl(whatsappLink);

    setTimeout(() => {
      window.location.href = whatsappLink;
    }, 2000);
  }

  async function handlePlaceOrder() {
    // Safety: never process Paystack when admin has disabled it.
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

    // Pay on Meetup
    setPlacingOrder(true);
    const order = await createOrder("meetup");
    setPlacingOrder(false);
    if (order) {
      showToast("Order placed. Arrange meetup via WhatsApp.", "success");
      triggerSuccessAndRedirect(order);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
      {/* SUCCESS MODAL OVERLAY */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-black/80 p-5 backdrop-blur-md">
          <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border-ash bg-pure-white p-8 text-center transition-theme dark:border-dark-grey dark:bg-luxury-black">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp-green/15 text-3xl text-whatsapp-green">
              ✓
            </div>
            <h2 className="font-display text-2xl tracking-wide text-luxury-black dark:text-pure-white">
              Order Placed Successfully
            </h2>
            <p className="mt-1.5 text-xs text-ash-grey">
              Redirecting to WhatsApp in 2 seconds to arrange your meetup handover...
            </p>

            <div className="mt-6 space-y-2.5 rounded-xl border border-border-ash bg-beige-cream/60 p-4 text-left text-xs transition-theme dark:border-dark-grey dark:bg-dark-grey/60">
              <div className="flex justify-between">
                <span className="text-ash-grey">Order ID:</span>
                <span className="font-medium text-luxury-black dark:text-pure-white">
                  #{createdOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ash-grey">Payment Method:</span>
                <span className="font-medium text-luxury-black dark:text-pure-white">
                  {createdOrder.payment_method === "paystack_deposit" ? "50% Deposit (Paystack)" : "Pay Full on Meetup"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ash-grey">Payment Status:</span>
                <span className="font-medium text-luxury-black dark:text-pure-white">
                  {createdOrder.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Meetup Payment"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ash-grey">Remaining Balance:</span>
                <span className="font-medium text-luxury-black dark:text-pure-white">
                  {formatPrice(createdOrder.remaining_balance ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ash-grey">Meetup Status:</span>
                <span className="font-medium capitalize text-luxury-black dark:text-pure-white">
                  {(createdOrder.meetup_status ?? "awaiting_meetup").replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={redirectUrl}
                aria-label="Chat on WhatsApp"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-xs uppercase tracking-widest text-white shadow-[0_6px_20px_rgba(37,211,102,0.35)] transition-all duration-250 hover:scale-[1.03] hover:bg-[#1EBE5A]"
              >
                <WhatsAppIcon size={20} className="text-white" />
                Chat on WhatsApp Now
              </a>
              <p className="mt-3 text-[11px] text-muted-grey dark:text-dark-muted">Auto-redirecting in 2 seconds...</p>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-10 font-display text-4xl tracking-wide text-luxury-black dark:text-pure-white">Checkout</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xs uppercase tracking-widest text-muted-grey dark:text-dark-muted">Delivery Details</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-soft-grey/60 bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full rounded-lg border border-soft-grey/60 bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
          />
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Delivery address"
            rows={4}
            className="w-full rounded-lg border border-soft-grey/60 bg-transparent px-4 py-3 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
          />

          <div className="pt-4">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-muted-grey dark:text-dark-muted">Payment Method</h2>
            <div className={`grid grid-cols-1 gap-3 ${paystackEnabled ? "sm:grid-cols-2" : ""}`}>
              {paystackEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paystack_deposit")}
                  className={`rounded-2xl border p-4 text-left transition-theme ${
                    paymentMethod === "paystack_deposit"
                      ? "border-luxury-black bg-luxury-black text-pure-white dark:border-pure-white dark:bg-pure-white dark:text-luxury-black"
                      : "border-soft-grey/60 dark:border-dark-border"
                  }`}
                >
                  <span className="block text-sm font-medium">Pay 50% Deposit</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-widest opacity-80">
                    Paystack / Mobile Money / Card
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaymentMethod("meetup")}
                className={`rounded-2xl border p-4 text-left transition-theme ${
                  paymentMethod === "meetup"
                    ? "border-luxury-black bg-luxury-black text-pure-white dark:border-pure-white dark:bg-pure-white dark:text-luxury-black"
                    : "border-soft-grey/60 dark:border-dark-border"
                }`}
              >
                <span className="block text-sm font-medium">Pay on Meetup</span>
                <span className="mt-1 block text-[11px] uppercase tracking-widest opacity-80">
                  100% due at meetup. Arrange handover via WhatsApp.
                </span>
              </button>
            </div>
          </div>

          <div className="pt-6">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-ash-grey">Have a Coupon?</h2>
            <div className="flex gap-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 rounded-lg border border-soft-grey/60 bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-muted-grey dark:border-dark-border dark:text-dark-text"
              />
              <button
                onClick={applyCoupon}
                disabled={applyingCoupon}
                className="rounded-full border border-luxury-black px-5 py-2.5 text-xs uppercase tracking-widest text-luxury-black disabled:opacity-50 dark:border-pure-white dark:text-pure-white"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        <div className="h-fit space-y-3 rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-theme dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
          <h2 className="font-display text-xl tracking-wide text-luxury-black dark:text-dark-text">Order Summary</h2>
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm text-muted-grey dark:text-dark-muted">
              <span className="truncate pr-3">
                {it.quantity}x {it.product?.name}
              </span>
              <span>{formatPrice((it.product?.price || 0) * it.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-soft-grey/40 pt-3 text-sm text-muted-grey dark:border-dark-border dark:text-dark-muted">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-whatsapp-green">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-soft-grey/40 pt-3 text-base text-luxury-black dark:border-dark-border dark:text-dark-text">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-luxury-black px-6 text-xs uppercase tracking-[0.2em] text-pure-white transition-all duration-250 hover:scale-[1.02] disabled:opacity-50 dark:bg-dark-accent dark:text-luxury-black"
          >
            {paymentMethod === "paystack_deposit"
              ? placingOrder
                ? "Please wait..."
                : "Pay 50% Deposit"
              : placingOrder
              ? "Placing Order..."
              : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
