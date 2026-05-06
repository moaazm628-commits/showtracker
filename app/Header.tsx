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
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="text-2xl font-bold text-blue-400">📺 ShowTracker</Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-300 text-sm hidden md:block">👤 {username || user.email}</span>
              <button
                onClick={logout}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold"
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