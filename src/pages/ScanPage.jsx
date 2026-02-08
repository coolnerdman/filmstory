import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, ArrowLeft, Camera, Aperture, CheckCircle2, Box } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { stock } = location.state || {}; // 선택한 필름 정보

  // 1. 촬영 정보
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedLens, setSelectedLens] = useState('');
  
  // 2. 장비 목록 (DB에서 불러오기)
  const [cameras, setCameras] = useState([]);
  const [lenses, setLenses] = useState([]);
  
  // 3. 업로드 상태
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [fileCount, setFileCount] = useState(0);

  // 4. 초기 로딩
  useEffect(() => {
    if (!stock) {
      alert('잘못된 접근입니다.');
      navigate('/');
      return;
    }
    fetchGears();
  }, [stock, navigate]);

  const fetchGears = async () => {
    try {
      const { data, error } = await supabase.from('gears').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCameras(data.filter(g => g.type === 'camera'));
      setLenses(data.filter(g => g.type === 'lens'));
    } catch (error) { console.error('Error fetching gears:', error); }
  };

  // 5. 스캔 및 업로드 처리
  const handleScan = async (e) => {
    e.preventDefault();
    if (!stock || !selectedCamera || !selectedLens) {
      alert('카메라와 렌즈를 선택해주세요!');
      return;
    }
    
    // 파일 선택 (다중 업로드)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.click();

    input.onchange = async (event) => {
      const files = Array.from(event.target.files);
      if (files.length === 0) return;
      if (files.length > 42) {
        alert('최대 42장까지만 선택해주세요!');
        return;
      }

      setUploading(true);
      setFileCount(files.length);
      
      try {
        // (1) 필름통(Roll) 생성
        const { data: rollData, error: rollError } = await supabase.from('film_rolls').insert([{
          name: `${stock.name} (${dateTaken})`,
          date_taken: dateTaken,
          stock_id: stock.id,
          camera_id: selectedCamera,
          lens_id: selectedLens
        }]).select();

        if (rollError) throw rollError;
        const newRollId = rollData[0].id;

        // (2) 사진 업로드 (반복문)
        let successCount = 0;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProgress(`${i + 1}/${files.length}`);
          
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          
          // Storage 업로드
          const { error: uploadError } = await supabase.storage.from('scans').upload(fileName, file);
          if (uploadError) throw uploadError;

          // URL 가져오기
          const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(fileName);

          // DB 저장
          await supabase.from('photos').insert([{ roll_id: newRollId, image_url: publicUrl }]);
          successCount++;
        }

        // (3) 재고 차감 (-1)
        const { error: stockError } = await supabase.from('film_stocks')
          .update({ quantity: stock.quantity - 1 })
          .eq('id', stock.id);
        
        if (stockError) console.error('Stock update failed:', stockError);

        alert(`스캔 완료! 📸 (${successCount}장 저장됨)`);
        navigate('/gallery'); // 갤러리로 이동!

      } catch (error) {
        console.error('Scan failed:', error);
        alert('스캔 실패: ' + error.message);
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <div className="p-4 pb-20 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">필름 스캔하기</h2>
      </div>

      {stock && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-gray-900 font-bold">
              <Box size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{stock.name}</h3>
              <p className="text-xs text-gray-500">
                {stock.expiry_date ? `유통기한: ${stock.expiry_date}` : '유통기한 정보 없음'}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 text-center border border-gray-200">
            남은 수량: <span className="font-bold text-gray-900">{stock.quantity}롤</span> → <span className="font-bold text-red-600">{stock.quantity - 1}롤</span>
          </div>
        </div>
      )}

      <form onSubmit={handleScan} className="space-y-6">
        {/* 촬영 날짜 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">언제 찍었나요?</label>
          <input 
            type="date" 
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-4 text-base focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>

        {/* 카메라 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
            <Camera size={16} /> 카메라
          </label>
          {cameras.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {cameras.map((cam) => (
                <div 
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col items-center text-center ${selectedCamera === cam.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <Camera className={`mb-2 ${selectedCamera === cam.id ? 'text-indigo-600' : 'text-gray-400'}`} size={24} />
                  <span className={`font-bold text-sm ${selectedCamera === cam.id ? 'text-indigo-900' : 'text-gray-700'}`}>{cam.model}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded-xl text-gray-500 text-sm">
              등록된 카메라가 없습니다. <br />
              <button type="button" onClick={() => navigate('/settings')} className="text-indigo-600 font-bold underline mt-1">장비 등록하러 가기</button>
            </div>
          )}
        </div>

        {/* 렌즈 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
            <Aperture size={16} /> 렌즈
          </label>
          {lenses.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {lenses.map((len) => (
                <div 
                  key={len.id}
                  onClick={() => setSelectedLens(len.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col items-center text-center ${selectedLens === len.id ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <Aperture className={`mb-2 ${selectedLens === len.id ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                  <span className={`font-bold text-sm ${selectedLens === len.id ? 'text-green-900' : 'text-gray-700'}`}>{len.model}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded-xl text-gray-500 text-sm">
              등록된 렌즈가 없습니다. <br />
              <button type="button" onClick={() => navigate('/settings')} className="text-indigo-600 font-bold underline mt-1">장비 등록하러 가기</button>
            </div>
          )}
        </div>

        {/* 스캔 시작 버튼 */}
        <button
          type="submit"
          disabled={uploading || !selectedCamera || !selectedLens}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 mt-8
            ${uploading ? 'bg-gray-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" />
              업로드 중... ({progress})
            </>
          ) : (
            <>
              <CheckCircle2 size={24} />
              스캔본 업로드 시작
            </>
          )}
        </button>
      </form>
    </div>
  );
}
