'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ReviewCard({ review, user, showName, onDelete }: { review: any; user: any; showName?: string; onDelete?: (id: number) => void }) {
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
        <div>
          <span className="font-bold text-white">{review.author}</span>
          {showName && review.show_name !== showName && (
            <span className="text-yellow-400 text-xs ml-2">{review.show_name.replace(showName + ' - ', '')}</span>
          )}
          {!showName && (
            <span className="text-yellow-400 text-xs ml-2">· {review.show_name}</span>
          )}
        </div>
        <span className="text-yellow-400 font-bold">⭐ {review.rating}/10</span>
      </div>
      <p className="text-gray-300">{review.review}</p>
      <div className="flex items-center justify-between mt-3">
        <p className="text-gray-600 text-xs">{new Date(review.created_at).toLocaleDateString()}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLike}
            disabled={likeLoading || !user}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition ${liked ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            👍 {likes}
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}