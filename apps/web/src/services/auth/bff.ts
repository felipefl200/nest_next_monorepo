import { requireSession } from "./session";
import { getOwnAccountProfileWithApi } from "./api";
import type { AccountProfile } from "./types";

async function getAccessToken(): Promise<string> {
  const session = await requireSession();

  if (session.accessToken === null) {
    throw new Error("Missing access token");
  }

  return session.accessToken;
}

export async function getOwnAccountProfile(): Promise<AccountProfile> {
  return getOwnAccountProfileWithApi(await getAccessToken());
}
