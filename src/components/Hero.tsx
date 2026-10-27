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
    <section className="bg-[#fafafc] px-5 pb-16 pt-28 text-slate-900 sm:px-8 sm:pb-24 sm:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-2xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-slate-500">
            Contemporary art · Katamanso, Accra
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Welcome to The Christy Black Art Gallery
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Discover contemporary masterworks by Christy Black, rooted in Katamanso, Accra. Explore original paintings
            and find a piece that speaks to you.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-7 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-slate-700"
            >
              Explore Collection
            </Link>
            <a
              href={privateViewingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/70 px-7 text-xs font-medium uppercase tracking-[0.18em] text-slate-900 transition-colors hover:border-slate-500 hover:bg-white"
            >
              Private Viewing
            </a>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-xl">
          <div className="aspect-4/3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-4">
            <img
              src="hero.jpg"
              alt="Artwork at The Christy Black Art Gallery"
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
          <figcaption className="mt-3 text-right text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Gallery view · Katamanso, Accra
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
