import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, ArrowLeft, Camera, Trash2, X } from 'lucide-react';

export default function Gallery() {
  const [view, setView] = useState('list');
  const [rolls, setRolls] = useState([]);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRollName, setNewRollName] = useState('');
  const [newRollDate, setNewRollDate] = useState(new Date().toISOString().split('T')[0]);

  // 업로드 상태 (다중 업로드)
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  // 1. 목록 로드
  useEffect(() => {
    fetchRolls();
  }, []);

  const fetchRolls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('film_rolls').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRolls(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // 2. 필름통 상세
  const openRoll = async (roll) => {
    setCurrentRoll(roll);
    setView('detail');
    setLoading(true);
    try {
      const { data, error } = await supabase.from('photos').select('*').eq('roll_id', roll.id).order('created_at', { ascending: true });
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // 3. 필름통 생성
  const handleCreateRoll = async (e) => {
    e.preventDefault();
    if (!newRollName.trim()) return;
    try {
      const { data, error } = await supabase.from('film_rolls').insert([{ name: newRollName, date_start: newRollDate }]).select();
      if (error) throw error;
      setRolls([data[0], ...rolls]);
      setShowCreateModal(false);
      setNewRollName('');
    } catch (error) { alert('생성 실패: ' + error.message); }
  };

  // 4. 다중 업로드 (핵심)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !currentRoll) return;

    // 최대 42장 제한
    if (files.length > 42) {
      alert('한 번에 최대 42장까지만 선택해주세요! 🎞️');
      return;
    }

    setUploading(true);
    let successCount = 0;
    const newPhotos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`${i + 1}/${files.length}`); // 진행 상황 표시

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // (1) 업로드
        const { error: uploadError } = await supabase.storage.from('scans').upload(fileName, file);
        if (uploadError) throw uploadError;

        // (2) URL
        const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(fileName);

        // (3) DB 저장
        const { data, error: dbError } = await supabase.from('photos').insert([{ roll_id: currentRoll.id, image_url: publicUrl }]).select();
        if (dbError) throw dbError;

        newPhotos.push(data[0]);
        successCount++;
      } catch (error) {
        console.error('Upload failed for file:', file.name, error);
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setUploading(false);
    setUploadProgress('');
    alert(`${successCount}장의 사진이 추가되었습니다! 📸`);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  // 5. 필름통 삭제
  const deleteRoll = async (e, rollId) => {
    e.stopPropagation();
    if (!window.confirm('정말 삭제하시겠습니까? (복구 불가)')) return;
    try {
      const { error } = await supabase.from('film_rolls').delete().eq('id', rollId);
      if (error) throw error;
      setRolls(rolls.filter(r => r.id !== rollId));
    } catch (error) { alert('삭제 실패: ' + error.message); }
  };

  // --- 화면 렌더링 ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* 1. 목록 뷰 */}
      {view === 'list' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Camera className="text-gray-700" />
              내 필름통
            </h2>
            <button onClick={() => setShowCreateModal(true)} className="bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg hover:bg-gray-800 transition flex items-center gap-1">
              <Plus size={16} /> 새 필름
            </button>
          </div>

          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div> : 
           rolls.length === 0 ? <div className="text-center py-12 text-gray-400"><p>아직 필름통이 없어요.</p></div> : 
           (
            <div className="grid grid-cols-2 gap-4">
              {rolls.map((roll) => (
                <div key={roll.id} onClick={() => openRoll(roll)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative group cursor-pointer hover:shadow-md transition active:scale-95 aspect-[3/4] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-16 bg-yellow-400 rounded-sm border-2 border-gray-800 mb-3 relative shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-800 w-full text-center px-1 truncate">{roll.name}</div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm truncate w-full">{roll.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{roll.date_start}</p>
                  <button onClick={(e) => deleteRoll(e, roll.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. 상세 뷰 (밀착인화) */}
      {view === 'detail' && currentRoll && (
        <div className="bg-black min-h-screen text-white pb-20">
          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 p-4 border-b border-gray-800 flex justify-between items-center">
            <button onClick={() => setView('list')} className="text-gray-300 hover:text-white"><ArrowLeft size={24} /></button>
            <div className="text-center">
              <h2 className="font-bold text-sm">{currentRoll.name}</h2>
              <p className="text-[10px] text-gray-500">{photos.length}장</p>
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 relative">
              {uploading ? <span className="text-xs font-bold animate-pulse">{uploadProgress}</span> : <Plus size={24} />}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
          </div>

          <div className="p-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-0.5 auto-rows-[minmax(0,_1fr)]">
             {photos.map((photo) => (
               <div 
                 key={photo.id} 
                 className="aspect-[3/2] bg-black relative group overflow-hidden cursor-pointer"
                 onClick={() => window.open(photo.image_url, '_blank')}
               >
                 <img 
                   src={photo.image_url} 
                   alt="scan" 
                   className="w-full h-full object-contain"
                   loading="lazy"
                 />
               </div>
             ))}
             {photos.length === 0 && !loading && <div className="col-span-4 text-center py-20 text-gray-600 text-xs"><p>비어있음</p></div>}
          </div>
        </div>
      )}

      {/* 3. 모달 (생략 - 위와 동일) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold mb-4">새 필름통 만들기</h3>
            <form onSubmit={handleCreateRoll}>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">필름 이름</label>
                <input type="text" value={newRollName} onChange={(e) => setNewRollName(e.target.value)} placeholder="예: 제주도 여행 (Gold 200)" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none" autoFocus />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-1">촬영 날짜</label>
                <input type="date" value={newRollDate} onChange={(e) => setNewRollDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">취소</button>
                <button type="submit" className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black">만들기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
