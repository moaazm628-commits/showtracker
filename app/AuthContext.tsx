'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

 async function fetchUsername(userId: string, userMeta?: any) {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();
  
  if (data?.username) {
    setUsername(data.username);
  } else if (userMeta?.full_name || userMeta?.email) {
    const newUsername = userMeta.full_name?.replace(/\s+/g, '') || userMeta.email.split('@')[0];
    await supabase.from('profiles').insert([{ id: userId, username: newUsername }]);
    setUsername(newUsername);
  } else {
    setUsername(null);
  }
}

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id, session.user.user_metadata);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
     if (session?.user) fetchUsername(session.user.id, session.user.user_metadata);
      else setUsername(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, username, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}