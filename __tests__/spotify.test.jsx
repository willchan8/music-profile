import { act, render, screen, waitFor } from "@testing-library/react";
import {
  redirectToAuthCodeFlow,
  getAccessToken,
  generateCodeVerifier,
  generateCodeChallenge,
  getAccessTokenWithRefresh,
  fetchTopTracks,
  fetchTopArtists,
  fetchProfile,
  setWithExpiry,
  getWithExpiry,
} from "../lib/spotify";

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

describe("Spotify API tests", () => {
  beforeAll(() => {
    // Mock localStorage.setItem and localStorage.getItem
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key],
        setItem: (key, value) => (store[key] = value.toString()),
        clear: () => (store = {}),
      };
    })();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    Object.defineProperty(window, "location", {
      value: {
        assign: jest.fn(),
      },
      writable: true,
    });

    jest.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
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
    const codeVerifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(codeVerifier);
    await redirectToAuthCodeFlow(clientId, challenge);

    expect(localStorage.getItem("code_verifier")).toBeDefined();

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://nextjs-spotify-two.vercel.app/profile");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    expect(window.location.assign).toHaveBeenCalledWith(`https://accounts.spotify.com/authorize?${params.toString()}`);
  });

  // it("should get an access token from Spotify", async () => {
  //   const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  //   const authCode = "test_auth_code";
  //   localStorage.setItem("code_verifier", "test_code_verifier");
  //   const responseJson = { access_token: "test_access_token", expires_in: 3600 };
  //   global.fetch = jest.fn().mockResolvedValue({
  //     json: jest.fn().mockResolvedValue(responseJson),
  //   });
  //   const accessToken = await getAccessToken(clientId, authCode);
  //   expect(fetch).toHaveBeenCalledWith("https://accounts.spotify.com/api/token", {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Basic ${Buffer.from("CLIENT_ID:undefined").toString("base64")}`,
  //       "Content-Type": "application/x-www-form-urlencoded",
  //     },
  //     body: new URLSearchParams({
  //       client_id: CLIENT_ID,
  //       grant_type: "authorization_code",
  //       code: "test_auth_code",
  //       redirect_uri: "http://localhost:3000/profile",
  //       code_verifier: "test_code_verifier",
  //     }),
  //   });
  //   expect(accessToken).toEqual(responseJson);
  // });
});
