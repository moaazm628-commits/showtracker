'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { user, username } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('author', username)
        .order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    }
    fetchReviews();
  }, [user, username]);

  if (!user) return (
    <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-4">Please login to view your profile</p>
        <Link href="/" className="text-blue-400 hover:text-white">← Go Home</Link>
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            👤
          </div>
          <h1 className="text-3xl font-bold text-blue-400">{username}</h1>
          <p className="text-gray-400 mt-1">{user.email}</p>
          <p className="text-gray-400 mt-2">📝 {reviews.length} Reviews</p>
        </div>

        <h2 className="text-xl font-bold text-blue-400 mb-4">My Reviews</h2>

        {reviews.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p className="text-xl mb-4">No reviews yet!</p>
            <Link href="/" className="text-blue-400 hover:text-white">Find a show to review →</Link>
          </div>
        )}

        {reviews.map((r) => (
          <div key={r.id} className="bg-gray-800 rounded-xl p-5 mb-4">
            <div className="flex justify-between items-center mb-2">
              <Link href={`/show/${r.show_id}`} className="font-bold text-blue-400 hover:text-white text-lg">
                {r.show_name}
              </Link>
              <span className="text-yellow-400 font-bold">⭐ {r.rating}/10</span>
            </div>
            <p className="text-gray-300">{r.review}</p>
            <p className="text-gray-500 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}