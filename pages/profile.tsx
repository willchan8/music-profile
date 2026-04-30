import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchProfile, fetchTopTracks, fetchTopArtists } from "../lib/spotify";
import { useSpotifyAuth } from "../lib/useSpotifyAuth";

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface Profile {
  country: string;
  display_name: string;
  email: string;
  explicit_content: { filter_enabled: boolean; filter_locked: boolean };
  external_urls: { spotify: string };
  followers: { href: string; total: number };
  href: string;
  id: string;
  images: SpotifyImage[];
  product: string;
  type: string;
  uri: string;
}

interface Artist {
  external_urls: { spotify: string };
  followers?: { href: string; total: number };
  genres: string[];
  href: string;
  id: string;
  images?: SpotifyImage[];
  name: string;
  popularity?: number;
  type: string;
  uri: string;
}

interface Track {
  album: {
    album_type: string;
    total_tracks: number;
    available_markets: string[];
    external_urls: { spotify: string };
    href: string;
    id: string;
    images: SpotifyImage[];
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
  external_ids: { isrc: string };
  external_urls: { spotify: string };
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 168 168" className="w-6 h-6" aria-label="Spotify">
      <path
        fill="#1ed760"
        d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.6 121.2c-1.5 2.5-4.8 3.3-7.3 1.8-20-12.2-45.2-15-74.9-8.2-2.9.7-5.8-1.1-6.4-4-.6-2.9 1.1-5.8 4-6.4 32.5-7.4 60.4-4.2 82.9 9.5 2.5 1.5 3.3 4.8 1.7 7.3zm10.3-22.9c-1.9 3.1-6 4.1-9.1 2.2-22.9-14.1-57.8-18.2-84.9-9.9-3.5 1.1-7.2-.9-8.3-4.4-1-3.5.9-7.2 4.4-8.3 31-9.4 69.5-4.8 95.7 11.3 3.1 1.9 4.1 6 2.2 9.1zm.9-23.9c-27.5-16.3-72.9-17.8-99.1-9.8-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 30.1-9.1 80.2-7.4 111.8 11.4 3.8 2.2 5 7.1 2.8 10.8-2.2 3.8-7.1 5-10.9 2.8z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" />
    </svg>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#1ed760] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#b3b3b3] text-xs uppercase tracking-[2px] font-bold">
          Loading
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const auth = useSpotifyAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topTracks, setTopTracks] = useState<Track[] | null>(null);
  const [topArtists, setTopArtists] = useState<Artist[] | null>(null);
  const [range, setRange] = useState("medium_term");

  // Fetch profile once on first auth
  useEffect(() => {
    if (auth.status !== "authenticated" || profile) return;
    fetchProfile(auth.accessToken).then(setProfile).catch(console.error);
  }, [auth.status]);

  // Fetch tracks + artists whenever auth is ready or range changes
  useEffect(() => {
    if (auth.status !== "authenticated") return;
    Promise.all([
      fetchTopTracks(auth.accessToken, range).then((d) => setTopTracks(d.items)),
      fetchTopArtists(auth.accessToken, range).then((d) => setTopArtists(d.items)),
    ]).catch(console.error);
  }, [auth.status, range]);

  if (auth.status === "loading" || !profile || !topTracks || !topArtists) {
    return <LoadingScreen />;
  }

  if (auth.status === "error") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-[#f3727f] text-sm font-bold">{auth.message}</p>
      </div>
    );
  }

  const profileImageUrl = profile.images?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Top nav bar */}
      <header className="flex items-center justify-between px-8 py-4 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10 border-b border-[#282828]">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <SpotifyLogo />
            <span className="font-bold text-white text-sm tracking-tight hidden sm:block">
              Music Profile
            </span>
          </span>
        </Link>
        {profileImageUrl && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white hidden sm:block">
              {profile.display_name}
            </span>
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={profileImageUrl}
                alt={profile.display_name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        )}
      </header>

      {/* Profile header with gradient */}
      <div className="bg-gradient-to-b from-[#535353] via-[#2a2a2a] to-[#121212] px-8 pt-12 pb-10">
        <div className="flex items-end gap-6 max-w-7xl mx-auto">
          {profileImageUrl ? (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-[rgba(0,0,0,0.5)_0px_8px_24px] flex-shrink-0">
              <Image
                src={profileImageUrl}
                alt={profile.display_name}
                width={192}
                height={192}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#282828] flex items-center justify-center flex-shrink-0 shadow-[rgba(0,0,0,0.5)_0px_8px_24px]">
              <svg className="w-16 h-16 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
          <div className="pb-1">
            <p className="text-xs font-bold uppercase tracking-[2px] text-white/60 mb-2">
              Profile
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-none mb-5">
              {profile.display_name}
            </h1>
            <p className="text-[#b3b3b3] text-sm">
              <span className="font-bold text-white">
                {profile.followers.total.toLocaleString()}
              </span>{" "}
              followers
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-20 max-w-7xl mx-auto">
        {/* Time range selector */}
        <div className="flex items-center gap-2 py-8 flex-wrap">
          <span className="text-[#b3b3b3] text-sm font-bold uppercase tracking-[1.4px] mr-2">
            Time Range
          </span>
          {Object.keys(rangeObject).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-[1.4px] transition-all cursor-pointer ${
                range === key
                  ? "bg-white text-black"
                  : "bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:bg-[#282828]"
              }`}
            >
              {rangeObject[key as keyof Range]}
            </button>
          ))}
        </div>

        {/* Top Tracks */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>

          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_auto] md:grid-cols-[2rem_3fr_2fr_4rem] gap-4 px-4 py-2 border-b border-[#282828] mb-1">
            <span className="text-[#b3b3b3] text-xs font-bold uppercase tracking-wider text-right">#</span>
            <span className="text-[#b3b3b3] text-xs font-bold uppercase tracking-wider">Title</span>
            <span className="text-[#b3b3b3] text-xs font-bold uppercase tracking-wider hidden md:block">Album</span>
            <span className="text-[#b3b3b3] text-xs font-bold uppercase tracking-wider text-right">Time</span>
          </div>

          {topTracks.map((track, i) => (
            <a
              key={track.id}
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[2rem_1fr_auto] md:grid-cols-[2rem_3fr_2fr_4rem] gap-4 px-4 py-3 rounded-md hover:bg-[#1f1f1f] group items-center transition-colors"
            >
              {/* Track number / play icon on hover */}
              <div className="flex items-center justify-end">
                <span className="text-[#b3b3b3] text-sm font-medium group-hover:hidden">
                  {i + 1}
                </span>
                <span className="hidden group-hover:flex text-white">
                  <PlayIcon />
                </span>
              </div>

              {/* Title + artist */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#282828]">
                  {track.album.images[2]?.url || track.album.images[0]?.url ? (
                    <Image
                      src={track.album.images[2]?.url ?? track.album.images[0].url}
                      alt={track.album.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate group-hover:text-[#1ed760] transition-colors">
                    {track.name}
                  </p>
                  <p className="text-[#b3b3b3] text-xs truncate">
                    {track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </div>

              {/* Album name (desktop) */}
              <span className="text-[#b3b3b3] text-sm truncate hidden md:block hover:underline hover:text-white">
                {track.album.name}
              </span>

              {/* Duration */}
              <span className="text-[#b3b3b3] text-sm tabular-nums text-right">
                {formatDuration(track.duration_ms)}
              </span>
            </a>
          ))}
        </section>

        {/* Top Artists */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Top Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {topArtists.map((artist) => (
              <a
                key={artist.id}
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-colors group cursor-pointer"
              >
                <div className="w-full aspect-square rounded-full overflow-hidden mb-4 shadow-[rgba(0,0,0,0.3)_0px_8px_8px] bg-[#282828]">
                  {artist.images?.[1]?.url || artist.images?.[0]?.url ? (
                    <Image
                      src={artist.images[1]?.url ?? artist.images![0].url}
                      alt={artist.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-white font-bold text-sm text-center leading-tight truncate w-full text-center">
                  {artist.name}
                </p>
                <p className="text-[#b3b3b3] text-xs mt-1">Artist</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
