import { act, render, screen, waitFor } from "@testing-library/react";
import { redirectToAuthCodeFlow, getAccessToken, generateCodeVerifier, generateCodeChallenge, fetchTopTracks, fetchTopArtists, fetchProfile, setWithExpiry, getWithExpiry } from "../lib/spotify";

import { TextEncoder, TextDecoder } from "util";
Object.assign(global, { TextDecoder, TextEncoder });

import crypto, { createHash } from "crypto";
Object.defineProperty(global.self, "crypto", {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
    subtle: {
      digest: (algorithm, data) => {
        return new Promise((resolve, reject) => resolve(createHash(algorithm.toLowerCase().replace("-", "")).update(data).digest()));
      },
    },
  },
});

describe("Spotify authorization and access token", () => {
  beforeAll(() => {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key],
        setItem: (key, value) => (store[key] = value.toString()),
        removeItem: (key) => { delete store[key]; },
        clear: () => (store = {}),
      };
    })();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    Object.defineProperty(window, "location", {
      value: { assign: jest.fn() },
      writable: true,
    });

    jest.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign.mockClear();
  });

  it("should generate a code verifier", () => {
    const codeVerifierRegex = /^[A-Za-z0-9_-]{128}$/;
    const codeVerifier = generateCodeVerifier(128);
    expect(codeVerifier).toMatch(codeVerifierRegex);
  });

  it("should generate a code challenge", async () => {
    const codeChallengeRegex = /^[A-Za-z0-9_-]{43}$/;
    const codeVerifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(codeVerifier);
    expect(challenge).toMatch(codeChallengeRegex);
  });

  it("should redirect to Spotify authorization page with correct parameters", async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    await redirectToAuthCodeFlow(clientId);

    expect(sessionStorage.getItem("code_verifier")).toBeTruthy();

    const assignedUrl = window.location.assign.mock.calls[0][0];
    const url = new URL(assignedUrl);
    expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize");
    expect(url.searchParams.get("client_id")).toBe(clientId);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("user-read-private user-read-email user-top-read");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
  });

  it("should get an access token from Spotify", async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const authCode = "test_auth_code";
    sessionStorage.setItem("code_verifier", "test_code_verifier");
    const responseJson = { access_token: "test_access_token", expires_in: 3600 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseJson),
    });
    const accessToken = await getAccessToken(clientId, authCode);
    expect(fetch).toHaveBeenCalledWith("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code: authCode,
        redirect_uri: "https://nextjs-spotify-two.vercel.app/profile",
        code_verifier: "test_code_verifier",
      }),
    });
    expect(accessToken).toEqual(responseJson);
  });
});

describe("setWithExpiry and getWithExpiry", () => {
  beforeAll(() => {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key],
        setItem: (key, value) => (store[key] = value.toString()),
        removeItem: (key) => { delete store[key]; },
        clear: () => (store = {}),
      };
    })();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should store an item with expiry and retrieve it", () => {
    const key = "test_key";
    const value = "test_value";
    const ttl = 60;
    setWithExpiry(key, value, ttl);

    const retrievedValue = getWithExpiry(key);

    expect(retrievedValue).toEqual(value);
  });

  it("should return null when getting an expired item", () => {
    const key = "test_key";
    const value = "test_value";
    const ttl = 1;
    setWithExpiry(key, value, ttl);

    return new Promise((resolve) => {
      setTimeout(() => {
        const retrievedValue = getWithExpiry(key);
        expect(retrievedValue).toBeNull();
        resolve();
      }, (ttl + 1) * 1000);
    });
  });

  it("should return null when getting a non-existing item", () => {
    const key = "non_existing_key";
    const retrievedValue = getWithExpiry(key);
    expect(retrievedValue).toBeNull();
  });
});

describe("fetchTopTracks", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call fetch with the correct URL and headers", async () => {
    const access_token = "test_access_token";
    const range = "short_term";
    const expectedUrl = `https://api.spotify.com/v1/me/top/tracks?time_range=${range}`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ items: [] }),
    });

    await fetchTopTracks(access_token, range);

    expect(fetch).toHaveBeenCalledWith(expectedUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  });

  it("should return the top tracks data from Spotify API", async () => {
    const access_token = "test_access_token";
    const range = "short_term";
    const responseJson = { tracks: [{ name: "Test Track" }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseJson),
    });

    const result = await fetchTopTracks(access_token, range);

    expect(result).toEqual(responseJson);
  });

  it("should throw an error if the fetch call fails", async () => {
    const access_token = "test_access_token";
    const range = "short_term";
    global.fetch = jest.fn().mockRejectedValue(new Error("Test Error"));

    await expect(fetchTopTracks(access_token, range)).rejects.toThrow("Test Error");
  });
});

describe("fetchTopArtists", () => {
  const access_token = "test_access_token";
  const range = "short_term";
  const responseJson = { items: [{ name: "Test Artist", id: "1234" }] };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseJson),
    });
  });

  it("should make a GET request to Spotify API with the access token and range", async () => {
    await fetchTopArtists(access_token, range);

    expect(fetch).toHaveBeenCalledWith(`https://api.spotify.com/v1/me/top/artists?time_range=${range}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  });

  it("should return the top artists data from Spotify API", async () => {
    const topArtists = await fetchTopArtists(access_token, range);

    expect(topArtists).toEqual(responseJson);
  });
});

describe("fetchProfile", () => {
  const access_token = "test_access_token";
  const responseJson = { display_name: "Test User", id: "1234" };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseJson),
    });
  });

  it("should make a GET request to Spotify API with the access token", async () => {
    await fetchProfile(access_token);

    expect(fetch).toHaveBeenCalledWith("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  });

  it("should return the user profile data from Spotify API", async () => {
    const profile = await fetchProfile(access_token);

    expect(profile).toEqual(responseJson);
  });
});
