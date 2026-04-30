import { useState, useEffect } from "react";
import { redirectToAuthCodeFlow, getAccessToken, setWithExpiry, getWithExpiry } from "./spotify";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; accessToken: string }
  | { status: "error"; message: string };

export function useSpotifyAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;

    async function authenticate() {
      // Already have a valid stored token
      const stored = getWithExpiry("accessToken");
      if (stored) {
        setState({ status: "authenticated", accessToken: stored });
        return;
      }

      // Returning from Spotify with an auth code
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        try {
          const { access_token, expires_in } = await getAccessToken(CLIENT_ID, code);
          setWithExpiry("accessToken", access_token, expires_in);
          // Clean the code from the URL without a full page reload
          window.history.replaceState({}, "", "/profile");
          setState({ status: "authenticated", accessToken: access_token });
        } catch (err) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Authentication failed",
          });
        }
        return;
      }

      // No token, no code — kick off the PKCE flow
      redirectToAuthCodeFlow(CLIENT_ID);
    }

    authenticate();
  }, []);

  return state;
}
