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
      if (!user) {
        setLoading(false);
        return;
      }

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
    <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-4">Please login to view your profile</p>
        <Link href="/" className="text-yellow-400 hover:text-white">← Go Home</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto p-6">

        {/* Profile Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center text-3xl font-bold text-black">
              {username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{username}</h1>
              <p className="text-gray-400 mt-1">{user.email}</p>
              <div className="flex gap-6 mt-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{reviews.length}</p>
                  <p className="text-gray-400 text-xs">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{watched.length}</p>
                  <p className="text-gray-400 text-xs">Watched</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Watched */}
        {watched.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Recently Watched</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {watched.slice(0, 10).map((w) => (
                <Link key={w.id} href={`/show/${w.show_id}`} className="flex-shrink-0 w-32 group">
                  {w.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="w-full rounded-lg group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400 text-center p-2">{w.show_name}</div>
                  )}
                  <p className="text-xs mt-1 truncate text-gray-300">{w.show_name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'reviews' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            My Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'watched' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            All Watched ({watched.length})
          </button>
        </div>

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-xl mb-4">No reviews yet!</p>
                <Link href="/" className="text-yellow-400 hover:text-white">Find a show to review →</Link>
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Link href={`/show/${r.show_id}`} className="font-bold text-yellow-400 hover:text-white text-lg">
                    {r.show_name}
                  </Link>
                  <span className="text-yellow-400 font-bold">⭐ {r.rating}/10</span>
                </div>
                <p className="text-gray-300">{r.review}</p>
                <p className="text-gray-600 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Watched Tab */}
        {activeTab === 'watched' && (
          <div>
            {watched.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-xl mb-4">No watched shows yet!</p>
                <Link href="/" className="text-yellow-400 hover:text-white">Discover shows →</Link>
              </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {watched.map((w) => (
                <Link key={w.id} href={`/show/${w.show_id}`} className="group">
                  {w.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="w-full rounded-lg group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-36 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400 text-center p-2">{w.show_name}</div>
                  )}
                  <p className="text-xs mt-1 truncate text-gray-300">{w.show_name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}