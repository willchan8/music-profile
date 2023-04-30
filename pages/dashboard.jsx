import styles from "@/styles/Home.module.css";
import classNames from "classnames";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { fetchProfile, fetchTopTracks, redirectToAuthCodeFlow, getAccessToken, getAccessTokenWithRefresh, setWithExpiry, getWithExpiry } from "../lib/spotify";

const inter = Inter({ subsets: ["latin"] });

export default function Main() {
  const [profile, setProfile] = useState(null);
  const [topTracks, setTopTracks] = useState(null);

  useEffect(() => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    const accessToken = getWithExpiry("accessToken");

    const getProfile = async () => {
      const profileData = await fetchProfile(accessToken);
      setProfile(profileData);
    };

    const getTopTracks = async () => {
      const topTracksData = await fetchTopTracks(accessToken);
      setTopTracks(topTracksData);
    };

    const init = async () => {
      try {
        if (!authCode && !accessToken) {
          redirectToAuthCodeFlow(CLIENT_ID);
        } else {
          const accessTokenResponse = await getAccessToken(CLIENT_ID, authCode);
          const { access_token, expires_in } = accessTokenResponse;
          if (access_token) {
            setWithExpiry("accessToken", access_token, expires_in);
          }
          getProfile();
          getTopTracks();
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  if (!profile || !topTracks) {
    return null;
  }

  return (
    <main className={classNames(styles.main, inter.className)}>
      <h1>Spotify Profile</h1>
      <div className={classNames(styles.card, styles.row)}>
        {profile.images && profile.images[0]?.url && <img src={profile.images[0]?.url} alt={profile.display_name} style={{ width: "100px", height: "100px" }} />}
        <div>
          <p>Email: {profile.email}</p>
          <p>Name: {profile.display_name}</p>
        </div>
      </div>

      <h3>Top Tracks</h3>
      <div className={styles.grid}>
        {topTracks?.items?.map((item, i) => (
          <div className={classNames(styles.card, styles.row)} key={item.id}>
            <p>#{i + 1}</p>
            <img src={item.album.images[2].url} alt={item.album.name} />
            <div>
              <p>{item.name}</p>
              <p>
                {item.artists.map((artist) => (
                  <span key={artist.id}>{artist.name}</span>
                ))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
