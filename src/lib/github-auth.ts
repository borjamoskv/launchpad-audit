import crypto from "node:crypto";

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface ConfigInput {
  requestUrl?: string;
}

export interface GitHubUserProfile {
  login: string;
}

export const GITHUB_OAUTH_STATE_COOKIE = "launchpad_github_oauth_state";
export const GITHUB_TOKEN_COOKIE = "launchpad_github_token";
export const GITHUB_LOGIN_COOKIE = "launchpad_github_login";

const normalizeEnv = (value: string | undefined): string => value?.trim() ?? "";

export const oauthCookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Devuelve configuración OAuth de GitHub cuando está disponible.
 */
export const getGitHubOAuthConfig = (input: ConfigInput = {}): GitHubOAuthConfig | null => {
  const clientId = normalizeEnv(process.env.GITHUB_OAUTH_CLIENT_ID);
  const clientSecret = normalizeEnv(process.env.GITHUB_OAUTH_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return null;
  }

  const explicitRedirect = normalizeEnv(process.env.GITHUB_OAUTH_REDIRECT_URI);
  const redirectUri = explicitRedirect || (input.requestUrl
    ? new URL("/api/auth/github/callback", input.requestUrl).toString()
    : "");

  if (!redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
};

/**
 * Construye URL de autorización para iniciar OAuth de GitHub.
 */
export const buildGitHubAuthorizeUrl = (config: GitHubOAuthConfig, state: string): string => {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "read:user repo");
  url.searchParams.set("state", state);

  return url.toString();
};

export const createOAuthState = (): string => crypto.randomBytes(24).toString("hex");

const buildGitHubApiHeaders = (token: string): HeadersInit => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "launchpad-audit",
  Authorization: `Bearer ${token}`,
});

/**
 * Obtiene perfil básico de usuario con un token OAuth de GitHub.
 */
export const loadGitHubUserProfile = async (token: string): Promise<GitHubUserProfile | null> => {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: buildGitHubApiHeaders(token),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { login?: string };

    if (!payload.login) {
      return null;
    }

    return {
      login: payload.login,
    };
  } catch {
    return null;
  }
};

export const buildAuthRedirect = (requestUrl: string, status: string): URL => {
  const redirectUrl = new URL("/", requestUrl);
  redirectUrl.searchParams.set("auth", status);

  return redirectUrl;
};
