import { useAuth } from "@clerk/clerk-expo";

export async function authedFetch(
  url: string,
  options: RequestInit,
  getToken: () => Promise<string | null>
) {
  const token = await getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}