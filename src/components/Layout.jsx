import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Camera, BookOpen, Settings } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 상단 헤더 (앱 이름) */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center text-gray-900 tracking-tight">FilmStory</h1>
      </header>

      {/* 메인 콘텐츠 영역 (스크롤 가능) */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* 하단 탭 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`
            }
          >
            <BookOpen size={24} />
            <span className="text-xs">기록</span>
          </NavLink>
          
          <NavLink 
            to="/gallery" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`
            }
          >
            <Camera size={24} />
            <span className="text-xs">밀착인화</span>
          </NavLink>

          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`
            }
          >
            <Settings size={24} />
            <span className="text-xs">설정</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
