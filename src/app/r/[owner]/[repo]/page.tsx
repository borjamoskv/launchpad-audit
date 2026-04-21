import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { buildReadmeBadgeMarkdown } from "@/lib/badge";
import { buildLaunchSprint } from "@/lib/launch-sprint";
import {
  buildPublicReportImageUrl,
  getAppOrigin,
  loadPublicRepoReport,
} from "@/lib/public-report";

interface PublicRepoPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

const loadPublicReport = cache(loadPublicRepoReport);

export const revalidate = 1800;

const scoreTone = (score: number): string => {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-sky-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-700";
};

const badgeTone = (score: number): string => {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 60) return "border-sky-200 bg-sky-50 text-sky-800";
  if (score >= 40) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
};

const formatDate = (dateLike: string): string => {
  const parsed = new Date(dateLike);

  if (Number.isNaN(parsed.getTime())) {
    return "No disponible";
  }

  return parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export async function generateMetadata({ params }: PublicRepoPageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  const result = await loadPublicReport(owner, repo);

  if (!result.ok) {
    return {
      title: "Repositorio no disponible | Launchpad Audit",
      description: "No se pudo cargar la auditoría pública de este repositorio.",
    };
  }

  const { report, shareUrl } = result;
  const title = `${report.metrics.fullName}: ${report.score}/${report.maxScore} Launchpad Score`;
  const description = `${report.summary} Stars: ${report.metrics.stars}. Forks: ${report.metrics.forks}.`;
  const imageUrl = buildPublicReportImageUrl(shareUrl);

  return {
    title,
    description,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicRepoPage({ params }: PublicRepoPageProps) {
  const { owner, repo } = await params;
  const result = await loadPublicReport(owner, repo);

  if (!result.ok) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_42%)]" />
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-xl shadow-slate-300/20 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Launchpad Audit</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">No se pudo cargar este repo</h1>
          <p className="mt-3 text-sm text-slate-600">{result.error}</p>
          {result.repoUrl ? (
            <a
              className="mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
              href={result.repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en GitHub
            </a>
          ) : null}
          <Link
            className="ml-3 mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            href="/"
          >
            Auditar otro repo
          </Link>
        </section>
      </main>
    );
  }

  const { report, shareUrl, freshness } = result;
  const progress = Math.round((report.score / report.maxScore) * 100);
  const badgeMarkdown = buildReadmeBadgeMarkdown({
    appOrigin: getAppOrigin(),
    report,
  });
  const launchSprint = buildLaunchSprint(report);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: report.metrics.fullName,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    url: shareUrl,
    codeRepository: report.repoUrl,
    description: report.metrics.description,
    isAccessibleForFree: true,
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-10 sm:px-8 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.22),transparent_42%),radial-gradient(circle_at_82%_8%,rgba(251,146,60,0.23),transparent_38%),radial-gradient(circle_at_50%_78%,rgba(14,165,233,0.16),transparent_45%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
            href="/"
          >
            Launchpad Audit
          </Link>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
              href={report.repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <Link
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              href={`/?repo=${encodeURIComponent(report.repoUrl)}`}
            >
              Auditar
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-300/20 backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Página pública</p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-slate-900 sm:text-5xl">
              {report.metrics.fullName}
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-700">{report.metrics.description}</p>
            <p className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {freshness.label}
            </p>

            <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Discoverability Score
                </p>
                <p className={`mt-1 text-6xl font-black ${scoreTone(report.score)}`}>
                  {report.score}
                  <span className="text-2xl text-slate-500">/{report.maxScore}</span>
                </p>
              </div>
              <p className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${badgeTone(report.score)}`}>
                {report.summary}
              </p>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-orange-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Stars</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{report.metrics.stars.toLocaleString("es-ES")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Forks</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{report.metrics.forks.toLocaleString("es-ES")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Último push</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(report.metrics.pushedAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Lenguaje</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{report.metrics.primaryLanguage ?? "N/D"}</p>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Comparte esta auditoría</h2>
              <p className="mt-2 text-sm text-slate-600">
                Enlace público estable para enseñar el estado del repo sin pegar tokens ni datos privados.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                <code>{shareUrl}</code>
              </pre>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Badge para README</h2>
              <p className="mt-2 text-sm text-slate-600">Pega este Markdown en el README para mostrar score dinámico.</p>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                <code>{badgeMarkdown}</code>
              </pre>
            </article>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">Acciones prioritarias</h2>
            <div className="mt-4 space-y-3">
              {report.actions.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  No hay acciones urgentes. El repo está listo para distribución.
                </p>
              ) : (
                report.actions.slice(0, 4).map((action) => (
                  <div key={action.title} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{action.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{action.impact}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">Checklist visible</h2>
            <div className="mt-4 space-y-3">
              {report.checks.slice(0, 6).map((check) => (
                <div key={check.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{check.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{check.detail}</p>
                  </div>
                  <p className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {check.points}/{check.weight}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/20 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                7-day launch sprint
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold">Plan operativo para subir el score</h2>
            </div>
            <p className="max-w-md text-sm text-slate-300">
              Un ciclo semanal cerrado: corregir gaps, compartir, recoger feedback y volver a medir.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {launchSprint.map((step) => (
              <div key={step.day} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Día {step.day}</p>
                <h3 className="mt-2 text-sm font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-300">{step.description}</p>
                <p className="mt-3 text-xs font-semibold text-orange-200">{step.outcome}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
