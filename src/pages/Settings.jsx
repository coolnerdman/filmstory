import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, LogOut, Moon, Sun } from 'lucide-react';

export default function Settings() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email);
    });
  }, []);

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold mb-6">설정</h2>

      {/* 내 정보 카드 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          <User size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">로그인 계정</p>
          <p className="text-lg font-bold text-gray-900">{userEmail || 'Loading...'}</p>
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="space-y-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <Moon size={20} className="text-gray-600" />
            <span className="font-medium text-gray-700">다크 모드</span>
          </div>
          <span className="text-xs text-gray-400">준비 중</span>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={20} />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>

      <div className="mt-12 text-center text-xs text-gray-400">
        <p>FilmStory v2.0</p>
        <p>Developed by Kyuso</p>
      </div>
    </div>
  );
}
