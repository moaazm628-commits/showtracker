'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

function ShowCard({ show }: { show: any }) {
  return (
    <Link href={`/show/${show.id}`} className="flex-shrink-0 w-40 group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg">
        {show.poster_path ? (
          <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} alt={show.name} className="w-full rounded-lg group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-60 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-xs text-center p-2">{show.name}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 rounded-lg flex items-end p-2">
          <p className="text-white text-xs font-bold">{show.name}</p>
        </div>
        {show.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-80 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
            ⭐ {show.vote_average?.toFixed(1)}
          </div>
        )}
      </div>
      <p className="text-xs font-semibold mt-2 truncate text-gray-200">{show.name}</p>
      <p className="text-xs text-gray-500">{show.first_air_date?.slice(0, 4)}</p>
    </Link>
  );
}

function Row({ title, shows }: { title: string; shows: any[] }) {
  return (
    <div className="mb-12">
      <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {shows.map((show: any) => <ShowCard key={show.id} show={show} />)}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    async function checkLike() {
      if (!user) return;
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_id', review.id)
        .single();
      setLiked(!!data);
    }

    async function getLikes() {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id);
      setLikes(count || 0);
    }

    checkLike();
    getLikes();
  }, [user, review.id]);

  async function toggleLike() {
    if (!user) return;
    setLikeLoading(true);
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('review_id', review.id);
      setLikes((l) => l - 1);
      setLiked(false);
    } else {
      await supabase.from('likes').insert([{ user_id: user.id, review_id: review.id }]);
      setLikes((l) => l + 1);
      setLiked(true);
    }
    setLikeLoading(false);
  }

  return (
    <div className="flex-shrink-0 w-72 bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-600 transition flex flex-col justify-between">
      <div>
        <p className="font-bold text-yellow-400 truncate text-sm">{review.show_name}</p>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className={`h-1 w-4 rounded ${i < review.rating ? 'bg-yellow-400' : 'bg-gray-700'}`} />
          ))}
          <span className="text-yellow-400 text-xs ml-1">{review.rating}/10</span>
        </div>
        <p className="text-gray-300 text-sm mt-2 line-clamp-3">{review.review}</p>
        <p className="text-gray-600 text-xs mt-3">by <Link href={'/profile/' + review.author} className="hover:text-yellow-400">{review.author}</Link></p>
      </div>
      <div className="mt-4 flex items-center">
        <button
          onClick={toggleLike}
          disabled={likeLoading || !user}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
            liked
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={!user ? 'Login to like' : undefined}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likes}</span>
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [featuredShow, setFeaturedShow] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
      setFeaturedShow(trendingData.results?.[0]);

      const { data } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      setReviews(data || []);
    }
    fetchAll();

    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchSuggestions() {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const [enRes, arRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}&language=ar-SA`),
      ]);
      const [enData, arData] = await Promise.all([enRes.json(), arRes.json()]);
      const combined = [...(enData.results || []), ...(arData.results || [])];
      const unique = combined.filter((show, index, self) =>
        index === self.findIndex((s) => s.id === show.id)
      ).slice(0, 6);
      setSuggestions(unique);
      setShowSuggestions(true);
    }
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function searchShows() {
    if (!query) return;
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
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
    <div className="min-h-screen w-full bg-gray-950 text-white">

      {/* Hero Section */}
      {featuredShow && !searched && (
        <div className="relative h-96 mb-8">
          {featuredShow.backdrop_path && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${featuredShow.backdrop_path}`}
              alt={featuredShow.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-lg">
            <p className="text-yellow-400 text-xs uppercase tracking-widest mb-2">Trending Now</p>
            <h2 className="text-4xl font-bold text-white mb-2">{featuredShow.name}</h2>
            <p className="text-gray-300 text-sm line-clamp-2">{featuredShow.overview}</p>
            <Link href={`/show/${featuredShow.id}`} className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg text-sm transition">
              View Details
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto mb-12" ref={searchRef}>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchShows()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search any TV show in English or Arabic..."
              className="flex-1 p-4 rounded-xl bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm"
            />
            <button onClick={searchShows} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-4 rounded-xl font-bold text-sm transition">
              Search
            </button>
            {searched && (
              <button onClick={() => { setSearched(false); setQuery(''); setSuggestions([]); }} className="bg-gray-800 hover:bg-gray-700 px-4 py-4 rounded-xl text-sm transition">✕</button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-2 z-50 overflow-hidden shadow-2xl">
              {suggestions.map((show) => (
                <Link
                  key={show.id}
                  href={`/show/${show.id}`}
                  onClick={() => { setShowSuggestions(false); setQuery(''); }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-800 transition"
                >
                  {show.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w92${show.poster_path}`} alt={show.name} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center text-xs">📺</div>
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">{show.name}</p>
                    {show.original_name !== show.name && <p className="text-gray-400 text-xs">{show.original_name}</p>}
                    <p className="text-gray-400 text-xs">{show.first_air_date?.slice(0, 4)} · ⭐ {show.vote_average?.toFixed(1)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {loading && <p className="text-center text-gray-400 mb-8">Searching...</p>}

        {searched ? (
          <Row title="Search Results" shows={searchResults} />
        ) : (
          <>
            {reviews.length > 0 && (
              <div className="mb-12">
                <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Latest Community Reviews</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              </div>
            )}
            <Row title="Trending This Week" shows={trending} />
            <Row title="Most Viewed" shows={popular} />
            <Row title="Top Rated" shows={topRated} />
            <Row title="Latest Shows" shows={latest} />
          </>
        )}
      </div>
    </div>
  );
}