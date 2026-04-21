import { afterEach, describe, expect, it } from "vitest";
import {
  buildGitHubAuthorizeUrl,
  createOAuthState,
  getGitHubOAuthConfig,
} from "@/lib/github-auth";

const ENV_KEYS = [
  "GITHUB_OAUTH_CLIENT_ID",
  "GITHUB_OAUTH_CLIENT_SECRET",
  "GITHUB_OAUTH_REDIRECT_URI",
] as const;

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };

  for (const key of ENV_KEYS) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
});

describe("getGitHubOAuthConfig", () => {
  it("devuelve null cuando falta configuración requerida", () => {
    delete process.env.GITHUB_OAUTH_CLIENT_ID;
    delete process.env.GITHUB_OAUTH_CLIENT_SECRET;

    expect(getGitHubOAuthConfig()).toBeNull();
  });

  it("usa redirect URI explícita desde entorno", () => {
    process.env.GITHUB_OAUTH_CLIENT_ID = "client-id";
    process.env.GITHUB_OAUTH_CLIENT_SECRET = "secret";
    process.env.GITHUB_OAUTH_REDIRECT_URI = "https://example.com/oauth/callback";

    expect(getGitHubOAuthConfig()).toEqual({
      clientId: "client-id",
      clientSecret: "secret",
      redirectUri: "https://example.com/oauth/callback",
    });
  });

  it("construye redirect URI desde request cuando no hay env explícita", () => {
    process.env.GITHUB_OAUTH_CLIENT_ID = "client-id";
    process.env.GITHUB_OAUTH_CLIENT_SECRET = "secret";
    delete process.env.GITHUB_OAUTH_REDIRECT_URI;

    const result = getGitHubOAuthConfig({ requestUrl: "https://app.example.com/dashboard" });

    expect(result).toEqual({
      clientId: "client-id",
      clientSecret: "secret",
      redirectUri: "https://app.example.com/api/auth/github/callback",
    });
  });
});

describe("buildGitHubAuthorizeUrl", () => {
  it("incluye state y alcance esperado", () => {
    const state = createOAuthState();
    const url = buildGitHubAuthorizeUrl(
      {
        clientId: "abc123",
        clientSecret: "secret",
        redirectUri: "https://app.example.com/api/auth/github/callback",
      },
      state,
    );

    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("abc123");
    expect(parsed.searchParams.get("state")).toBe(state);
    expect(parsed.searchParams.get("scope")).toBe("read:user repo");
  });
});
