"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildLaunchKit } from "@/lib/launch-kit";
import type { AuditResponse, PriorityLevel } from "@/lib/types";

const priorityLabel: Record<PriorityLevel, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const numberFormatter = new Intl.NumberFormat("es-ES");

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

const scoreTone = (score: number): string => {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-sky-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-700";
};

interface GitHubAuthStatus {
  configured: boolean;
  connected: boolean;
  username?: string;
}

const oauthFeedback: Record<string, string> = {
  connected: "GitHub conectado correctamente.",
  oauth_not_configured: "OAuth no está configurado en servidor. Usa token manual o configura variables OAuth.",
  oauth_denied: "Conexión con GitHub cancelada.",
  oauth_state_invalid: "No se pudo validar la sesión OAuth. Reintenta la conexión.",
  oauth_exchange_failed: "Falló el intercambio OAuth con GitHub. Reintenta en unos segundos.",
};

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/vercel/next.js");
  const [objective, setObjective] = useState("Conseguir más stars y feedback cualificado en 30 días");
  const [githubToken, setGithubToken] = useState("");
  const [report, setReport] = useState<AuditResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [oauthMessage, setOauthMessage] = useState("");
  const [authStatus, setAuthStatus] = useState<GitHubAuthStatus | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [copiedKitPath, setCopiedKitPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const progress = useMemo(() => {
    if (!report) return 0;

    return Math.round((report.score / report.maxScore) * 100);
  }, [report]);

  const launchKit = useMemo(() => {
    if (!report) return [];

    return buildLaunchKit(report);
  }, [report]);

  const refreshAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/github/status", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthStatus({
          configured: false,
          connected: false,
        });
        return;
      }

      const payload = (await response.json()) as GitHubAuthStatus;
      setAuthStatus(payload);
    } catch {
      setAuthStatus({
        configured: false,
        connected: false,
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const bootstrapAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/github/status", {
          method: "GET",
          cache: "no-store",
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          setAuthStatus({
            configured: false,
            connected: false,
          });
          return;
        }

        const payload = (await response.json()) as GitHubAuthStatus;

        if (!active) {
          return;
        }

        setAuthStatus(payload);
      } catch {
        if (active) {
          setAuthStatus({
            configured: false,
            connected: false,
          });
        }
      } finally {
        if (active) {
          setIsAuthLoading(false);
        }
      }
    };

    void bootstrapAuthStatus();

    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");

    if (authParam && oauthFeedback[authParam]) {
      const message = oauthFeedback[authParam];

      window.setTimeout(() => {
        if (active) {
          setOauthMessage(message);
        }
      }, 0);
    }

    if (authParam) {
      params.delete("auth");
      const normalized = params.toString();
      const cleanPath = `${window.location.pathname}${normalized ? `?${normalized}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", cleanPath);
    }

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = repoUrl.trim();
    const trimmedObjective = objective.trim();
    const trimmedToken = githubToken.trim();

    if (!trimmedUrl) {
      setErrorMessage("Introduce una URL de GitHub.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: trimmedUrl,
          objective: trimmedObjective,
          githubToken: trimmedToken,
        }),
      });

      const payload = (await response.json()) as AuditResponse | { error?: string };

      if (!response.ok) {
        setReport(null);
        setErrorMessage(payload && "error" in payload && payload.error ? payload.error : "No se pudo auditar el repositorio.");
        return;
      }

      setReport(payload as AuditResponse);
    } catch {
      setReport(null);
      setErrorMessage("No se pudo conectar con el servicio de auditoría.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPost = async (channel: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChannel(channel);
      window.setTimeout(() => setCopiedChannel((current) => (current === channel ? null : current)), 1800);
    } catch {
      setErrorMessage("No se pudo copiar al portapapeles.");
    }
  };

  const handleCopyKitFile = async (path: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKitPath(path);
      window.setTimeout(() => setCopiedKitPath((current) => (current === path ? null : current)), 1800);
    } catch {
      setErrorMessage("No se pudo copiar el archivo al portapapeles.");
    }
  };

  const handleDisconnect = async () => {
    setErrorMessage("");
    setIsAuthLoading(true);

    try {
      const response = await fetch("/api/auth/github/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        setErrorMessage("No se pudo desconectar GitHub.");
        return;
      }

      setOauthMessage("GitHub desconectado.");
      await refreshAuthStatus();
    } catch {
      setErrorMessage("No se pudo desconectar GitHub.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-10 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.28),transparent_40%),radial-gradient(circle_at_45%_80%,rgba(14,165,233,0.18),transparent_45%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-4">
          <p className="inline-flex rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
            Launchpad Audit
          </p>
          <h1 className="font-display text-4xl leading-tight text-slate-900 sm:text-5xl">
            Convierte tu repo de GitHub en un producto que gane tracción real
          </h1>
          <p className="max-w-3xl text-base text-slate-700 sm:text-lg">
            Conecta un repositorio público, define objetivo y recibe un score de discoverability con acciones priorizadas y copies listos para distribución.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur sm:p-8">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Conexión GitHub</p>

            {isAuthLoading ? (
              <p className="mt-2 text-sm text-slate-600">Comprobando sesión OAuth...</p>
            ) : authStatus?.connected ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  Conectado como <span className="font-semibold text-slate-900">@{authStatus.username ?? "usuario"}</span>.
                </p>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                >
                  Desconectar
                </button>
              </div>
            ) : authStatus?.configured ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-700">OAuth disponible. Conecta GitHub para no depender de token manual.</p>
                <a
                  href="/api/auth/github/start"
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                >
                  Conectar GitHub
                </a>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-700">
                OAuth no configurado en servidor. Puedes auditar con el campo de token manual.
              </p>
            )}
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Repositorio</span>
              <input
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                autoComplete="off"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Token GitHub (opcional)</span>
              <input
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                placeholder="ghp_xxx / github_pat_xxx"
                autoComplete="off"
                type="password"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Objetivo</span>
              <input
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                placeholder="Ej: 100 stars en 30 días"
                maxLength={180}
              />
            </label>

            <button
              type="submit"
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 md:self-end"
              disabled={isLoading}
            >
              {isLoading ? "Auditando..." : "Auditar"}
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            El token es opcional y se usa solo para esta petición. También puedes configurar `GITHUB_TOKEN` en servidor.
          </p>

          {oauthMessage ? (
            <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
              {oauthMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}
        </section>

        {report ? (
          <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Discoverability Score</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{report.metrics.fullName}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">{report.metrics.description}</p>
                  </div>
                  <div className={`text-right text-4xl font-bold ${scoreTone(report.score)}`}>
                    {report.score}
                    <span className="text-xl text-slate-500">/{report.maxScore}</span>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-orange-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-4 text-sm text-slate-700">{report.summary}</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h3 className="text-lg font-bold text-slate-900">Métricas de tracción</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Stars</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{numberFormatter.format(report.metrics.stars)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Forks</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{numberFormatter.format(report.metrics.forks)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Watchers</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{numberFormatter.format(report.metrics.watchers)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Open Issues</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{numberFormatter.format(report.metrics.openIssues)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Último push</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(report.metrics.pushedAt)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Lenguaje</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{report.metrics.primaryLanguage ?? "N/D"}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h3 className="text-lg font-bold text-slate-900">Checklist de auditoría</h3>
                <div className="mt-4 space-y-3">
                  {report.checks.map((check) => (
                    <div key={check.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{check.label}</p>
                        <p
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            check.passed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {check.points}/{check.weight}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{check.detail}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Acciones prioritarias</h3>
                <div className="mt-4 space-y-3">
                  {report.actions.length === 0 ? (
                    <p className="text-sm text-slate-600">No hay acciones urgentes. Puedes enfocarte en distribución.</p>
                  ) : (
                    report.actions.map((action, index) => (
                      <div key={`${action.title}-${index}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{action.title}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              action.priority === "high"
                                ? "bg-rose-100 text-rose-700"
                                : action.priority === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {priorityLabel[action.priority]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{action.impact}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Plan de distribución</h3>
                <div className="mt-4 space-y-3">
                  {report.distributionPlan.map((post) => (
                    <div key={post.channel} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{post.channel}</p>
                        <button
                          type="button"
                          className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                          onClick={() =>
                            handleCopyPost(
                              post.channel,
                              `${post.hook}\n\n${post.copy}\n\nCTA: ${post.cta}\nCuándo: ${post.recommendedWhen}`,
                            )
                          }
                        >
                          {copiedChannel === post.channel ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{post.hook}</p>
                      <p className="mt-2 text-sm text-slate-600">{post.copy}</p>
                      <p className="mt-2 text-sm font-medium text-slate-700">CTA: {post.cta}</p>
                      <p className="mt-2 text-xs text-slate-500">Cuándo: {post.recommendedWhen}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Launch kit</h3>
                <div className="mt-4 space-y-3">
                  {launchKit.map((file) => (
                    <div key={file.path} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">{file.path}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{file.title}</p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                          onClick={() => handleCopyKitFile(file.path, file.content)}
                        >
                          {copiedKitPath === file.path ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{file.description}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
