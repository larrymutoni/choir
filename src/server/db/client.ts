function getDbProxyConfig() {
  const url = process.env.DB_PROXY_URL;
  const secret = process.env.DB_PROXY_SECRET;

  if (!url || !secret) {
    throw new Error("Missing DB proxy configuration.");
  }

  return { url, secret };
}

export async function dbRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { url, secret } = getDbProxyConfig();

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Database request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
