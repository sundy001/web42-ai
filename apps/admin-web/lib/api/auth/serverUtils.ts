import { cookies } from "next/headers";

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("web42_access_token")?.value;
}
