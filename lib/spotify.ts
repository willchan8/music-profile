export const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
export const REDIRECT_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3000/profile"
    : "https://nextjs-spotify-two.vercel.app/profile";
export const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export const generateCodeVerifier = (length: number) => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const buffer = new Uint8Array(digest);
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const redirectToAuthCodeFlow = async (clientId: string) => {
  const codeVerifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem("code_verifier", codeVerifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT_URL,
    scope: "user-read-private user-read-email user-top-read user-read-recently-played",
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
};

export const getAccessToken = async (clientId: string, code: string) => {
  const codeVerifier = sessionStorage.getItem("code_verifier");

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URL,
    code_verifier: codeVerifier!,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? "Token request failed");
  }

  sessionStorage.removeItem("code_verifier");
  return data;
};

export const refreshAccessToken = async (clientId: string, refreshToken: string) => {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? "Token refresh failed");
  }
  return data;
};

async function apiFetch(url: string, accessToken: string, retries = 3): Promise<any> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 429 && retries > 0) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "1", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return apiFetch(url, accessToken, retries - 1);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Request failed: ${response.status}`);
  }
  return data;
}

export const fetchTopTracks = (accessToken: string, range = "medium_term") =>
  apiFetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${range}`, accessToken);

export const fetchTopArtists = (accessToken: string, range = "medium_term") =>
  apiFetch(`https://api.spotify.com/v1/me/top/artists?time_range=${range}`, accessToken);

export const fetchProfile = (accessToken: string) =>
  apiFetch("https://api.spotify.com/v1/me", accessToken);

export const fetchRecentlyPlayed = (accessToken: string, limit = 20) =>
  apiFetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, accessToken);

export const setWithExpiry = (key: string, value: any, ttl: number) => {
  const item = {
    value,
    expiry: Date.now() + ttl * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  const item = JSON.parse(itemStr);
  if (Date.now() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
};
