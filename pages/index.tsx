import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { GetStaticProps } from "next";

interface TopArtist {
  id: string;
  name: string;
  imageUrl: string | null;
  spotifyUrl: string;
}

interface HomeProps {
  artists: TopArtist[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description ?? "Token request failed");
    const access_token: string = tokenData.access_token;

    const releasesRes = await fetch("https://api.spotify.com/v1/browse/new-releases?limit=20", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const releases = await releasesRes.json();

    const seen = new Set<string>();
    const artistIds: string[] = [];
    for (const album of releases.albums?.items ?? []) {
      for (const artist of album.artists ?? []) {
        if (artist?.id && !seen.has(artist.id)) {
          seen.add(artist.id);
          artistIds.push(artist.id);
        }
      }
    }

    const artistsRes = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.slice(0, 10).join(",")}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const artistsData = await artistsRes.json();

    const artists: TopArtist[] = (artistsData.artists ?? [])
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 5)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
        spotifyUrl: a.external_urls?.spotify ?? "",
      }));

    return { props: { artists }, revalidate: 3600 };
  } catch {
    return { props: { artists: [] }, revalidate: 60 };
  }
};

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 168 168" className="w-8 h-8" aria-label="Spotify">
      <path
        fill="#1ed760"
        d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.6 121.2c-1.5 2.5-4.8 3.3-7.3 1.8-20-12.2-45.2-15-74.9-8.2-2.9.7-5.8-1.1-6.4-4-.6-2.9 1.1-5.8 4-6.4 32.5-7.4 60.4-4.2 82.9 9.5 2.5 1.5 3.3 4.8 1.7 7.3zm10.3-22.9c-1.9 3.1-6 4.1-9.1 2.2-22.9-14.1-57.8-18.2-84.9-9.9-3.5 1.1-7.2-.9-8.3-4.4-1-3.5.9-7.2 4.4-8.3 31-9.4 69.5-4.8 95.7 11.3 3.1 1.9 4.1 6 2.2 9.1zm.9-23.9c-27.5-16.3-72.9-17.8-99.1-9.8-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 30.1-9.1 80.2-7.4 111.8 11.4 3.8 2.2 5 7.1 2.8 10.8-2.2 3.8-7.1 5-10.9 2.8z"
      />
    </svg>
  );
}

const EQUALIZER_BARS = [
  { delay: "0ms", height: "55%" },
  { delay: "180ms", height: "100%" },
  { delay: "80ms", height: "70%" },
  { delay: "260ms", height: "85%" },
  { delay: "140ms", height: "45%" },
];

function Equalizer() {
  return (
    <div className="flex items-end gap-[3px] h-7">
      {EQUALIZER_BARS.map((bar, i) => (
        <div
          key={i}
          className="w-[3px] bg-[#1ed760] rounded-full origin-bottom"
          style={{
            height: bar.height,
            animation: "equalize 1.3s ease-in-out infinite",
            animationDelay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function Home({ artists }: HomeProps) {
  return (
    <>
      <Head>
        <title>Music Profile — Your Spotify Stats</title>
        <meta name="description" content="Discover your top Spotify tracks and artists" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative min-h-screen bg-[#121212] text-white flex flex-col overflow-hidden">
        {/* Background glow orbs */}
        <div
          className="pointer-events-none absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-[#1ed760] opacity-[0.045] blur-3xl"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600 opacity-[0.07] blur-3xl"
          style={{ animation: "float 10s ease-in-out infinite 2s" }}
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#1ed760] opacity-[0.02] blur-3xl"
          style={{ animation: "float 12s ease-in-out infinite 4s" }}
        />

        <nav className="relative flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <SpotifyLogo />
            <span className="font-bold text-white text-base tracking-tight">Music Profile</span>
          </div>
          <Link href="/profile">
            <span className="bg-white text-black font-bold px-8 py-3 rounded-full text-sm uppercase tracking-[1.4px] hover:scale-105 active:scale-95 transition-transform inline-block cursor-pointer select-none">
              Log In
            </span>
          </Link>
        </nav>

        <main className="relative flex-1 flex items-center justify-between px-8 lg:px-16 py-8 max-w-7xl mx-auto w-full gap-12">
          <div className="flex-1">
            <h1 className="text-6xl lg:text-7xl font-bold leading-none tracking-tight">
              Music to your{" "}
              <span className="text-[#1ed760]" style={{ textShadow: "0 0 40px rgba(30,215,96,0.35)" }}>
                stats.
              </span>
            </h1>

            <div className="mt-8 flex items-center gap-4">
              <Equalizer />
              <p className="text-[#b3b3b3] text-lg leading-relaxed max-w-md">
                Discover your most-played songs, favorite artists, and listening habits — all powered by Spotify.
              </p>
            </div>

            <Link href="/profile">
              <span className="mt-10 bg-[#1ed760] text-black font-bold px-10 py-4 rounded-full text-sm uppercase tracking-[1.4px] hover:scale-105 active:scale-95 transition-all duration-300 inline-block cursor-pointer select-none shadow-[0_0_30px_rgba(30,215,96,0.25)] hover:shadow-[0_0_50px_rgba(30,215,96,0.5)]">
                View My Profile
              </span>
            </Link>
          </div>

          {artists.length > 0 && (
            <div className="hidden md:flex flex-col items-center gap-4 flex-shrink-0">
              {[artists.slice(0, 3), artists.slice(3)].map((row, i) => (
                <div key={i} className="flex gap-4">
                  {row.map((artist) => (
                    <a
                      key={artist.id}
                      href={artist.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden flex-shrink-0 hover:scale-105 transition-all duration-300 shadow-[rgba(0,0,0,0.5)_0px_8px_24px] hover:shadow-[0_0_30px_rgba(30,215,96,0.45),rgba(0,0,0,0.5)_0px_8px_24px] hover:ring-2 hover:ring-[#1ed760]/60 hover:ring-offset-2 hover:ring-offset-[#121212]"
                    >
                      {artist.imageUrl ? (
                        <Image
                          src={artist.imageUrl}
                          alt={artist.name}
                          width={176}
                          height={176}
                          className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#282828]" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2">
                        <span className="text-white font-bold text-xs text-center leading-tight drop-shadow-lg uppercase tracking-wide">
                          {artist.name}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="relative px-8 py-6 border-t border-[#282828]">
          <p className="text-[#b3b3b3] text-xs text-center">Powered by Spotify API. Not affiliated with Spotify AB.</p>
        </footer>
      </div>
    </>
  );
}
