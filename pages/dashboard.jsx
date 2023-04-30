import styles from "@/styles/Home.module.css";
import classNames from "classnames";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { fetchProfile, fetchTopTracks, fetchTopArtists, redirectToAuthCodeFlow, getAccessToken, setWithExpiry, getWithExpiry } from "../lib/spotify";

const inter = Inter({ subsets: ["latin"] });

const rangeObject = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

export default function Main() {
  const [profile, setProfile] = useState(null);
  const [topTracks, setTopTracks] = useState(null);
  const [topArtists, setTopArtists] = useState(null);
  const [range, setRange] = useState("medium_term");

  const getProfile = async (accessToken) => {
    const profileData = await fetchProfile(accessToken);
    setProfile(profileData);
  };

  const getTopTracks = async (accessToken, range) => {
    const topTracksData = await fetchTopTracks(accessToken, range);
    setTopTracks(topTracksData.items);
  };

  const getTopArtists = async (accessToken, range) => {
    const topArtistsData = await fetchTopArtists(accessToken, range);
    setTopArtists(topArtistsData.items);
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
        getTopArtists(accessToken, range);
      }
    }
  }, [range]);

  if (!profile || !topTracks || !topArtists) {
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

      <div className={styles.row}>
        <p>Date Range:</p>
        {Object.keys(rangeObject).map((key) => (
          <button className={styles.button} onClick={() => setRange(key)} disabled={range === key} key={key}>
            {rangeObject[key]}
          </button>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className="font-bold text-center">Top Tracks ({rangeObject[range]})</h2>
        <div className={styles.grid}>
          {topTracks.map((track, i) => (
            <div className={classNames(styles.card, styles.row)} key={track.id}>
              <p className="w-4">#{i + 1}</p>
              <img src={track.album.images[1].url} alt={track.album.name} style={{ width: "100px", height: "100px" }} />
              <div>
                <span>{track.name}</span>
                <p>
                  {track.artists.map((artist, i) => {
                    if (i > 0) {
                      return `, ${artist.name}`;
                    }
                    return artist.name;
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="font-bold text-center">Top Artists ({rangeObject[range]})</h2>
        <div className={styles.grid}>
          {topArtists.map((artist, i) => (
            <div className={classNames(styles.card, styles.row)} key={artist.id}>
              <p className="w-4">#{i + 1}</p>
              <img src={artist.images[2].url} alt={artist.name} style={{ width: "100px", height: "100px" }} />
              <div>
                <p>{artist.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
