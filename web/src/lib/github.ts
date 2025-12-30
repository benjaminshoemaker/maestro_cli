type GitHubAccessTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  id: string | number;
  login: string;
};

type GitHubEmailResponse = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private" | null;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function exchangeGitHubCodeForAccessToken(params: {
  code: string;
  state: string;
  redirectUri: string;
}) {
  const clientId = getRequiredEnv("GITHUB_CLIENT_ID");
  const clientSecret = getRequiredEnv("GITHUB_CLIENT_SECRET");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
      state: params.state,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}`);
  }

  const body = (await response.json()) as GitHubAccessTokenResponse;
  if (!body.access_token) {
    throw new Error(body.error_description ?? body.error ?? "GitHub token exchange failed");
  }

  return body.access_token;
}

export async function fetchGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user fetch failed with status ${response.status}`);
  }

  const body = (await response.json()) as GitHubUserResponse;
  return {
    githubId: String(body.id),
    githubUsername: body.login,
  };
}

export async function fetchGitHubPrimaryEmail(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub emails fetch failed with status ${response.status}`);
  }

  const emails = (await response.json()) as GitHubEmailResponse[];
  const primary = emails.find((email) => email.primary && email.verified);
  return primary?.email ?? null;
}

