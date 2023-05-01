import styles from "@/styles/Home.module.css";
import classNames from "classnames";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { fetchProfile, fetchTopTracks, fetchTopArtists, redirectToAuthCodeFlow, getAccessToken, setWithExpiry, getWithExpiry } from "../lib/spotify";

const inter = Inter({ subsets: ["latin"] });

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Profile {
  country: string;
  display_name: string;
  email: string;
  explicit_content: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string;
    total: number;
  };
  href: string;
  id: string;
  images: Image[];
  product: string;
  type: string;
  uri: string;
}

interface Track {
  album: {
    album_type: string;
    total_tracks: number;
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: Image[];
    name: string;
    release_date: string;
    release_date_precision: string;
    type: string;
    uri: string;
    artists: Artist[];
  };
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc: string;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}

interface Artist {
  external_urls: {
    spotify: string;
  };
  followers?: {
    href: string;
    total: number;
  };
  genres: string[];
  href: string;
  id: string;
  images?: Image[];
  name: string;
  popularity?: number;
  type: string;
  uri: string;
}

interface Range {
  short_term: string;
  medium_term: string;
  long_term: string;
}

const rangeObject: Range = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

export default function Main() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topTracks, setTopTracks] = useState<Track[] | null>(null);
  const [topArtists, setTopArtists] = useState<Artist[] | null>(null);
  const [range, setRange] = useState("medium_term");

  const getProfile = async (accessToken: string) => {
    const profileData = await fetchProfile(accessToken);
    setProfile(profileData);
  };

  const getTopTracks = async (accessToken: string, range: string) => {
    const topTracksData = await fetchTopTracks(accessToken, range);
    setTopTracks(topTracksData.items);
  };

  const getTopArtists = async (accessToken: string, range: string) => {
    const topArtistsData = await fetchTopArtists(accessToken, range);
    setTopArtists(topArtistsData.items);
  };

  useEffect(() => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    const accessToken = getWithExpiry("accessToken");

    const init = async () => {
      try {
        if (!accessToken) {
          if (!authCode) {
            redirectToAuthCodeFlow(CLIENT_ID);
          } else {
            const accessTokenResponse = await getAccessToken(CLIENT_ID, authCode);
            const { access_token, expires_in } = accessTokenResponse;
            setWithExpiry("accessToken", access_token, expires_in);
            window.location.replace("/spotify");
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
      <h1 className="my-2">Spotify Profile</h1>
      <div className={classNames(styles.card, styles.row)}>
        {profile.images && profile.images[0]?.url && <Image src={profile.images[0]?.url} alt={profile.display_name} width={100} height={100} priority />}
        <div>Welcome, {profile.display_name}!</div>
      </div>

      <div className={classNames(styles.row, styles.range)}>
        <p>Date Range:</p>
        {Object.keys(rangeObject).map((key) => (
          <button className={styles.button} onClick={() => setRange(key)} disabled={range === key} key={key}>
            {rangeObject[key as keyof Range]}
          </button>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className="font-bold text-center">Top Tracks ({rangeObject[range as keyof Range]})</h2>
        <div className={styles.grid}>
          {topTracks.map((track, i) => (
            <a className={classNames(styles.card, styles.row)} key={track.id} href={track.external_urls.spotify}>
              <div className={styles.row}>
                <p className="w-4 font-semibold">#{i + 1}</p>
                <div className={styles.imageContainer}>
                  <Image src={track.album.images[1].url} alt={track.album.name} width={100} height={100} priority />
                </div>
                <div>
                  <span>{track.name}</span>
                  <p>
                    {track.artists.map((artist: any, i: number) => {
                      if (i > 0) {
                        return `, ${artist.name}`;
                      }
                      return artist.name;
                    })}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="font-bold text-center">Top Artists ({rangeObject[range as keyof Range]})</h2>
        <div className={styles.grid}>
          {topArtists.map((artist: any, i: number) => (
            <a className={styles.card} key={artist.id} href={artist.external_urls.spotify}>
              <div className={styles.row}>
                <p className="w-4 font-semibold">#{i + 1}</p>
                <div className={styles.imageContainer}>
                  <Image src={artist.images[2].url} alt={artist.name} width={100} height={100} />
                </div>
                <div>{artist.name}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
