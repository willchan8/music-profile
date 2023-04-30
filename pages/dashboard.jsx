import styles from "@/styles/Home.module.css";
import classNames from "classnames";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { fetchProfile, fetchTopTracks, redirectToAuthCodeFlow, getAccessToken, getAccessTokenWithRefresh, setWithExpiry, getWithExpiry } from "../lib/spotify";

const inter = Inter({ subsets: ["latin"] });

const rangeObject = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

export default function Main() {
  const [profile, setProfile] = useState(null);
  const [topTracks, setTopTracks] = useState(null);
  const [range, setRange] = useState("medium_term");

  const getProfile = async (accessToken) => {
    const profileData = await fetchProfile(accessToken);
    setProfile(profileData);
  };

  const getTopTracks = async (accessToken, range) => {
    const topTracksData = await fetchTopTracks(accessToken, range);
    setTopTracks(topTracksData);
  };

  useEffect(() => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    const accessToken = getWithExpiry("accessToken");

    const init = async () => {
      try {
        if (!authCode && !accessToken) {
          redirectToAuthCodeFlow(CLIENT_ID);
        } else {
          const accessTokenResponse = await getAccessToken(CLIENT_ID, authCode);
          const { access_token, expires_in } = accessTokenResponse;
          if (access_token) {
            setWithExpiry("accessToken", access_token, expires_in);
            window.location.href = `${window.location.origin}/dashboard`;
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const accessToken = getWithExpiry("accessToken");
    if (accessToken) {
      if (!profile) {
        getProfile(accessToken);
      }
      if (range) {
        getTopTracks(accessToken, range);
      }
    }
  }, [range]);

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

      <h3>Top Tracks ({rangeObject[range]})</h3>
      <div className={styles.row}>
        <p>Date Range:</p>
        {Object.keys(rangeObject).map((key) => (
          <button className={styles.button} onClick={() => setRange(key)} disabled={range === key} key={key}>
            {rangeObject[key]}
          </button>
        ))}
      </div>
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
