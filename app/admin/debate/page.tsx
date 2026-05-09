'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../AuthContext';

// Put your email here to restrict access
const ADMIN_EMAIL = 'moaazm628@gmail.com';

export default function AdminDebate() {
  const { user } = useAuth();
  const router = useRouter();
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sideA, setSideA] = useState('');
  const [sideB, setSideB] = useState('');

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      router.push('/');
    } else if (user) {
      fetchDebates();
    }
  }, [user]);

  async function fetchDebates() {
    const { data } = await supabase.from('debates').select('*').order('created_at', { ascending: false });
    setDebates(data || []);
    setLoading(false);
  }

  async function createDebate() {
    if (!title || !sideA || !sideB) { setMessage('Please fill in all required fields.'); return; }
    setSubmitting(true);
    // deactivate all others first
    await supabase.from('debates').update({ is_active: false }).eq('is_active', true);
    const { error } = await supabase.from('debates').insert([{ title, description, side_a: sideA, side_b: sideB, is_active: true }]);
    if (error) { setMessage('Error: ' + error.message); }
    else {
      setMessage('✅ Debate created and set as active!');
      setTitle(''); setDescription(''); setSideA(''); setSideB('');
      fetchDebates();
    }
    setSubmitting(false);
  }

  async function toggleActive(id: number, current: boolean) {
    if (!current) {
      await supabase.from('debates').update({ is_active: false }).eq('is_active', true);
    }
    await supabase.from('debates').update({ is_active: !current }).eq('id', id);
    fetchDebates();
  }

  async function deleteDebate(id: number) {
    await supabase.from('debates').delete().eq('id', id);
    setDebates((prev) => prev.filter((d) => d.id !== id));
  }

  if (!user || user.email !== ADMIN_EMAIL) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Access denied.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-yellow-400 text-xs tracking-widest uppercase mb-1">Admin Panel</p>
          <h1 className="text-3xl font-black">Debate of the Week</h1>
        </div>

        {/* Create Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-black mb-5 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Create New Debate</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest mb-1 block">Topic Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best Season of Breaking Bad?"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest mb-1 block">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Give some context..."
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-yellow-400 text-xs uppercase tracking-widest mb-1 block">Side A *</label>
                <input value={sideA} onChange={(e) => setSideA(e.target.value)} placeholder="e.g. Season 4"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-yellow-500/30 focus:outline-none focus:border-yellow-500 text-sm" />
              </div>
              <div>
                <label className="text-red-400 text-xs uppercase tracking-widest mb-1 block">Side B *</label>
                <input value={sideB} onChange={(e) => setSideB(e.target.value)} placeholder="e.g. Season 5"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-red-500/30 focus:outline-none focus:border-red-500 text-sm" />
              </div>
            </div>
            {message && <p className="text-yellow-400 text-sm">{message}</p>}
            <button onClick={createDebate} disabled={submitting}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black px-6 py-3 rounded-xl transition">
              {submitting ? 'Creating...' : '⚡ Create & Activate Debate'}
            </button>
          </div>
        </div>

        {/* Past Debates */}
        <h2 className="text-lg font-black mb-4 uppercase tracking-widest border-l-4 border-gray-600 pl-3">All Debates</h2>
        {loading ? <p className="text-gray-500">Loading...</p> : (
          <div className="space-y-3">
            {debates.map((d) => (
              <div key={d.id} className={`flex items-center justify-between bg-gray-900 border rounded-xl px-5 py-4 ${d.is_active ? 'border-yellow-500/40' : 'border-gray-800'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {d.is_active && <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full">ACTIVE</span>}
                    <p className="font-bold text-white text-sm">{d.title}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{d.side_a} vs {d.side_b}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(d.id, d.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${d.is_active ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}>
                    {d.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteDebate(d.id)} className="text-red-500 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}