import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Inventory from './pages/Inventory';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import GearSettings from './pages/GearSettings';
import ScanPage from './pages/ScanPage'; // 새로 추가
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

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

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* 메인 화면 -> 필름 창고 (Inventory) */}
          <Route index element={<Inventory />} />
          
          {/* 밀착인화 탭 */}
          <Route path="gallery" element={<Gallery />} />
          
          {/* 설정 탭 -> 장비 관리 */}
          <Route path="settings" element={<GearSettings />} />
          
          {/* 스캔 페이지 (Tab Bar 없이 전체 화면) */}
          <Route path="scan" element={<ScanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
