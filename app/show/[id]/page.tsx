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
  const [selectedSeason, setSelectedSeason] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [reviewType, setReviewType] = useState<'show' | 'season' | 'episode'>('show');
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [watched, setWatched] = useState(false);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [watchedRating, setWatchedRating] = useState(5);

  useEffect(() => {
    async function fetchShow() {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=credits,videos`
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

    async function checkWatched() {
      if (!user) return;
      const { data } = await supabase
        .from('watched')
        .select('id, rating')
        .eq('user_id', user.id)
        .eq('show_id', id)
        .single();
      if (data) {
        setWatched(true);
        setWatchedRating(data.rating || 5);
      }
    }

    fetchShow();
    fetchReviews();
    checkWatched();
  }, [id, user]);

  async function toggleWatched() {
    if (!user) {
      setMessage('Please login to mark as watched!');
      return;
    }
    if (watched) {
      setWatchedLoading(true);
      await supabase
        .from('watched')
        .delete()
        .eq('user_id', user.id)
        .eq('show_id', id);
      setWatched(false);
      setWatchedLoading(false);
    } else {
      setShowRatingPopup(true);
    }
  }

  async function confirmWatched() {
    setWatchedLoading(true);
    await supabase.from('watched').insert([{
      user_id: user.id,
      show_id: Number(id),
      show_name: show?.name,
      poster_path: show?.poster_path,
      rating: watchedRating
    }]);
    setWatched(true);
    setShowRatingPopup(false);
    setWatchedLoading(false);
  }

  async function fetchEpisodes(seasonNumber: number) {
    setLoadingEpisodes(true);
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
    );
    const data = await res.json();
    setEpisodes(data.episodes || []);
    setLoadingEpisodes(false);
  }

  async function submitReview(e: any) {
    e.preventDefault();
    if (!user) {
      setMessage('Please login to submit a review!');
      return;
    }
    setSubmitting(true);

    let reviewTitle = show?.name;
    if (reviewType === 'season' && selectedSeason) {
      reviewTitle = `${show?.name} - Season ${selectedSeason.season_number}`;
    } else if (reviewType === 'episode' && selectedEpisode) {
      reviewTitle = `${show?.name} - S${selectedSeason?.season_number}E${selectedEpisode.episode_number}: ${selectedEpisode.name}`;
    }

    const { error } = await supabase.from('reviews').insert([{
      show_id: Number(id),
      show_name: reviewTitle,
      rating,
      review,
      author: username || user.email
    }]);

    if (error) {
      setMessage('Something went wrong!');
    } else {
      setMessage('Review submitted!');
      setRating(5);
      setReview('');
      const { data } = await supabase.from('reviews').select('*').eq('show_id', id).order('created_at', { ascending: false });
      setReviews(data || []);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;
  if (!show) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Show not found</div>;

  const trailer = show.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white">
      <div className="relative">
        {show.backdrop_path && (
          <img src={`https://image.tmdb.org/t/p/w1280${show.backdrop_path}`} alt={show.name} className="w-full h-72 object-cover opacity-30" />
        )}
        <div className="absolute top-4 left-4">
          <Link href="/" className="text-yellow-400 hover:text-white">← Back</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 -mt-10 relative">
        <div className="flex gap-6 mb-8">
          {show.poster_path && (
            <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} alt={show.name} className="w-40 rounded-xl shadow-lg flex-shrink-0" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{show.name}</h1>
            {show.original_name !== show.name && (
              <p className="text-gray-400 text-sm">{show.original_name}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-gray-300 flex-wrap">
              <span className="text-yellow-400 font-bold">⭐ {show.vote_average?.toFixed(1)}/10</span>
              <span>{show.first_air_date?.slice(0, 4)}</span>
              <span>{show.number_of_seasons} Seasons</span>
              <span>{show.number_of_episodes} Episodes</span>
              {show.origin_country && <span>🌍 {show.origin_country.join(', ')}</span>}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {show.genres?.map((g: any) => (
                <span key={g.id} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">{g.name}</span>
              ))}
            </div>
            <p className="mt-4 text-gray-300 leading-relaxed text-sm">{show.overview}</p>

            <div className="flex gap-3 mt-4 flex-wrap items-center">
              {trailer && (
                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold transition">
                  ▶ Watch Trailer
                </a>
              )}
              <button
                onClick={toggleWatched}
                disabled={watchedLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${watched ? 'bg-green-700 hover:bg-red-700' : 'bg-gray-700 hover:bg-green-700'}`}
              >
                {watchedLoading ? '...' : watched ? `✅ Watched · ${watchedRating}/10` : '+ Mark as Watched'}
              </button>
            </div>
            {message && !submitting && <p className="text-yellow-400 text-sm mt-2">{message}</p>}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Seasons</h2>
          <div className="flex gap-3 flex-wrap">
            {show.seasons?.filter((s: any) => s.season_number > 0).map((season: any) => (
              <button
                key={season.id}
                onClick={() => {
                  setSelectedSeason(season);
                  setSelectedEpisode(null);
                  fetchEpisodes(season.season_number);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${selectedSeason?.id === season.id ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Season {season.season_number} ({season.episode_count} eps)
              </button>
            ))}
          </div>
        </div>

        {selectedSeason && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Season {selectedSeason.season_number} Episodes</h2>
            {loadingEpisodes ? (
              <p className="text-gray-400">Loading episodes...</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-2">
                {episodes.map((ep: any) => (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEpisode(ep)}
                    className={`flex items-center gap-3 p-3 rounded-lg text-left transition ${selectedEpisode?.id === ep.id ? 'bg-yellow-900 border border-yellow-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    {ep.still_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${ep.still_path}`} alt={ep.name} className="w-24 h-14 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-24 h-14 bg-gray-700 rounded flex items-center justify-center flex-shrink-0 text-xs text-gray-400">No Image</div>
                    )}
                    <div>
                      <p className="font-bold text-sm">E{ep.episode_number}: {ep.name}</p>
                      <p className="text-gray-400 text-xs">{ep.air_date}</p>
                      {ep.vote_average > 0 && <p className="text-yellow-400 text-xs">⭐ {ep.vote_average?.toFixed(1)}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Write a Review</h2>
          {!user ? (
            <p className="text-gray-400">Please login to write a review!</p>
          ) : (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <button onClick={() => setReviewType('show')} className={`px-4 py-2 rounded-lg text-sm font-bold ${reviewType === 'show' ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  Review Show
                </button>
                {selectedSeason && (
                  <button onClick={() => setReviewType('season')} className={`px-4 py-2 rounded-lg text-sm font-bold ${reviewType === 'season' ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Review Season {selectedSeason.season_number}
                  </button>
                )}
                {selectedEpisode && (
                  <button onClick={() => setReviewType('episode')} className={`px-4 py-2 rounded-lg text-sm font-bold ${reviewType === 'episode' ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Review Episode {selectedEpisode.episode_number}
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Reviewing as <span className="text-yellow-400 font-bold">{username || user.email}</span>
                {reviewType === 'season' && selectedSeason && ` · Season ${selectedSeason.season_number}`}
                {reviewType === 'episode' && selectedEpisode && ` · E${selectedEpisode.episode_number}: ${selectedEpisode.name}`}
              </p>
              <form onSubmit={submitReview} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-gray-300">Rating:</label>
                  <input type="number" min="1" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-20 p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
                  <span className="text-yellow-400">⭐ /10</span>
                </div>
                <textarea placeholder="Write your review..." value={review} onChange={(e) => setReview(e.target.value)} required rows={4} className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-yellow-500" />
                <button type="submit" disabled={submitting} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {message && <p className="text-white mt-2">{message}</p>}
              </form>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-100 mb-4 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">All Reviews</h2>
          {reviews.length === 0 && <p className="text-gray-400">No reviews yet. Be the first!</p>}
          {reviews.map((r) => (
            <div key={r.id} className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-bold text-white">{r.author}</span>
                  {r.show_name !== show.name && (
                    <span className="text-yellow-400 text-xs ml-2">{r.show_name.replace(show.name + ' - ', '')}</span>
                  )}
                </div>
                <span className="text-yellow-400 font-bold">⭐ {r.rating}/10</span>
              </div>
              <p className="text-gray-300">{r.review}</p>
              <p className="text-gray-600 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Popup */}
      {showRatingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-2">Rate this show</h2>
            <p className="text-gray-400 text-sm mb-6">{show?.name}</p>
            <div className="flex items-center gap-3 mb-6">
              <label className="text-gray-300">Your Rating:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={watchedRating}
                onChange={(e) => setWatchedRating(Number(e.target.value))}
                className="w-20 p-2 rounded-lg bg-gray-800 text-white border border-gray-700 text-center text-xl font-bold"
              />
              <span className="text-yellow-400 text-xl">⭐ /10</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmWatched}
                disabled={watchedLoading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold transition"
              >
                {watchedLoading ? '...' : 'Confirm Watched'}
              </button>
              <button
                onClick={() => setShowRatingPopup(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}