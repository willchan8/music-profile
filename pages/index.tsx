import Head from "next/head";
import Link from "next/link";

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

const artistImages = [
  { src: "/images/ariana.png", name: "Ariana Grande" },
  { src: "/images/blackpink.png", name: "BLACKPINK" },
  { src: "/images/weeknd.png", name: "The Weeknd" },
  { src: "/images/taylorswift.png", name: "Taylor Swift" },
  { src: "/images/zedd.png", name: "Zedd" },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Music Profile — Your Spotify Stats</title>
        <meta name="description" content="Discover your top Spotify tracks and artists" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#121212] text-white flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6">
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

        {/* Hero */}
        <main className="flex-1 flex items-center justify-between px-8 lg:px-16 py-8 max-w-7xl mx-auto w-full gap-12">
          {/* Left: copy */}
          <div className="flex-1">
            <h1 className="text-6xl lg:text-7xl font-bold leading-none tracking-tight">
              Music<br />to your<br />
              <span className="text-[#1ed760]">stats.</span>
            </h1>
            <p className="text-[#b3b3b3] mt-8 text-lg leading-relaxed max-w-md">
              Discover your most-played songs, favorite artists, and listening habits — all powered by Spotify.
            </p>
            <Link href="/profile">
              <span className="mt-10 bg-[#1ed760] text-black font-bold px-10 py-4 rounded-full text-sm uppercase tracking-[1.4px] hover:scale-105 active:scale-95 transition-transform inline-block cursor-pointer select-none">
                View My Profile
              </span>
            </Link>
          </div>

          {/* Right: artist image circles */}
          <div className="hidden md:flex flex-col items-center gap-4 flex-shrink-0">
            <div className="flex gap-4">
              {artistImages.slice(0, 3).map((artist) => (
                <div
                  key={artist.name}
                  className="w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden shadow-[rgba(0,0,0,0.5)_0px_8px_24px] hover:scale-105 transition-transform duration-200"
                >
                  <img
                    src={artist.src}
                    alt={artist.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              {artistImages.slice(3).map((artist) => (
                <div
                  key={artist.name}
                  className="w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden shadow-[rgba(0,0,0,0.5)_0px_8px_24px] hover:scale-105 transition-transform duration-200"
                >
                  <img
                    src={artist.src}
                    alt={artist.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-[#282828]">
          <p className="text-[#b3b3b3] text-xs text-center">
            Powered by Spotify API. Not affiliated with Spotify AB.
          </p>
        </footer>
      </div>
    </>
  );
}
