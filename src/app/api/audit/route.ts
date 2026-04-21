import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuditReport } from "@/lib/audit";
import { GITHUB_TOKEN_COOKIE } from "@/lib/github-auth";
import { loadRepoSnapshot, parseGitHubRepoUrl } from "@/lib/github";
import type { AuditRequest } from "@/lib/types";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const normalizeObjective = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Conseguir más stars y feedback cualificado en 30 días";
  }

  return trimmed.slice(0, 180);
};

const normalizeGitHubToken = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.length < 20 || trimmed.length > 255 || /\s/.test(trimmed)) {
    return null;
  }

  return trimmed;
};

const parsePayload = (payload: unknown): AuditRequest | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const repoUrl = typeof payload.repoUrl === "string" ? payload.repoUrl.trim() : "";
  const objective = typeof payload.objective === "string" ? normalizeObjective(payload.objective) : "";
  const githubTokenRaw = typeof payload.githubToken === "string" ? payload.githubToken : "";
  const githubToken = normalizeGitHubToken(githubTokenRaw);

  if (!repoUrl) {
    return null;
  }

  if (githubToken === null) {
    return null;
  }

  return {
    repoUrl,
    objective,
    githubToken: githubToken || undefined,
  };
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsed = parsePayload(body);

  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Debes enviar una URL de repositorio válida. Si incluyes token de GitHub, debe tener formato correcto.",
      },
      { status: 400 },
    );
  }

  const repoIdentifier = parseGitHubRepoUrl(parsed.repoUrl);

  if (!repoIdentifier) {
    return NextResponse.json(
      { error: "Formato de URL no válido. Usa por ejemplo https://github.com/owner/repo" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const oauthToken = cookieStore.get(GITHUB_TOKEN_COOKIE)?.value?.trim();
  const effectiveToken = parsed.githubToken || oauthToken;
  const repoSnapshot = await loadRepoSnapshot(repoIdentifier, effectiveToken);

  if (!repoSnapshot.ok) {
    return NextResponse.json({ error: repoSnapshot.error }, { status: repoSnapshot.status });
  }

  const report = buildAuditReport(repoSnapshot.data, parsed.objective, parsed.repoUrl);

  return NextResponse.json(report);
}
