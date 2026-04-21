import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GITHUB_TOKEN_COOKIE } from "@/lib/github-auth";
import { listGitHubRepositories } from "@/lib/github-repositories";

export async function GET() {
  const cookieStore = await cookies();
  const oauthToken = cookieStore.get(GITHUB_TOKEN_COOKIE)?.value?.trim();

  if (!oauthToken) {
    return NextResponse.json(
      { error: "Conecta GitHub para cargar tus repositorios." },
      { status: 401 },
    );
  }

  const result = await listGitHubRepositories(oauthToken);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ repositories: result.data });
}
