import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, DollarSign, PenTool } from 'lucide-react';

export default function FilmEntryForm() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'purchase',
    filmName: '',
    cost: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('film_logs')
        .insert([
          { 
            date: formData.date, 
            type: formData.type, 
            film_name: formData.filmName, 
            cost: parseInt(formData.cost, 10) || 0, 
            notes: formData.notes
          },
        ]);

      if (error) throw error;

      alert('가계부 저장 완료! 💸');
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'purchase',
        filmName: '',
        cost: '',
        notes: ''
      });

    } catch (error) {
      console.error('Error:', error);
      alert('저장 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <PenTool size={20} />
        필름 가계부
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 날짜 & 유형 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">날짜</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">유형</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
            >
              <option value="purchase">구매</option>
              <option value="develop">현상/스캔</option>
            </select>
          </div>
        </div>

        {/* 필름 이름 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">필름 이름</label>
          <input
            type="text"
            name="filmName"
            value={formData.filmName}
            onChange={handleChange}
            placeholder="예: Kodak Gold 200"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
            required
          />
        </div>

        {/* 비용 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">비용 (원)</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">₩</span>
            </div>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              placeholder="0"
              className="w-full rounded-lg border-gray-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
              required
            />
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            placeholder="어디서 샀는지, 특별한 기억 등"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <DollarSign className="mr-1" size={16} />}
          {loading ? '저장 중...' : '기록하기'}
        </button>
      </form>
    </div>
  );
}
