import React from 'react';
import FilmEntryForm from '../components/FilmEntryForm';

export default function FilmLog() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">필름 기록장 📒</h2>
      <p className="text-sm text-gray-500 mb-6">이번 달 필름값, 얼마나 썼을까요?</p>
      
      {/* 기존 컴포넌트 재사용 */}
      <FilmEntryForm />
      
      {/* 통계 예시 (나중에 진짜 데이터로 교체) */}
      <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-2">이번 달 통계</h3>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">총 지출</span>
          <span className="font-bold text-indigo-600">₩ 0</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '5%' }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-1">지난달보다 덜 썼어요! 👍</p>
      </div>
    </div>
  );
}
