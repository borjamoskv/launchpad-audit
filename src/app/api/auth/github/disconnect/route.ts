import { NextResponse } from "next/server";
import {
  GITHUB_LOGIN_COOKIE,
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_TOKEN_COOKIE,
  oauthCookieOptions,
} from "@/lib/github-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });

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

  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", {
    ...oauthCookieOptions,
    httpOnly: true,
    maxAge: 0,
  });

  return response;
}
