'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';
import ReviewCard from '../ReviewCard';

export default function Profile() {
  const { user, username } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [watched, setWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'watched'>('reviews');

  useEffect(() => {
    async function fetchData() {
      if (!user) { setLoading(false); return; }
      const [reviewsRes, watchedRes] = await Promise.all([
        supabase.from('reviews').select('*').eq('author', username).order('created_at', { ascending: false }),
        supabase.from('watched').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      setReviews(reviewsRes.data || []);
      setWatched(watchedRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [user, username]);

  async function handleDelete(id: number) {
    await supabase.from('reviews').delete().eq('id', id);
    setReviews(reviews.filter((r) => r.id !== id));
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-2xl font-light tracking-widest text-gray-300">You're not logged in</p>
        <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm tracking-widest uppercase">← Return Home</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Cinematic Header */}
      <div className="relative overflow-hidden">
        {/* Ambient glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-yellow-400/5 rounded-full blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl font-black text-black shadow-2xl shadow-yellow-500/20">
                {username?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-950" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-yellow-400 text-xs tracking-[0.3em] uppercase mb-1">Member Profile</p>
              <h1 className="text-4xl font-black tracking-tight text-white">{username}</h1>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{reviews.length}</p>
                <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Reviews</p>
              </div>
              <div className="w-px bg-gray-800" />
              <div className="text-center">
                <p className="text-3xl font-black text-white">{watched.length}</p>
                <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Watched</p>
              </div>
              {avgRating && (
                <>
                  <div className="w-px bg-gray-800" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-yellow-400">⭐ {avgRating}</p>
                    <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Avg Rating</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Watched Strip */}
      {watched.length > 0 && (
        <div className="border-t border-gray-800/60 bg-gray-900/30">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <p className="text-gray-500 text-xs tracking-[0.25em] uppercase mb-4">Recently Watched</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {watched.slice(0, 12).map((w) => (
                <Link key={w.id} href={`/show/${w.show_id}`} className="flex-shrink-0 w-20 group">
                  {w.poster_path ? (
                    <div className="relative overflow-hidden rounded-lg">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${w.poster_path}`}
                        alt={w.show_name}
                        className="w-full rounded-lg group-hover:scale-105 transition duration-300"
                      />
                      {w.rating && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                          <span className="text-yellow-400 text-xs font-bold">⭐{w.rating}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-28 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500 text-center p-1">{w.show_name}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Tab Bar */}
        <div className="flex gap-1 mb-8 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {(['reviews', 'watched'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === tab
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'reviews' ? `Reviews (${reviews.length})` : `Watched (${watched.length})`}
            </button>
          ))}
        </div>

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <p className="text-5xl mb-4">🎬</p>
                <p className="text-lg font-light">No reviews yet</p>
                <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm mt-3 inline-block">Find something to review →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} user={user} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Watched Tab */}
        {activeTab === 'watched' && (
          <div>
            {watched.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <p className="text-5xl mb-4">📺</p>
                <p className="text-lg font-light">Nothing watched yet</p>
                <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm mt-3 inline-block">Discover shows →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                {watched.map((w) => (
                  <Link key={w.id} href={`/show/${w.show_id}`} className="group">
                    <div className="relative overflow-hidden rounded-lg">
                      {w.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="w-full rounded-lg group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-28 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500 text-center p-1">{w.show_name}</div>
                      )}
                      {w.rating && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-yellow-400 text-xs px-1 rounded font-bold">
                          {w.rating}
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-1 truncate text-gray-500 group-hover:text-gray-300 transition">{w.show_name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}