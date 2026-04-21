"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildFeaturedRepoPath, type FeaturedPublicRepo } from "@/lib/public-index";
import {
  ALL_FEATURED_CATEGORIES,
  filterFeaturedRepos,
} from "@/lib/public-index-filter";
import { buildGitHubRepoUrl } from "@/lib/share";

interface ExploreGalleryProps {
  repos: FeaturedPublicRepo[];
  categories: string[];
}

const splitFullName = (fullName: string): { owner: string; repo: string } => {
  const [owner, repo] = fullName.split("/");
  return { owner, repo };
};

export function ExploreGallery({ repos, categories }: ExploreGalleryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_FEATURED_CATEGORIES);

  const filteredRepos = useMemo(() => {
    return filterFeaturedRepos(repos, {
      query,
      category,
    });
  }, [category, query, repos]);

  const resetFilters = () => {
    setQuery("");
    setCategory(ALL_FEATURED_CATEGORIES);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Buscar por repo, stack o señal
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej: python, runtime, sdk, governance..."
              type="search"
              value={query}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
              {filteredRepos.length}/{repos.length} visibles
            </span>
            <button
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
              onClick={resetFilters}
              type="button"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[ALL_FEATURED_CATEGORIES, ...categories].map((nextCategory) => {
            const active = nextCategory === category;

            return (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                }`}
                key={nextCategory}
                onClick={() => setCategory(nextCategory)}
                type="button"
              >
                {nextCategory}
              </button>
            );
          })}
        </div>
      </div>

      {filteredRepos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <p className="font-display text-2xl font-bold text-slate-950">No hay repos para ese filtro</p>
          <p className="mt-2 text-sm text-slate-600">
            Prueba otra categoría o busca por lenguaje, framework, runtime, SDK, governance o docs.
          </p>
          <button
            className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            onClick={resetFilters}
            type="button"
          >
            Ver todo el índice
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRepos.map((repo) => {
            const { owner, repo: repoName } = splitFullName(repo.fullName);
            const auditPath = buildFeaturedRepoPath(repo);
            const githubUrl = buildGitHubRepoUrl({ owner, repo: repoName });

            return (
              <article
                className="group flex min-h-[280px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/60"
                key={repo.fullName}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      {repo.category}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Público
                    </span>
                  </div>

                  <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{repo.fullName}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{repo.description}</p>
                  <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                    {repo.whyAudit}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap gap-2">
                    {repo.tags.map((tag) => (
                      <span
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-700"
                      href={auditPath}
                    >
                      Ver auditoría
                    </Link>
                    <a
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                      href={githubUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
