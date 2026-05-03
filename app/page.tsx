'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function searchShows() {
    if (!query) return;
    setLoading(true);
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}`
    );
    const data = await res.json();
    setShows(data.results || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-2 text-blue-400">📺 ShowTracker</h1>
      <p className="text-center text-gray-400 mb-8">Track, rate and review TV shows from every country</p>

      <div className="flex gap-2 max-w-xl mx-auto mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchShows()}
          placeholder="Search any TV show..."
          className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={searchShows}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-center text-gray-400">Searching...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {shows.map((show: any) => (
          <div key={show.id} className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition cursor-pointer">
            {show.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${show.poster_path}`}
                alt={show.name}
                className="w-full"
              />
            ) : (
              <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">No Image</div>
            )}
            <div className="p-3">
              <h2 className="font-bold text-sm">{show.name}</h2>
              <p className="text-gray-400 text-xs">{show.first_air_date?.slice(0, 4)}</p>
              <p className="text-yellow-400 text-xs">⭐ {show.vote_average?.toFixed(1)}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}