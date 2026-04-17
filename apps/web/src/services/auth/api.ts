import type {
  AccountProfile,
  AuthApiError,
  AuthTokensResponse,
  ChangeOwnPasswordInput,
  CurrentUserProfile,
  LoginInput,
  UpdateOwnProfileInput,
} from "./types";

type HttpMethod = "GET" | "POST" | "PATCH";

function getApiBaseUrl(): string {
  const apiUrl = process.env.API_URL ?? "http://localhost:3333";
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
}

function createNetworkError(): AuthApiError {
  return {
    code: "NETWORK_ERROR",
    message: "Nao foi possivel conectar ao servico de autenticacao.",
    statusCode: 502,
  };
}

async function parseApiError(response: Response): Promise<AuthApiError> {
  try {
    const body = (await response.json()) as Partial<AuthApiError>;

    return {
      code:
        typeof body.code === "string"
          ? (body.code as AuthApiError["code"])
          : "HTTP_ERROR",
      message:
        typeof body.message === "string" && body.message.length > 0
          ? body.message
          : "Falha na autenticacao.",
      statusCode: response.status,
    };
  } catch {
    return {
      code: "HTTP_ERROR",
      message: "Falha na autenticacao.",
      statusCode: response.status,
    };
  }
}

async function postJson<TResponse>(
  path: string,
  body: unknown,
  init?: {
    headers?: HeadersInit;
  },
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST" satisfies HttpMethod,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw createNetworkError();
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as TResponse;
}

async function getJson<TResponse>(
  path: string,
  init?: {
    headers?: HeadersInit;
  },
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "GET" satisfies HttpMethod,
      headers: {
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw createNetworkError();
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as TResponse;
}

export async function loginWithApi(input: LoginInput): Promise<AuthTokensResponse> {
  return postJson<AuthTokensResponse>("/auth/login", input);
}

export async function refreshWithApi(refreshToken: string): Promise<AuthTokensResponse> {
  return postJson<AuthTokensResponse>("/auth/refresh", { refreshToken });
}

export async function logoutWithApi(accessToken: string): Promise<void> {
  await postJson<{ success: true }>(
    "/auth/logout",
    {},
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getCurrentUserProfileWithApi(
  accessToken: string,
): Promise<CurrentUserProfile> {
  return getJson<CurrentUserProfile>("/auth/me", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getOwnAccountProfileWithApi(
  accessToken: string,
): Promise<AccountProfile> {
  return getJson<AccountProfile>("/auth/account", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateOwnAccountProfileWithApi(
  accessToken: string,
  input: UpdateOwnProfileInput,
): Promise<AccountProfile> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/auth/account`, {
      method: "PATCH" satisfies HttpMethod,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    throw createNetworkError();
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as AccountProfile;
}

export async function changeOwnPasswordWithApi(
  accessToken: string,
  input: ChangeOwnPasswordInput,
): Promise<{ success: true }> {
  return postJson<{ success: true }>("/auth/account/change-password", input, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}
