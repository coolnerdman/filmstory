import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function FilmEntryForm() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'purchase',
    filmName: '',
    cost: '',
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      // 1. 이미지 업로드 (파일이 있을 경우)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('scans')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 이미지 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('scans')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      // 2. 데이터베이스 저장
      const { error: dbError } = await supabase
        .from('film_logs')
        .insert([
          { 
            date: formData.date, 
            type: formData.type, 
            film_name: formData.filmName, 
            cost: parseInt(formData.cost, 10) || 0, 
            notes: formData.notes,
            image_url: imageUrl
          },
        ]);

      if (dbError) throw dbError;

      alert('저장되었습니다! 🎉');
      
      // 폼 초기화
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'purchase',
        filmName: '',
        cost: '',
        notes: ''
      });
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error('Error:', error);
      alert('저장 실패! 😭: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        🎞️ 필름 기록하기
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 날짜 & 유형 (한 줄로 배치) */}
        <div className="flex gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">유형</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="purchase">구매</option>
              <option value="develop">현상/스캔</option>
            </select>
          </div>
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

        {/* 사진 업로드 (미리보기 포함) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">사진 첨부 (스캔본)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors relative h-48 flex flex-col items-center justify-center bg-gray-50 overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon size={32} className="mb-2" />
                <span className="text-sm">클릭해서 사진 업로드</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">메모</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            placeholder="어디서 샀는지, 특별한 기억 등"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              저장 중...
            </>
          ) : (
            <>
              <Camera className="mr-2" size={18} />
              기록 저장하기
            </>
          )}
        </button>
      </form>
    </div>
  );
}
