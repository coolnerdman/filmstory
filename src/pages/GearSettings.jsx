import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Aperture, Plus, Trash2, Loader2, X, Settings as SettingsIcon } from 'lucide-react';

export default function GearSettings() {
  const [gears, setGears] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState('camera'); // 'camera' or 'lens'
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  // 1. 장비 목록 가져오기
  useEffect(() => {
    fetchGears();
  }, []);

  const fetchGears = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('gears').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGears(data || []);
    } catch (error) { console.error('Error fetching gears:', error); } finally { setLoading(false); }
  };

  // 2. 장비 추가
  const handleAddGear = async (e) => {
    e.preventDefault();
    if (!model.trim()) return;

    try {
      const { data, error } = await supabase
        .from('gears')
        .insert([{ type, brand, model }])
        .select();

      if (error) throw error;

      setGears([data[0], ...gears]);
      setShowAddModal(false);
      setBrand('');
      setModel('');
      alert('장비가 추가되었습니다! 📸');
    } catch (error) {
      alert('추가 실패: ' + error.message);
    }
  };

  // 3. 장비 삭제
  const deleteGear = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('gears').delete().eq('id', id);
      if (error) throw error;
      setGears(gears.filter(g => g.id !== id));
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="text-gray-700" />
        내 장비 관리
      </h2>

      {/* 탭 구분 (카메라 / 렌즈) */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setType('camera')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${type === 'camera' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
        >
          카메라
        </button>
        <button 
          onClick={() => setType('lens')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${type === 'lens' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
        >
          렌즈
        </button>
      </div>

      {/* 목록 표시 */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-3">
          {gears.filter(g => g.type === type).length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <p>등록된 {type === 'camera' ? '카메라가' : '렌즈가'} 없습니다.</p>
            </div>
          ) : (
            gears.filter(g => g.type === type).map((gear) => (
              <div key={gear.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${gear.type === 'camera' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {gear.type === 'camera' ? <Camera size={20} /> : <Aperture size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{gear.model}</p>
                    <p className="text-xs text-gray-400">{gear.brand}</p>
                  </div>
                </div>
                <button onClick={() => deleteGear(gear.id)} className="text-gray-300 hover:text-red-500 p-2 transition">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 추가 버튼 (Floating Action Button) */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition active:scale-95 z-20"
      >
        <Plus size={28} />
      </button>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scale-in relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              {type === 'camera' ? <Camera size={20} /> : <Aperture size={20} />}
              새 {type === 'camera' ? '카메라' : '렌즈'} 추가
            </h3>
            
            <form onSubmit={handleAddGear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">브랜드 (선택)</label>
                <input 
                  type="text" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder={type === 'camera' ? 'Nikon, Canon...' : 'Nikkor, Leica...'}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">모델명 (필수)</label>
                <input 
                  type="text" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={type === 'camera' ? 'F3, AE-1...' : '50mm f1.4...'}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition mt-4"
              >
                등록하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
