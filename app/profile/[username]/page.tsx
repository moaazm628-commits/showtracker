'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

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
              <div key={r.id} className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <Link href={`/show/${r.show_id}`} className="font-bold text-white hover:text-yellow-400">{r.show_name}</Link>
                  <span className="text-yellow-400 font-bold">⭐ {r.rating}/10</span>
                </div>
                <p className="text-gray-300">{r.review}</p>
                <p className="text-gray-600 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
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