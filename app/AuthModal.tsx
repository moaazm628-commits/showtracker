'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('❌ ' + error.message);
      } else {
        setMessage('✅ Logged in!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage('❌ ' + error.message);
      } else if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username }]);
        if (profileError) {
          setMessage('❌ Username already taken!');
        } else {
          setMessage('✅ Account created! Welcome ' + username + '!');
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1500);
        }
      }
    }
    setLoading(false);
  }
  async function handleGoogleSignIn() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://thewatchverse.vercel.app'
    }
  });
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
          {isLogin ? '🔐 Login' : '✨ Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button onClick={handleGoogleSignIn} className="w-full mt-3 py-2 px-4 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100">Continue with Google</button>

        {message && <p className="text-center mt-4 text-white">{message}</p>}

        <p className="text-center text-gray-400 mt-4">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="text-blue-400 hover:text-white ml-2"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}