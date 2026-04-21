import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GITHUB_LOGIN_COOKIE,
  GITHUB_TOKEN_COOKIE,
  getGitHubOAuthConfig,
  loadGitHubUserProfile,
  oauthCookieOptions,
} from "@/lib/github-auth";

const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.set(GITHUB_TOKEN_COOKIE, "", {
    ...oauthCookieOptions,
    httpOnly: true,
    maxAge: 0,
  });

  response.cookies.set(GITHUB_LOGIN_COOKIE, "", {
    ...oauthCookieOptions,
    httpOnly: true,
    maxAge: 0,
  });
};

export async function GET(request: Request) {
  const config = getGitHubOAuthConfig({ requestUrl: request.url });
  const configured = Boolean(config);

  const cookieStore = await cookies();
  const token = cookieStore.get(GITHUB_TOKEN_COOKIE)?.value?.trim() ?? "";

  if (!token) {
    return NextResponse.json({ configured, connected: false });
  }

  const cachedLogin = cookieStore.get(GITHUB_LOGIN_COOKIE)?.value?.trim() ?? "";
  const profile = await loadGitHubUserProfile(token);

  if (!profile) {
    const response = NextResponse.json({ configured, connected: false });
    clearAuthCookies(response);

    return response;
  }

  const response = NextResponse.json({
    configured,
    connected: true,
    username: profile.login,
  });

  if (profile.login !== cachedLogin) {
    response.cookies.set(GITHUB_LOGIN_COOKIE, profile.login, {
      ...oauthCookieOptions,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
