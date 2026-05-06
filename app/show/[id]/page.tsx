'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../AuthContext';

export default function ShowDetail() {
  const { id } = useParams();
  const { user, username } = useAuth();
  const [show, setShow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchShow() {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=credits`
      );
      const data = await res.json();
      setShow(data);
      setLoading(false);
    }

    async function fetchReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('show_id', id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    }

    fetchShow();
    fetchReviews();
  }, [id]);

  async function submitReview(e: any) {
    e.preventDefault();
    if (!user) {
      setMessage('❌ Please login to submit a review!');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert([{
      show_id: Number(id),
      show_name: show?.name,
      rating,
      review,
      author: username || user.email
    }]);
    if (error) {
      setMessage('❌ Something went wrong!');
    } else {
      setMessage('✅ Review submitted!');
      setRating(5);
      setReview('');
      const { data } = await supabase.from('reviews').select('*').eq('show_id', id).order('created_at', { ascending: false });
      setReviews(data || []);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;
  if (!show) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Show not found</div>;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="relative">
        {show.backdrop_path && (
          <img src={`https://image.tmdb.org/t/p/w1280${show.backdrop_path}`} alt={show.name} className="w-full h-64 object-cover opacity-30" />
        )}
        <div className="absolute top-4 left-4">
          <Link href="/" className="text-blue-400 hover:text-white">← Back</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-10 relative">
        <div className="flex gap-6">
          {show.poster_path && (
            <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} alt={show.name} className="w-40 rounded-xl shadow-lg flex-shrink-0" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-blue-400">{show.name}</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-300">
              <span>⭐ {show.vote_average?.toFixed(1)}/10</span>
              <span>📅 {show.first_air_date?.slice(0, 4)}</span>
              <span>🎬 {show.number_of_seasons} Seasons</span>
              <span>📺 {show.number_of_episodes} Episodes</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {show.genres?.map((g: any) => (
                <span key={g.id} className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">{g.name}</span>
              ))}
            </div>
            <p className="mt-4 text-gray-300 leading-relaxed">{show.overview}</p>
          </div>
        </div>

        {/* Review Form */}
        <div className="mt-10 bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-4">✍️ Write a Review</h2>
          {!user ? (
            <p className="text-gray-400">Please <span className="text-blue-400">login</span> to write a review!</p>
          ) : (
            <form onSubmit={submitReview} className="flex flex-col gap-4">
              <p className="text-gray-400 text-sm">Reviewing as <span className="text-blue-400 font-bold">{username || user.email}</span></p>
              <div className="flex items-center gap-3">
                <label className="text-gray-300">Rating:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-20 p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                />
                <span className="text-yellow-400">⭐ /10</span>
              </div>
              <textarea
                placeholder="Write your review..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                required
                rows={4}
                className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              {message && <p className="text-white">{message}</p>}
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4">💬 Community Reviews</h2>
          {reviews.length === 0 && <p className="text-gray-400">No reviews yet. Be the first!</p>}
          {reviews.map((r) => (
            <div key={r.id} className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{r.author}</span>
                <span className="text-yellow-400">⭐ {r.rating}/10</span>
              </div>
              <p className="text-gray-300">{r.review}</p>
              <p className="text-gray-500 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}