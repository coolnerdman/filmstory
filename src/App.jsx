import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import FilmLog from './pages/FilmLog';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 현재 세션 확인 (이미 로그인 되어있는지?)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. 로그인 상태 변경 감지 (로그아웃 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 로그인 안 했으면 -> 로그인 화면만 보여줌 (나머지 접근 불가!)
  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // 로그인 했으면 -> 앱 화면 진입!
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<FilmLog />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="settings" element={
            <div className="p-4 text-center">
              <h2 className="text-xl font-bold mb-4">설정</h2>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-md transition"
              >
                로그아웃
              </button>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
