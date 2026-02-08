import React from 'react';
import { Camera, Plus } from 'lucide-react';

export default function Gallery() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">밀착인화 뷰어 📸</h2>
        <button className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm transition">
          <Plus size={16} />
          <span>추가</span>
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">스캔받은 필름을 펼쳐보세요.</p>
      
      {/* 갤러리 그리드 (예시) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 임시 더미 데이터 */}
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="text-white text-sm font-semibold drop-shadow-md">Kodak Gold {item}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* 비어 있을 때 안내 (Empty State) */}
      <div className="mt-12 text-center text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Camera size={24} className="text-gray-300" />
        </div>
        <p className="text-sm">아직 기록된 필름이 없어요.</p>
        <p className="text-xs mt-1">첫 번째 롤을 등록해보세요!</p>
      </div>
    </div>
  );
}
