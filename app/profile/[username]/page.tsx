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
    <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <Link href={`/show/${review.show_id}`} className="font-bold text-white hover:text-yellow-400">{review.show_name}</Link>
        <span className="text-yellow-400 font-bold">⭐ {review.rating}/10</span>
      </div>
      <p className="text-gray-300">{review.review}</p>
      <div className="flex items-center justify-between mt-3">
        <p className="text-gray-600 text-xs">{new Date(review.created_at).toLocaleDateString()}</p>
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

export default function PublicProfile() {
  const { username } = useParams();
  const [reviews, setReviews] = useState<any[]>([]);
  const [watched, setWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    async function fetchData() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

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

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <Link href="/" className="text-yellow-400 hover:text-white mb-6 inline-block">← Back</Link>
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800 flex items-center gap-4">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-2xl font-bold text-black">
            {(username as string)?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{username}</h1>
            <p className="text-gray-400 text-sm">{reviews.length} reviews · {watched.length} watched</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button onClick={() => setActiveTab('reviews')} className={`pb-3 text-sm font-bold uppercase ${activeTab === 'reviews' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>Reviews ({reviews.length})</button>
          <button onClick={() => setActiveTab('watched')} className={`pb-3 text-sm font-bold uppercase ${activeTab === 'watched' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>Watched ({watched.length})</button>
        </div>

        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 && <p className="text-gray-400">No reviews yet.</p>}
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}

        {activeTab === 'watched' && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {watched.length === 0 && <p className="text-gray-400 col-span-6">No watched shows yet.</p>}
            {watched.map((w) => (
              <Link key={w.id} href={`/show/${w.show_id}`} className="group">
                {w.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w300${w.poster_path}`} alt={w.show_name} className="rounded-lg w-full" />
                ) : (
                  <div className="w-full h-36 bg-gray-800 rounded-lg" />
                )}
                <p className="text-xs mt-1 truncate text-gray-400">{w.show_name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}