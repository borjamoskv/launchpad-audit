import { NextResponse } from "next/server";
import {
  GITHUB_OAUTH_STATE_COOKIE,
  buildAuthRedirect,
  buildGitHubAuthorizeUrl,
  createOAuthState,
  getGitHubOAuthConfig,
  oauthCookieOptions,
} from "@/lib/github-auth";

export async function GET(request: Request) {
  const config = getGitHubOAuthConfig({ requestUrl: request.url });

  if (!config) {
    return NextResponse.redirect(buildAuthRedirect(request.url, "oauth_not_configured"));
  }

  const state = createOAuthState();
  const authorizeUrl = buildGitHubAuthorizeUrl(config, state);
  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    ...oauthCookieOptions,
    httpOnly: true,
    maxAge: 60 * 10,
  });

  return response;
}
