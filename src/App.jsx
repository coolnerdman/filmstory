import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FilmLog from './pages/FilmLog';
import Gallery from './pages/Gallery';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* 기록 (가계부) */}
          <Route index element={<FilmLog />} />
          
          {/* 밀착인화 갤러리 */}
          <Route path="gallery" element={<Gallery />} />
          
          {/* 설정 (임시) */}
          <Route path="settings" element={<div className="p-4 text-center">설정 페이지는 공사 중 🚧</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
