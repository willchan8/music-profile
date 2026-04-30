import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toString();
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
        <p className="text-[#b3b3b3] text-xs uppercase tracking-[2px] font-bold">Loading</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#181818] rounded-xl p-5 flex flex-col gap-1 border border-[#282828]">
      <p className="text-[#b3b3b3] text-xs font-bold uppercase tracking-[1.4px]">{label}</p>
      <p className="text-white text-2xl font-bold leading-none">{value}</p>
      {sub && <p className="text-[#b3b3b3] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Profile() {
  const auth = useSpotifyAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topTracks, setTopTracks] = useState<Track[] | null>(null);
  const [topArtists, setTopArtists] = useState<Artist[] | null>(null);
  const [range, setRange] = useState("medium_term");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "insights">("overview");
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated" || profile) return;
    fetchProfile(auth.accessToken)
      .then(setProfile)
      .catch((err: unknown) => setFetchError(err instanceof Error ? err.message : "Failed to load profile"));
  }, [auth.status]);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    setFetchError(null);
    Promise.all([
      fetchTopTracks(auth.accessToken, range).then((d) => setTopTracks(d.items)),
      fetchTopArtists(auth.accessToken, range).then((d) => setTopArtists(d.items)),
    ]).catch((err: unknown) => setFetchError(err instanceof Error ? err.message : "Failed to load data"));
  }, [auth.status, range]);

  useEffect(() => {
    if (activeTab === "insights") {
      const t = setTimeout(() => setBarsVisible(true), 80);
      return () => clearTimeout(t);
    } else {
      setBarsVisible(false);
    }
  }, [activeTab, range]);

  const genreBreakdown = useMemo(() => {
    if (!topArtists) return [];
    const counts: Record<string, number> = {};
    for (const artist of topArtists) {
      for (const genre of artist.genres) {
        counts[genre] = (counts[genre] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([genre, count]) => ({ genre, count, pct: Math.round((count / max) * 100) }));
  }, [topArtists]);

  const avgPopularity = useMemo(() => {
    if (!topTracks || topTracks.length === 0) return 0;
    return Math.round(topTracks.reduce((s, t) => s + t.popularity, 0) / topTracks.length);
  }, [topTracks]);

  const releaseEras = useMemo(() => {
    if (!topTracks) return [];
    const counts: Record<string, number> = {};
    for (const track of topTracks) {
      const year = track.album.release_date?.substring(0, 4);
      if (year) counts[year] = (counts[year] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(...sorted.map(([, c]) => c));
    return sorted.map(([year, count]) => ({ year, count, pct: Math.round((count / max) * 100) }));
  }, [topTracks]);

  const artistsByFollowers = useMemo(() => {
    if (!topArtists) return [];
    const sorted = [...topArtists]
      .filter((a) => a.followers?.total !== undefined)
      .sort((a, b) => (b.followers?.total ?? 0) - (a.followers?.total ?? 0));
    const max = sorted[0]?.followers?.total ?? 1;
    return sorted.map((a) => ({
      name: a.name,
      followers: a.followers?.total ?? 0,
      pct: Math.round(((a.followers?.total ?? 0) / max) * 100),
      imageUrl: a.images?.[2]?.url ?? a.images?.[0]?.url ?? null,
      spotifyUrl: a.external_urls.spotify,
    }));
  }, [topArtists]);

  const personality = useMemo(() => {
    const uniqueGenres = genreBreakdown.length;
    if (avgPopularity >= 78) {
      return {
        label: "Chart Chaser",
        emoji: "🏆",
        description: "You gravitate toward the mainstream — if it's topping the charts, it's probably in your rotation.",
        variety: uniqueGenres >= 7 ? "But your wide genre range keeps things interesting." : "Your taste is focused and on-trend.",
      };
    } else if (avgPopularity >= 60) {
      return {
        label: "Mainstream Explorer",
        emoji: "🎯",
        description: "You enjoy popular music but aren't afraid to venture beyond the top 40.",
        variety: uniqueGenres >= 7 ? "Your genre diversity shows a genuinely curious ear." : "You stick to a few genres you know and love.",
      };
    } else if (avgPopularity >= 42) {
      return {
        label: "Selective Listener",
        emoji: "🎧",
        description: "You balance crowd-pleasers with deeper cuts — quality over chart position.",
        variety: uniqueGenres >= 7 ? "You roam freely across genres, following the music rather than the hype." : "Your sound is focused, intentional, and yours.",
      };
    } else {
      return {
        label: "Underground Enthusiast",
        emoji: "🔍",
        description: "You dig beneath the surface. Your picks live well outside the mainstream spotlight.",
        variety: uniqueGenres >= 7 ? "And your eclectic genre range proves you follow no single scene." : "You've found your niche and you own it.",
      };
    }
  }, [avgPopularity, genreBreakdown.length]);

  if (auth.status === "loading" || !profile || !topTracks || !topArtists) {
    return <LoadingScreen />;
  }

  if (auth.status === "error" || fetchError) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-[#f3727f] text-sm font-bold">{auth.status === "error" ? auth.message : fetchError}</p>
      </div>
    );
  }

  const profileImageUrl = profile.images?.[0]?.url;
  const topGenre = genreBreakdown[0]?.genre ?? "—";
  const uniqueGenres = genreBreakdown.length;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10 border-b border-[#282828]">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <SpotifyLogo />
            <span className="font-bold text-white text-sm tracking-tight hidden sm:block">Music Profile</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/";
            }}
            className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-[1.4px] bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:bg-[#282828] transition-all cursor-pointer"
          >
            Log Out
          </button>
          {profileImageUrl && (
            <>
              <span className="text-sm font-bold text-white hidden sm:block">{profile.display_name}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image src={profileImageUrl} alt={profile.display_name} width={32} height={32} className="w-full h-full object-cover" priority />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Profile gradient header */}
      <div className="bg-gradient-to-b from-[#535353] via-[#2a2a2a] to-[#121212] px-8 pt-12 pb-10">
        <div className="flex items-end gap-6 max-w-7xl mx-auto">
          {profileImageUrl ? (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-[rgba(0,0,0,0.5)_0px_8px_24px] flex-shrink-0">
              <Image src={profileImageUrl} alt={profile.display_name} width={192} height={192} className="w-full h-full object-cover" priority />
            </div>
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#282828] flex items-center justify-center flex-shrink-0 shadow-[rgba(0,0,0,0.5)_0px_8px_24px]">
              <svg className="w-16 h-16 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
          <div className="pb-1">
            <p className="text-xs font-bold uppercase tracking-[2px] text-white/60 mb-2">Profile</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-none mb-5">{profile.display_name}</h1>
            <p className="text-[#b3b3b3] text-sm">
              <span className="font-bold text-white">{profile.followers.total.toLocaleString()}</span> followers
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-20 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-2 pt-8 pb-2">
          {(["overview", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-[1.4px] transition-all cursor-pointer ${
                activeTab === tab ? "bg-white text-black" : "bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:bg-[#282828]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Range selector — shared */}
        <div className="flex items-center gap-2 py-6 flex-wrap">
          <span className="text-[#b3b3b3] text-sm font-bold uppercase tracking-[1.4px] mr-2">Time Range</span>
          {Object.keys(rangeObject).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-[1.4px] transition-all cursor-pointer ${
                range === key ? "bg-white text-black" : "bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:bg-[#282828]"
              }`}
            >
              {rangeObject[key as keyof Range]}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>
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
                  <div className="flex items-center justify-end">
                    <span className="text-[#b3b3b3] text-sm font-medium group-hover:hidden">{i + 1}</span>
                    <span className="hidden group-hover:flex text-white"><PlayIcon /></span>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#282828]">
                      {track.album.images[2]?.url || track.album.images[0]?.url ? (
                        <Image src={track.album.images[2]?.url ?? track.album.images[0].url} alt={track.album.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate group-hover:text-[#1ed760] transition-colors">{track.name}</p>
                      <p className="text-[#b3b3b3] text-xs truncate">{track.artists.map((a) => a.name).join(", ")}</p>
                    </div>
                  </div>
                  <span className="text-[#b3b3b3] text-sm truncate hidden md:block">{track.album.name}</span>
                  <span className="text-[#b3b3b3] text-sm tabular-nums text-right">{formatDuration(track.duration_ms)}</span>
                </a>
              ))}
            </section>

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
                        <Image src={artist.images[1]?.url ?? artist.images![0].url} alt={artist.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-white font-bold text-sm text-center leading-tight truncate w-full">{artist.name}</p>
                    <p className="text-[#b3b3b3] text-xs mt-1">Artist</p>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── INSIGHTS TAB ── */}
        {activeTab === "insights" && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
              <StatCard label="Top Genre" value={topGenre} sub="Most frequent across your top artists" />
              <StatCard label="Genre Variety" value={`${uniqueGenres}`} sub="Unique genres in your top artists" />
              <StatCard label="Avg Popularity" value={`${avgPopularity} / 100`} sub="Average Spotify score of your top tracks" />
            </div>

            {/* Listener Personality */}
            {personality && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">Listener Personality</h2>
                <div className="bg-[#181818] border border-[#282828] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="text-5xl flex-shrink-0">{personality.emoji}</div>
                  <div>
                    <p className="text-[#1ed760] text-xs font-bold uppercase tracking-[2px] mb-1">Your listener type</p>
                    <h3 className="text-white text-2xl font-bold mb-2">{personality.label}</h3>
                    <p className="text-[#b3b3b3] text-sm leading-relaxed">
                      {personality.description} {personality.variety}
                    </p>
                  </div>
                  {/* Popularity meter */}
                  <div className="sm:ml-auto flex-shrink-0 flex flex-col items-center gap-2 min-w-[80px]">
                    <div className="relative w-16 h-16">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#282828" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9"
                          fill="none"
                          stroke="#1ed760"
                          strokeWidth="3"
                          strokeDasharray={`${avgPopularity} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{avgPopularity}</span>
                    </div>
                    <p className="text-[#b3b3b3] text-xs uppercase tracking-wider">Popularity</p>
                  </div>
                </div>
              </section>
            )}

            {/* Genre Breakdown */}
            {genreBreakdown.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Genre Breakdown</h2>
                <div className="flex flex-col gap-3">
                  {genreBreakdown.map(({ genre, count, pct }) => (
                    <div key={genre} className="flex items-center gap-4">
                      <span className="text-[#b3b3b3] text-sm w-40 flex-shrink-0 truncate capitalize">{genre}</span>
                      <div className="flex-1 bg-[#282828] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#1ed760] rounded-full transition-all duration-700 ease-out"
                          style={{ width: barsVisible ? `${pct}%` : "0%" }}
                        />
                      </div>
                      <span className="text-[#b3b3b3] text-xs w-6 text-right flex-shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Track Popularity */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">Track Popularity</h2>
              <p className="text-[#b3b3b3] text-sm mb-6">Spotify popularity score (0–100) for each of your top tracks</p>
              <div className="flex flex-col gap-3">
                {topTracks.map((track) => (
                  <a
                    key={track.id}
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-[#282828]">
                      {track.album.images[2]?.url || track.album.images[0]?.url ? (
                        <Image src={track.album.images[2]?.url ?? track.album.images[0].url} alt={track.album.name} width={32} height={32} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <span className="text-white text-sm w-44 flex-shrink-0 truncate group-hover:text-[#1ed760] transition-colors">{track.name}</span>
                    <div className="flex-1 bg-[#282828] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: barsVisible ? `${track.popularity}%` : "0%",
                          background: `hsl(${track.popularity * 1.42}deg 80% 55%)`,
                        }}
                      />
                    </div>
                    <span className="text-[#b3b3b3] text-xs w-8 text-right flex-shrink-0">{track.popularity}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Release Era */}
            {releaseEras.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-2">Release Era</h2>
                <p className="text-[#b3b3b3] text-sm mb-6">Which years your top tracks were released</p>
                <div className="flex flex-col gap-3">
                  {releaseEras.map(({ year, count, pct }) => (
                    <div key={year} className="flex items-center gap-4">
                      <span className="text-[#b3b3b3] text-sm w-12 flex-shrink-0 tabular-nums">{year}</span>
                      <div className="flex-1 bg-[#282828] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#1ed760] rounded-full transition-all duration-700 ease-out"
                          style={{ width: barsVisible ? `${pct}%` : "0%" }}
                        />
                      </div>
                      <span className="text-[#b3b3b3] text-xs w-6 text-right flex-shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Artist Reach */}
            {artistsByFollowers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-2">Artist Reach</h2>
                <p className="text-[#b3b3b3] text-sm mb-6">Spotify follower count for each of your top artists</p>
                <div className="flex flex-col gap-4">
                  {artistsByFollowers.map(({ name, followers, pct, imageUrl, spotifyUrl }) => (
                    <a
                      key={name}
                      href={spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#282828]">
                        {imageUrl && <Image src={imageUrl} alt={name} width={32} height={32} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-white text-sm w-36 flex-shrink-0 truncate group-hover:text-[#1ed760] transition-colors">{name}</span>
                      <div className="flex-1 bg-[#282828] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#1ed760] rounded-full transition-all duration-700 ease-out"
                          style={{ width: barsVisible ? `${pct}%` : "0%" }}
                        />
                      </div>
                      <span className="text-[#b3b3b3] text-xs w-12 text-right flex-shrink-0">{formatFollowers(followers)}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
