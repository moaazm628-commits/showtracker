'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function DebatePage() {
  const { user, username } = useAuth();
  const [debate, setDebate] = useState<any>(null);
  const [votes, setVotes] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [userVote, setUserVote] = useState<'a' | 'b' | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSide, setCommentSide] = useState<'a' | 'b' | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDebate(); }, [user]);

  async function fetchDebate() {
    const { data } = await supabase
      .from('debates').select('*').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).single();

    if (!data) { setLoading(false); return; }
    setDebate(data);

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('debate_votes').select('side').eq('debate_id', data.id),
      supabase.from('debate_comments').select('*').eq('debate_id', data.id).order('created_at', { ascending: true }),
    ]);

    const voteData = votesRes.data || [];
    setVotes({ a: voteData.filter((v) => v.side === 'a').length, b: voteData.filter((v) => v.side === 'b').length });
    setComments(commentsRes.data || []);

    if (user) {
      const { data: myVote } = await supabase.from('debate_votes').select('side')
        .eq('debate_id', data.id).eq('user_id', user.id).single();
      if (myVote) setUserVote(myVote.side as 'a' | 'b');
    }
    setLoading(false);
  }

  async function castVote(side: 'a' | 'b') {
    if (!user || voteLoading) return;
    setVoteLoading(true);
    if (userVote === side) {
      await supabase.from('debate_votes').delete().eq('debate_id', debate.id).eq('user_id', user.id);
      setVotes((v) => ({ ...v, [side]: v[side] - 1 }));
      setUserVote(null);
    } else if (userVote) {
      await supabase.from('debate_votes').delete().eq('debate_id', debate.id).eq('user_id', user.id);
      await supabase.from('debate_votes').insert([{ debate_id: debate.id, user_id: user.id, side }]);
      setVotes((v) => ({ ...v, [userVote]: v[userVote] - 1, [side]: v[side] + 1 }));
      setUserVote(side);
    } else {
      await supabase.from('debate_votes').insert([{ debate_id: debate.id, user_id: user.id, side }]);
      setVotes((v) => ({ ...v, [side]: v[side] + 1 }));
      setUserVote(side);
    }
    setVoteLoading(false);
  }

  async function submitComment() {
    if (!user || !newComment.trim()) return;
    setCommentLoading(true);
    const { data, error } = await supabase.from('debate_comments')
      .insert([{ debate_id: debate.id, user_id: user.id, author: username || user.email, content: newComment.trim(), side: commentSide }])
      .select().single();
    if (!error && data) { setComments((prev) => [...prev, data]); setNewComment(''); }
    setCommentLoading(false);
  }

  async function deleteComment(id: number) {
    await supabase.from('debate_comments').delete().eq('id', id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const total = votes.a + votes.b;
  const pctA = total ? Math.round((votes.a / total) * 100) : 50;
  const pctB = 100 - pctA;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
    </div>
  );

  if (!debate) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center flex-col gap-4">
      <p className="text-2xl font-light text-gray-400">No active debate this week</p>
      <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm">← Back to Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-red-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-48 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-64 h-48 bg-red-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-yellow-400 transition text-sm mb-8 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
          </Link>
          <div className="inline-block bg-yellow-500 text-black text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase mb-4">⚡ Debate of the Week</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">{debate.title}</h1>
          {debate.description && <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">{debate.description}</p>}
          <p className="text-gray-600 text-xs mt-4 tracking-widest uppercase">{total} votes · {comments.length} arguments</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* VS Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button onClick={() => castVote('a')} disabled={!user || voteLoading}
            className={`relative rounded-2xl p-6 border-2 transition-all duration-300 text-left ${userVote === 'a' ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/10' : 'border-gray-700 bg-gray-900 hover:border-yellow-500/50 hover:bg-gray-800'} disabled:cursor-not-allowed`}>
            {userVote === 'a' && <div className="absolute top-3 right-3 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"><span className="text-black text-xs font-black">✓</span></div>}
            <p className="text-yellow-400 text-xs font-black tracking-widest uppercase mb-2">Side A</p>
            <p className="text-white font-black text-xl leading-tight">{debate.side_a}</p>
            <p className="text-gray-400 text-sm mt-3 font-semibold">{votes.a} votes</p>
          </button>
          <button onClick={() => castVote('b')} disabled={!user || voteLoading}
            className={`relative rounded-2xl p-6 border-2 transition-all duration-300 text-left ${userVote === 'b' ? 'border-red-400 bg-red-500/10 shadow-lg shadow-red-500/10' : 'border-gray-700 bg-gray-900 hover:border-red-500/50 hover:bg-gray-800'} disabled:cursor-not-allowed`}>
            {userVote === 'b' && <div className="absolute top-3 right-3 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center"><span className="text-black text-xs font-black">✓</span></div>}
            <p className="text-red-400 text-xs font-black tracking-widest uppercase mb-2">Side B</p>
            <p className="text-white font-black text-xl leading-tight">{debate.side_b}</p>
            <p className="text-gray-400 text-sm mt-3 font-semibold">{votes.b} votes</p>
          </button>
        </div>

        {/* Vote bar */}
        <div className="mb-2 flex justify-between text-xs font-black">
          <span className="text-yellow-400">{pctA}%</span>
          <span className="text-red-400">{pctB}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-800 overflow-hidden mb-2 flex">
          <div className="bg-yellow-400 h-full transition-all duration-700 rounded-l-full" style={{ width: `${pctA}%` }} />
          <div className="bg-red-400 h-full transition-all duration-700 rounded-r-full" style={{ width: `${pctB}%` }} />
        </div>
        {!user && <p className="text-gray-600 text-xs text-center mt-2">Login to cast your vote</p>}

        {/* Comments */}
        <div className="mt-10">
          <h2 className="text-lg font-black tracking-widest uppercase border-l-4 border-yellow-500 pl-3 mb-6">Arguments ({comments.length})</h2>
          <div className="space-y-3 mb-6">
            {comments.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No arguments yet — make the first case!</p>}
            {comments.map((c) => (
              <div key={c.id} className="group flex gap-3 items-start">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${c.side === 'a' ? 'bg-yellow-500 text-black' : c.side === 'b' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {c.author?.charAt(0).toUpperCase()}
                </div>
                <div className={`flex-1 rounded-xl px-4 py-3 border ${c.side === 'a' ? 'bg-yellow-500/5 border-yellow-500/20' : c.side === 'b' ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-900 border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yellow-400">{c.author}</span>
                      {c.side && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.side === 'a' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {c.side === 'a' ? `Team A` : `Team B`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                      {user && user.id === c.user_id && (
                        <button onClick={() => deleteComment(c.id)} className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          {user ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-gray-500 text-xs tracking-widest uppercase mb-3">Make your argument</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setCommentSide(commentSide === 'a' ? null : 'a')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${commentSide === 'a' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  Team A: {debate.side_a.split(' ').slice(0, 3).join(' ')}
                </button>
                <button onClick={() => setCommentSide(commentSide === 'b' ? null : 'b')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${commentSide === 'b' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  Team B: {debate.side_b.split(' ').slice(0, 3).join(' ')}
                </button>
                <span className="text-gray-700 text-xs self-center">(optional)</span>
              </div>
              <div className="flex gap-2">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="State your case..."
                  className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-yellow-500 placeholder-gray-600" />
                <button onClick={submitComment} disabled={commentLoading || !newComment.trim()}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-black text-sm px-5 py-3 rounded-xl transition">
                  Post
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm text-center py-4">Login to join the debate</p>
          )}
        </div>
      </div>
    </div>
  );
}