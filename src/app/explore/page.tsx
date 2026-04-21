import Link from "next/link";
import type { Metadata } from "next";
import { ExploreGallery } from "@/app/explore/explore-gallery";
import { getFeaturedCategories, getFeaturedPublicRepos } from "@/lib/public-index";
import { getAppOrigin } from "@/lib/public-report";

const appOrigin = getAppOrigin();
const featuredRepos = getFeaturedPublicRepos();
const categories = getFeaturedCategories();

export const metadata: Metadata = {
  title: "Explorar auditorías públicas | Launchpad Audit",
  description:
    "Galería indexable de auditorías públicas para repositorios open source populares en frontend, backend, AI, runtime e infraestructura.",
  alternates: {
    canonical: `${appOrigin}/explore`,
  },
  openGraph: {
    title: "Explorar auditorías públicas | Launchpad Audit",
    description:
      "Descubre auditorías públicas de repos open source y compara señales de discoverability, onboarding y distribución.",
    url: `${appOrigin}/explore`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explorar auditorías públicas | Launchpad Audit",
    description:
      "Galería indexable de auditorías públicas para repos open source populares.",
  },
};

export default function ExplorePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-10 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(circle_at_14%_12%,rgba(14,165,233,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.2),transparent_38%),radial-gradient(circle_at_48%_78%,rgba(251,146,60,0.16),transparent_44%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
            href="/"
          >
            Launchpad Audit
          </Link>
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            href="/"
          >
            Auditar mi repo
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white/88 p-6 shadow-xl shadow-slate-300/20 backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Galería pública indexable
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <h1 className="font-display text-4xl leading-tight text-slate-950 sm:text-5xl">
                Explora repos que ya tienen auditoría pública lista para compartir
              </h1>
              <p className="mt-4 max-w-3xl text-base text-slate-700 sm:text-lg">
                Esta galería convierte Launchpad Audit en una superficie de descubrimiento: cada tarjeta enlaza a
                una auditoría pública cacheada y compartible, sin tokens privados.
              </p>
            </div>
            <div className="grid gap-3 rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Índice actual</p>
              <p className="font-display text-5xl font-black">{featuredRepos.length}</p>
              <p className="text-sm text-slate-300">
                repos curados en sitemap, agrupados en {categories.length} categorías.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                key={category}
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        <ExploreGallery categories={categories} repos={featuredRepos} />
      </div>
    </main>
  );
}
