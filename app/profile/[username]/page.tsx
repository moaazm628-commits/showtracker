'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../AuthContext';
import ReviewCard from '../../ReviewCard';

export default function PublicProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [watched, setWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    async function fetchData() {
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('username', username).single();
      if (!profile) { setLoading(false); return; }
      const [reviewsRes, watchedRes] = await Promise.all([
        supabase.from('reviews').select('*').eq('author', username).order('created_at', { ascending: false }),
        supabase.from('watched').select('*').eq('user_id', profile.id)
      ]);
      setReviews(reviewsRes.data || []);
      setWatched(watchedRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [username]);

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
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/8 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 pt-10 pb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-yellow-400 transition text-sm mb-8 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-black text-black shadow-2xl shadow-yellow-500/20">
                {(username as string)?.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-yellow-400 text-xs tracking-[0.3em] uppercase mb-1">Community Member</p>
              <h1 className="text-3xl font-black tracking-tight">{username}</h1>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{reviews.length}</p>
                <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Reviews</p>
              </div>
              <div className="w-px bg-gray-800" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{watched.length}</p>
                <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Watched</p>
              </div>
              {avgRating && (
                <>
                  <div className="w-px bg-gray-800" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-yellow-400">⭐ {avgRating}</p>
                    <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Avg</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Watched Strip */}
      {watched.length > 0 && (
        <div className="border-t border-gray-800/60 bg-gray-900/20">
          <div className="max-w-4xl mx-auto px-6 py-5">
            <p className="text-gray-600 text-xs tracking-[0.25em] uppercase mb-3">Watched</p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {watched.slice(0, 14).map((w) => (
                <Link key={w.id} href={`/show/${w.show_id}`} className="flex-shrink-0 w-16 group">
                  {w.poster_path ? (
                    <div className="relative overflow-hidden rounded-md">
                      <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="w-full rounded-md group-hover:scale-105 transition duration-300" />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-600 text-center p-1">{w.show_name}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-8 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {['reviews', 'watched'].map((tab) => (
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

        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <p className="text-5xl mb-4">🎬</p>
                <p className="text-lg font-light">No reviews yet</p>
              </div>
            ) : reviews.map((r) => (
              <ReviewCard key={r.id} review={r} user={user} />
            ))}
          </div>
        )}

        {activeTab === 'watched' && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {watched.length === 0 ? (
              <p className="text-gray-600 col-span-7 text-center py-20">Nothing watched yet.</p>
            ) : watched.map((w) => (
              <Link key={w.id} href={`/show/${w.show_id}`} className="group">
                <div className="relative overflow-hidden rounded-lg">
                  {w.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="w-full rounded-lg group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-28 bg-gray-800 rounded-lg" />
                  )}
                </div>
                <p className="text-xs mt-1 truncate text-gray-600 group-hover:text-gray-300 transition">{w.show_name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}