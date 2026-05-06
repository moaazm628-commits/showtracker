'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

function ShowCard({ show }: { show: any }) {
  return (
    <Link href={`/show/${show.id}`} className="flex-shrink-0 w-36 hover:scale-105 transition cursor-pointer">
      {show.poster_path ? (
        <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} alt={show.name} className="w-full rounded-xl" />
      ) : (
        <div className="w-full h-52 bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center p-2">{show.name}</div>
      )}
      <p className="text-xs font-bold mt-1 truncate">{show.name}</p>
      <p className="text-yellow-400 text-xs">⭐ {show.vote_average?.toFixed(1)}</p>
    </Link>
  );
}

function Row({ title, shows }: { title: string; shows: any[] }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-blue-400 mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {shows.map((show: any) => <ShowCard key={show.id} show={show} />)}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="flex-shrink-0 w-64 bg-gray-800 rounded-xl p-4">
      <p className="font-bold text-blue-400 truncate">{review.show_name}</p>
      <p className="text-yellow-400 text-sm">⭐ {review.rating}/10</p>
      <p className="text-gray-300 text-sm mt-1 line-clamp-3">{review.review}</p>
      <p className="text-gray-500 text-xs mt-2">by {review.author}</p>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [latest, setLatest] = useState([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      const [trendingRes, topRatedRes, latestRes, popularRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`),
        fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`),
        fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`),
      ]);
      const [trendingData, topRatedData, latestData, popularData] = await Promise.all([
        trendingRes.json(), topRatedRes.json(), latestRes.json(), popularRes.json()
      ]);
      setTrending(trendingData.results || []);
      setTopRated(topRatedData.results || []);
      setLatest(latestData.results || []);
      setPopular(popularData.results || []);

      const { data } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      setReviews(data || []);
    }
    fetchAll();
  }, []);

  async function searchShows() {
    if (!query) return;
    setLoading(true);
    setSearched(true);

    const [enRes, arRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}&language=ar-SA`),
    ]);

    const [enData, arData] = await Promise.all([enRes.json(), arRes.json()]);

    const combined = [...(enData.results || []), ...(arData.results || [])];
    const unique = combined.filter((show, index, self) =>
      index === self.findIndex((s) => s.id === show.id)
    );

    setSearchResults(unique);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <p className="text-center text-gray-400 mb-8">Track, rate and review TV shows from every country</p>

      <div className="flex gap-2 max-w-xl mx-auto mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchShows()}
          placeholder="Search in English or Arabic..."
          className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
        />
        <button onClick={searchShows} className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold">
          Search
        </button>
        {searched && (
          <button onClick={() => { setSearched(false); setQuery(''); }} className="bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg">✕</button>
        )}
      </div>

      {loading && <p className="text-center text-gray-400">Searching...</p>}

      {searched ? (
        <Row title="🔍 Search Results" shows={searchResults} />
      ) : (
        <>
          {reviews.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-blue-400 mb-4">💬 Latest Community Reviews</h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            </div>
          )}
          <Row title="🔥 Trending This Week" shows={trending} />
          <Row title="👁️ Most Viewed" shows={popular} />
          <Row title="⭐ Top Rated" shows={topRated} />
          <Row title="🆕 Latest Shows" shows={latest} />
        </>
      )}
    </main>
  );
}