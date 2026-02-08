import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Plus, Loader2, X } from 'lucide-react';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. 이미지 목록 불러오기 (Mount 시 실행)
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('film_logs')
        .select('*')
        .not('image_url', 'is', null) // 이미지가 있는 것만!
        .order('date', { ascending: false }); // 최신순

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. 이미지 업로드 처리
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // (1) 스토리지 업로드
      const { error: uploadError } = await supabase.storage
        .from('scans')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // (2) URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('scans')
        .getPublicUrl(filePath);

      // (3) DB에 저장 (밀착인화용 로그)
      const { error: dbError } = await supabase
        .from('film_logs')
        .insert([
          { 
            date: new Date().toISOString().split('T')[0],
            type: 'scan', // 타입 구분
            film_name: '밀착인화 스캔본', // 기본값 (나중에 입력받게 수정 가능)
            cost: 0,
            image_url: publicUrl
          }
        ]);

      if (dbError) throw dbError;

      alert('업로드 완료! 📸');
      fetchImages(); // 목록 새로고침

    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 실패: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Camera size={24} />
          밀착인화 뷰어
        </h2>
        
        {/* 추가 버튼 (파일 선택 트리거) */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          <span>{uploading ? '업로드...' : '추가'}</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> 로딩 중...
        </div>
      ) : images.length === 0 ? (
        <div className="mt-12 text-center text-gray-400 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Camera size={32} className="text-gray-400" />
          </div>
          <p className="text-base font-medium text-gray-600">아직 스캔본이 없어요.</p>
          <p className="text-sm mt-1">우측 상단 [추가] 버튼을 눌러보세요!</p>
        </div>
      ) : (
        /* 갤러리 그리드 */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {images.map((img) => (
            <div key={img.id} className="aspect-square relative group overflow-hidden bg-gray-100 cursor-pointer">
              <img 
                src={img.image_url} 
                alt={img.film_name} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                <span className="text-white text-xs font-medium truncate">{img.film_name}</span>
                <span className="text-gray-300 text-[10px]">{img.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
