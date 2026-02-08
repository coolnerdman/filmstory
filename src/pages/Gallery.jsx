import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, ArrowLeft, Camera, Trash2 } from 'lucide-react';

export default function Gallery() {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [rolls, setRolls] = useState([]);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRollName, setNewRollName] = useState('');
  const [newRollDate, setNewRollDate] = useState(new Date().toISOString().split('T')[0]);

  // 업로드 관련
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. 초기 로딩 (필름통 목록 가져오기)
  useEffect(() => {
    fetchRolls();
  }, []);

  const fetchRolls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('film_rolls')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRolls(data || []);
    } catch (error) {
      console.error('Error fetching rolls:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. 필름통 상세 진입 (사진 가져오기)
  const openRoll = async (roll) => {
    setCurrentRoll(roll);
    setView('detail');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('roll_id', roll.id)
        .order('created_at', { ascending: true }); // 찍은 순서대로

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. 새 필름통 만들기
  const handleCreateRoll = async (e) => {
    e.preventDefault();
    if (!newRollName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('film_rolls')
        .insert([{ name: newRollName, date_start: newRollDate }])
        .select();

      if (error) throw error;

      setRolls([data[0], ...rolls]); // 목록에 바로 추가
      setShowCreateModal(false);
      setNewRollName('');
    } catch (error) {
      alert('생성 실패: ' + error.message);
    }
  };

  // 4. 사진 업로드 (현재 보고 있는 필름통에)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentRoll) return;

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

      // (3) DB 저장 (photos 테이블)
      const { data, error: dbError } = await supabase
        .from('photos')
        .insert([{ 
          roll_id: currentRoll.id,
          image_url: publicUrl 
        }])
        .select();

      if (dbError) throw dbError;

      setPhotos([...photos, data[0]]); // 화면에 바로 추가
      alert('사진 추가 완료! 📸');

    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 실패: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 5. 필름통 삭제 (옵션)
  const deleteRoll = async (e, rollId) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    if (!window.confirm('이 필름통을 삭제할까요? 안에 있는 사진도 다 지워집니다.')) return;

    try {
      const { error } = await supabase.from('film_rolls').delete().eq('id', rollId);
      if (error) throw error;
      setRolls(rolls.filter(r => r.id !== rollId));
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  // --- 화면 렌더링 ---

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* 1. 필름통 목록 뷰 (List View) */}
      {view === 'list' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Camera className="text-gray-700" />
              내 필름통
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg hover:bg-gray-800 transition flex items-center gap-1"
            >
              <Plus size={16} /> 새 필름
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : rolls.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>아직 필름통이 없어요.</p>
              <p className="text-sm mt-1">새 필름을 만들어보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {rolls.map((roll) => (
                <div 
                  key={roll.id} 
                  onClick={() => openRoll(roll)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative group cursor-pointer hover:shadow-md transition active:scale-95 aspect-[3/4] flex flex-col items-center justify-center text-center"
                >
                  {/* 필름통 아이콘 (CSS로 간단하게) */}
                  <div className="w-12 h-16 bg-yellow-400 rounded-sm border-2 border-gray-800 mb-3 relative shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-800 w-full text-center px-1 truncate">
                      {roll.name}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-sm truncate w-full">{roll.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{roll.date_start || '날짜 미정'}</p>

                  <button 
                    onClick={(e) => deleteRoll(e, roll.id)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. 필름통 상세 뷰 (Detail View - 밀착인화) */}
      {view === 'detail' && currentRoll && (
        <div className="bg-black min-h-screen text-white">
          {/* 헤더 */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 p-4 border-b border-gray-800 flex justify-between items-center">
            <button onClick={() => setView('list')} className="text-gray-300 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-sm">{currentRoll.name}</h2>
              <p className="text-[10px] text-gray-500">{photos.length}장</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* 사진 그리드 (밀착인화 스타일) */}
          <div className="p-1 grid grid-cols-3 gap-1">
             {photos.map((photo) => (
               <div key={photo.id} className="aspect-square bg-gray-900 relative group overflow-hidden">
                 <img 
                   src={photo.image_url} 
                   alt="scan" 
                   className="w-full h-full object-cover"
                   loading="lazy"
                 />
               </div>
             ))}
             {/* 빈 공간 채우기 (로딩 중이거나 사진 없을 때) */}
             {photos.length === 0 && !loading && (
               <div className="col-span-3 text-center py-20 text-gray-600 text-xs">
                 <p>이 필름통은 비어있습니다.</p>
                 <p>상단 + 버튼을 눌러 스캔본을 채워보세요.</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* 3. 새 필름통 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold mb-4">새 필름통 만들기</h3>
            <form onSubmit={handleCreateRoll}>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">필름 이름</label>
                <input 
                  type="text" 
                  value={newRollName}
                  onChange={(e) => setNewRollName(e.target.value)}
                  placeholder="예: 제주도 여행 (Gold 200)"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-1">촬영 날짜</label>
                <input 
                  type="date" 
                  value={newRollDate}
                  onChange={(e) => setNewRollDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black"
                >
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
