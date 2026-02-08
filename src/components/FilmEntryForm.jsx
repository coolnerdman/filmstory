import React, { useState } from 'react';

export default function FilmEntryForm() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'purchase', // purchase, develop
    filmName: '',
    cost: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    alert('저장되었습니다! (아직 서버는 없어요)');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🎞️ 필름 기록하기</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">날짜</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            required
          />
        </div>

        {/* 유형 (구매 vs 현상) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">유형</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="purchase">필름 구매</option>
            <option value="develop">현상/스캔</option>
          </select>
        </div>

        {/* 필름 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">필름 이름</label>
          <input
            type="text"
            name="filmName"
            value={formData.filmName}
            onChange={handleChange}
            placeholder="예: Kodak Gold 200"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            required
          />
        </div>

        {/* 비용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">비용 (원)</label>
          <input
            type="number"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            placeholder="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            required
          />
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">메모</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="어디서 샀는지, 특별한 기억 등"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          기록 저장
        </button>
      </form>
    </div>
  );
}
