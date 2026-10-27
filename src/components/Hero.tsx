import { Link } from "react-router-dom";
import { buildWhatsappOrderLink } from "../lib/helpers";

interface HeroProps {
  imageSrc?: string;
}

export default function Hero({ }: HeroProps) {
  const privateViewingLink = buildWhatsappOrderLink(
    "Hello, I would like to arrange a private viewing at The Christy Black Art Gallery."
  );

  return (
    <section className="relative bg-slate-900 px-5 py-32 text-white sm:px-8 sm:py-40">
      {/* Background Image with Minimal Overlay for Maximum Clarity */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero.jpg"
          alt="The Christy Black Art Gallery"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-slate-200">
          Contemporary art
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
          Welcome to The Christy Black Art Gallery
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg drop-shadow">
          Discover contemporary masterworks by Christy Black. Explore original paintings
          and find a piece that speaks to you.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            to="/shop"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-xs font-medium uppercase tracking-[0.18em] text-slate-900 transition-colors hover:bg-slate-100 shadow-lg"
          >
            Shop Now
          </Link>
          <a
            href={privateViewingLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/60 bg-black/20 px-8 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur-md transition-colors hover:bg-black/40 hover:border-white shadow-lg"
          >
            Private Viewing
          </a>
        </div>
      </div>
    </section>
  );
}