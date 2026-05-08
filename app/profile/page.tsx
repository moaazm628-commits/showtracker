'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

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

  if (!user) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-4">Please login to view your profile</p>
        <Link href="/" className="text-yellow-400 hover:text-white">← Go Home</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const recentActivity = [
    ...reviews.slice(0, 3).map(r => ({ type: 'review', text: `Reviewed ${r.show_name}`, date: r.created_at })),
    ...watched.slice(0, 3).map(w => ({ type: 'watched', text: `Watched ${w.show_name}`, date: w.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const genreCounts: Record<string, number> = {};
  reviews.forEach(r => {
    if (r.genres) r.genres.forEach((g: string) => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-yellow-600 via-yellow-500 to-gray-900 relative">
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-10">
        {/* Profile Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 -mt-10 relative">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center text-3xl font-bold text-black border-4 border-gray-900">
              {username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{username}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <p className="text-2xl font-bold text-yellow-400">{reviews.length}</p>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Reviews</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <p className="text-2xl font-bold text-yellow-400">{watched.length}</p>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Watched</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <p className="text-2xl font-bold text-yellow-400">{avgRating}</p>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Avg Rating</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-4 mb-5 border-b border-gray-800">
              <button onClick={() => setActiveTab('reviews')} className={`pb-3 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'reviews' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
                Reviews ({reviews.length})
              </button>
              <button onClick={() => setActiveTab('watched')} className={`pb-3 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'watched' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
                Watched ({watched.length})
              </button>
            </div>

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 && <p className="text-gray-400">No reviews yet! <Link href="/" className="text-yellow-400">Find a show →</Link></p>}
                {reviews.map((r) => (
                  <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <Link href={`/show/${r.show_id}`} className="font-bold text-yellow-400 hover:text-white">{r.show_name}</Link>
                      <span className="text-yellow-400 font-bold">⭐ {r.rating}/10</span>
                    </div>
                    <p className="text-gray-300 text-sm">{r.review}</p>
                    <p className="text-gray-600 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p><button
                  onClick={async () => {
                    await supabase.from('reviews').delete().eq('id', r.id);
                    setReviews(reviews.filter((rev) => rev.id !== r.id));
                  }}
                  className="text-red-500 hover:text-red-400 text-xs mt-2"
                >
                  🗑️ Delete Review
                </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'watched' && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {watched.length === 0 && <p className="text-gray-400 col-span-5">No watched shows yet!</p>}
                {watched.map((w) => (
                  <Link key={w.id} href={`/show/${w.show_id}`} className="group">
                    {w.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="w-full rounded-lg group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-36 bg-gray-800 rounded-lg" />
                    )}
                    <p className="text-xs mt-1 truncate text-gray-400">{w.show_name}</p>
                    {w.rating && <p className="text-yellow-400 text-xs">⭐ {w.rating}/10</p>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            {topGenres.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Top Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {topGenres.map(g => (
                    <span key={g} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">{g}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Recent Activity</h3>
              {recentActivity.length === 0 && <p className="text-gray-600 text-xs">No activity yet</p>}
              {recentActivity.map((a, i) => (
                <p key={i} className="text-gray-400 text-xs mb-2">• {a.text}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}