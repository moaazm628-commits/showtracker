'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, username } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  useEffect(() => {
    async function fetchSuggestions() {
      if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
      const [enRes, arRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}&language=ar`)
      ]);
      const [enData, arData] = await Promise.all([enRes.json(), arRes.json()]);
      const combined = [...(enData.results || []), ...(arData.results || [])];
      const unique = combined.filter((show, index, self) => index === self.findIndex((s) => s.id === show.id)).slice(0, 6);
      setSuggestions(unique);
      setShowSuggestions(true);
    }
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="text-2xl font-bold text-yellow-400 tracking-tight flex-shrink-0">
          🎬 WatchVerse
        </Link>

        <div className="flex-1 max-w-md mx-6 relative" ref={searchRef}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && suggestions[0]) router.push(`/show/${suggestions[0].id}`); }}
            placeholder="Search shows..."
            className="w-full px-4 py-1.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {suggestions.map((show) => (
                <Link key={show.id} href={`/show/${show.id}`} onClick={() => { setShowSuggestions(false); setQuery(''); }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition">
                  {show.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w92${show.poster_path}`} alt={show.name} className="w-8 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-8 h-12 bg-gray-700 rounded" />
                  )}
                  <div>
                    <p className="text-white text-sm font-bold">{show.name}</p>
                    <p className="text-gray-400 text-xs">{show.first_air_date?.slice(0, 4)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/profile" className="text-gray-300 text-sm hover:text-yellow-400 transition hidden md:block">
                👤 {username || user.email}
              </Link>
              <button onClick={logout} className="border border-gray-600 hover:border-yellow-500 text-gray-300 hover:text-yellow-400 px-4 py-2 rounded-lg text-sm transition">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => setShowModal(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-lg text-sm font-bold transition">
              Login / Sign Up
            </button>
          )}
        </div>
      </header>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}