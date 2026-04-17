import type { ApiError } from "./types";

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  accessToken: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
};

function getApiBaseUrl(): string {
  const apiUrl = process.env.API_URL ?? "http://localhost:3333";
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
}

function createNetworkError(): ApiError {
  return {
    code: "NETWORK_ERROR",
    message: "Nao foi possivel conectar ao servico da API.",
    statusCode: 502,
  };
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  if (query === undefined) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiError>;

    return {
      code: typeof body.code === "string" ? body.code : "HTTP_ERROR",
      message:
        typeof body.message === "string" && body.message.length > 0
          ? body.message
          : "Falha ao processar a requisicao.",
      statusCode: response.status,
    };
  } catch {
    return {
      code: "HTTP_ERROR",
      message: "Falha ao processar a requisicao.",
      statusCode: response.status,
    };
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as Record<string, unknown>).code === "string" &&
    typeof (error as Record<string, unknown>).message === "string" &&
    typeof (error as Record<string, unknown>).statusCode === "number"
  );
}

export async function requestJson<TResponse>({
  method,
  path,
  accessToken,
  body,
  query,
}: RequestOptions): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw createNetworkError();
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function deleteRequest(
  path: string,
  accessToken: string,
): Promise<void> {
  await requestJson<void>({
    method: "DELETE",
    path,
    accessToken,
  });
}
