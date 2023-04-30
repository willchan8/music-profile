const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN!;
const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
const REDIRECT_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000/spotify" : "https://nextjs-spotify-two.vercel.app/spotify";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const generateCodeVerifier = (length: number) => {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const buffer = new Uint8Array(digest);
  const base64Url = btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64Url;
};

export const redirectToAuthCodeFlow = async (clientId: string) => {
  const codeVerifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem("code_verifier", codeVerifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", REDIRECT_URL);
  params.append("scope", "user-read-private user-read-email user-top-read");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getAccessToken = async (clientId: string, authCode: string) => {
  const codeVerifier = localStorage.getItem("code_verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", authCode);
  params.append("redirect_uri", REDIRECT_URL);
  params.append("code_verifier", codeVerifier!);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  return await response.json();
};

export const getAccessTokenWithRefresh = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", REFRESH_TOKEN);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  return await response.json();
};

export const fetchTopTracks = async (access_token: string, range: string = "medium_term"): Promise<any> => {
  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${range}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return await response.json();
};

export const fetchTopArtists = async (access_token: string, range: string = "medium_term"): Promise<any> => {
  const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${range}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return await response.json();
};

export const fetchProfile = async (access_token: string): Promise<any> => {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return await response.json();
};

export const setWithExpiry = (key: string, value: any, ttl: number) => {
  const now = new Date();

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value: value,
    expiry: now.getTime() + ttl * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key);
  // if the item doesn't exist, return null
  if (!itemStr) {
    console.log("Item doesn't exist, return null");
    return null;
  }
  const item = JSON.parse(itemStr);
  const now = new Date();
  // compare the expiry time of the item with the current time
  if (now.getTime() > item.expiry) {
    // If the item is expired, delete the item from storage
    // and return null
    localStorage.removeItem(key);
    console.log("Item is expired, delete the item from storage");
    return null;
  }
  return item.value;
};
