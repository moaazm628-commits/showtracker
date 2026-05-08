'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ReviewCard({ review, user, showName, onDelete }: { review: any; user: any; showName?: string; onDelete?: (id: number) => void }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

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

    async function getCommentCount() {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id);
      setCommentCount(count || 0);
    }

    checkLike();
    getLikes();
    getCommentCount();
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

  async function fetchComments() {
    if (commentsFetched) return;
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('review_id', review.id)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setCommentsFetched(true);
  }

  async function toggleComments() {
    if (!showComments) await fetchComments();
    setShowComments((v) => !v);
  }

  async function submitComment() {
    if (!user || !newComment.trim()) return;
    setCommentLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .insert([{ review_id: review.id, user_id: user.id, author: user.user_metadata?.username || user.email, content: newComment.trim() }])
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setCommentCount((c) => c + 1);
      setNewComment('');
    }
    setCommentLoading(false);
  }

  async function deleteComment(commentId: number) {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((c) => c - 1);
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
      {/* Review Header */}
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

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-gray-600 text-xs">{new Date(review.created_at).toLocaleDateString()}</p>
        <div className="flex items-center gap-2">
          {/* Like */}
          <button
            onClick={toggleLike}
            disabled={likeLoading || !user}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition ${liked ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            👍 {likes}
          </button>

          {/* Comment toggle */}
          <button
            onClick={toggleComments}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition ${showComments ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            💬 {commentCount}
          </button>

          {/* Delete review */}
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

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          {/* Comment List */}
          <div className="space-y-3 mb-4">
            {comments.length === 0 && (
              <p className="text-gray-600 text-xs text-center py-2">No comments yet. Be the first!</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2 group">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xs font-bold flex-shrink-0 mt-0.5">
                  {c.author?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-yellow-400">{c.author}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                      {user && user.id === c.user_id && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          {user ? (
            <div className="flex gap-2 items-center">
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                {(user.user_metadata?.username || user.email)?.charAt(0).toUpperCase()}
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-500 placeholder-gray-600"
              />
              <button
                onClick={submitComment}
                disabled={commentLoading || !newComment.trim()}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black text-xs font-bold px-3 py-2 rounded-lg transition"
              >
                Post
              </button>
            </div>
          ) : (
            <p className="text-gray-600 text-xs text-center">Login to comment</p>
          )}
        </div>
      )}
    </div>
  );
}