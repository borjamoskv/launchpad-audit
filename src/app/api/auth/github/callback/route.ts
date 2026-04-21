import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GITHUB_LOGIN_COOKIE,
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_TOKEN_COOKIE,
  buildAuthRedirect,
  getGitHubOAuthConfig,
  loadGitHubUserProfile,
  oauthCookieOptions,
} from "@/lib/github-auth";

interface AccessTokenPayload {
  access_token?: string;
  error?: string;
  error_description?: string;
}

const clearStateCookie = (response: NextResponse): void => {
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", {
    ...oauthCookieOptions,
    httpOnly: true,
    maxAge: 0,
  });
};

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

const buildFailureResponse = (requestUrl: string, status: string, clearAuth = false): NextResponse => {
  const response = NextResponse.redirect(buildAuthRedirect(requestUrl, status));
  clearStateCookie(response);

  if (clearAuth) {
    clearAuthCookies(response);
  }

  return response;
};

const exchangeCodeForToken = async (
  code: string,
  state: string,
  requestUrl: string,
): Promise<string | null> => {
  const config = getGitHubOAuthConfig({ requestUrl });

  if (!config) {
    return null;
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "launchpad-audit",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        state,
        redirect_uri: config.redirectUri,
      }),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as AccessTokenPayload;

    if (!payload.access_token || payload.error) {
      return null;
    }

    return payload.access_token.trim() || null;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const config = getGitHubOAuthConfig({ requestUrl: request.url });

  if (!config) {
    return buildFailureResponse(request.url, "oauth_not_configured");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value?.trim() ?? "";

  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const denied = url.searchParams.get("error");

  if (denied) {
    return buildFailureResponse(request.url, "oauth_denied");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return buildFailureResponse(request.url, "oauth_state_invalid");
  }

  const token = await exchangeCodeForToken(code, state, request.url);

  if (!token) {
    return buildFailureResponse(request.url, "oauth_exchange_failed", true);
  }

  const profile = await loadGitHubUserProfile(token);
  const response = NextResponse.redirect(buildAuthRedirect(request.url, "connected"));

  clearStateCookie(response);
  response.cookies.set(GITHUB_TOKEN_COOKIE, token, {
    ...oauthCookieOptions,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });

  if (profile?.login) {
    response.cookies.set(GITHUB_LOGIN_COOKIE, profile.login, {
      ...oauthCookieOptions,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    response.cookies.set(GITHUB_LOGIN_COOKIE, "", {
      ...oauthCookieOptions,
      httpOnly: true,
      maxAge: 0,
    });
  }

  return response;
}
