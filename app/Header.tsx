'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, username } = useAuth();
  const [showModal, setShowModal] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <>
      <header className="bg-black border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="text-2xl font-bold text-yellow-400 tracking-tight">
          🎬 🎬 WatchVerse
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/profile" className="text-gray-300 text-sm hover:text-yellow-400 transition hidden md:block">
                👤 {username || user.email}
              </Link>
              <button
                onClick={logout}
                className="border border-gray-600 hover:border-yellow-500 text-gray-300 hover:text-yellow-400 px-4 py-2 rounded-lg text-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-lg text-sm font-bold transition"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </header>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}