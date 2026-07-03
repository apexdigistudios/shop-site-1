export function formatPrice(value: number | null | undefined): string {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(n);
}

export function paystackAmount(total: number): number {
  // Paystack expects the amount in the smallest currency unit (pesewas for GHS).
  return Math.max(0, Math.round(total * 100));
}

export function firstImage(images: string[] | null | undefined): string | null {
  if (!images || images.length === 0) return null;
  const url = images[0];
  return url && url.trim().length > 0 ? url : null;
}

export function safeImages(images: string[] | null | undefined): string[] {
  if (!images) return [];
  return images.filter((url) => Boolean(url && url.trim().length > 0));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export const WHATSAPP_NUMBER = "233548648357";

export function buildWhatsappOrderLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
