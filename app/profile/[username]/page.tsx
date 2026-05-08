'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../AuthContext';

function ReviewCard({ review }: { review: any }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    async function checkLike() {
      if (!user) return;
      const { data } = await supabase
        .from('likes').select('id')
        .eq('user_id', user.id).eq('review_id', review.id).single();
      setLiked(!!data);
    }
    async function getLikes() {
      const { count } = await supabase
        .from('likes').select('*', { count: 'exact', head: true })
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
    <div className="group bg-gray-900/60 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 transition-all duration-300 hover:bg-gray-900">
      <div className="flex justify-between items-start mb-3">
        <Link href={`/show/${review.show_id}`} className="font-bold text-white hover:text-yellow-400 transition text-base leading-tight pr-4">
          {review.show_name}
        </Link>
        <div className="flex-shrink-0 flex items-center gap-1 bg-gray-800 px-2.5 py-1 rounded-lg">
          <span className="text-yellow-400 text-sm">⭐</span>
          <span className="text-yellow-400 font-black text-sm">{review.rating}</span>
          <span className="text-gray-600 text-xs">/10</span>
        </div>
      </div>

      {/* Rating bar */}
      <div className="flex gap-0.5 mb-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`h-0.5 flex-1 rounded-full ${i < review.rating ? 'bg-yellow-400' : 'bg-gray-700'}`} />
        ))}
      </div>

      <p className="text-gray-300 text-sm leading-relaxed">{review.review}</p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs">{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        <button
          onClick={toggleLike}
          disabled={likeLoading || !user}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            liked
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={!user ? 'Login to like' : undefined}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likes}</span>
        </button>
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
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
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <p className="text-5xl mb-4">🎬</p>
                <p className="text-lg font-light">No reviews yet</p>
              </div>
            ) : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
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