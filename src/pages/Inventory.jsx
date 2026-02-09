import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, Box, ScanLine, X, Search, ChevronDown, ChevronUp, Camera, Aperture, Trash2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [groupedStocks, setGroupedStocks] = useState({});
  const [gears, setGears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // 모달 상태
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showManageGearModal, setShowManageGearModal] = useState(false); // 장비 관리 모달
  
  // 검색 & 필름 입고 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState({ expiry_date: '', cost: '', quantity: 1 });
  const [isCustomAdd, setIsCustomAdd] = useState(false);
  const [customFilm, setCustomFilm] = useState({ name: '', brand: '', iso: '' });

  // 장비 추가 상태
  const [newGear, setNewGear] = useState({ type: 'camera', brand: '', model: '', focal_length: '', aperture: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. 필름 재고
      const { data: stockData, error: stockError } = await supabase
        .from('film_stocks')
        .select(`*, film_products (id, name, brand, iso)`)
        .order('expiry_date', { ascending: true });
      
      if (stockError) throw stockError;
      setStocks(stockData || []);
      groupStocks(stockData || []);

      // 2. 장비 목록
      const { data: gearData, error: gearError } = await supabase
        .from('gears')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (gearError) throw gearError;
      setGears(gearData || []);

    } catch (error) { 
      console.error(error);
      setErrorMsg(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const groupStocks = (data) => {
    const groups = data.reduce((acc, stock) => {
      const pid = stock.product_id;
      if (!acc[pid]) acc[pid] = { product: stock.film_products, totalQty: 0, items: [] };
      acc[pid].totalQty += stock.quantity;
      acc[pid].items.push(stock);
      return acc;
    }, {});
    setGroupedStocks(groups);
  };

  // --- 필름 입고 로직 ---
  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('film_products').select('*').ilike('name', `%${searchTerm}%`).limit(5);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      let productId = selectedProduct?.id;
      if (isCustomAdd) {
        const { data } = await supabase.from('film_products').insert([{ name: customFilm.name, brand: customFilm.brand, iso: parseInt(customFilm.iso) || null }]).select().single();
        productId = data.id;
      }
      if (!productId) return alert('필름 선택 필수!');
      const { data } = await supabase.from('film_stocks').insert([{ product_id: productId, expiry_date: newStock.expiry_date || null, cost: parseInt(newStock.cost) || 0, quantity: parseInt(newStock.quantity) || 1 }]).select(`*, film_products(*)`).single();
      const newStocks = [...stocks, data];
      setStocks(newStocks);
      groupStocks(newStocks);
      setShowAddStockModal(false);
      alert('입고 완료! 📦');
    } catch (error) { alert(error.message); }
  };

  // --- 장비 추가 로직 ---
  const handleAddGear = async (e) => {
    e.preventDefault();
    try {
      let finalModel = newGear.model;
      let finalFocal = null;
      let finalAperture = null;

      if (newGear.type === 'lens') {
        if (!newGear.focal_length || !newGear.aperture) return alert('스펙 입력 필수!');
        finalModel = `${newGear.focal_length}mm f${newGear.aperture}`;
        finalFocal = parseInt(newGear.focal_length);
        finalAperture = parseFloat(newGear.aperture);
      } else {
        if (!newGear.model) return alert('모델명 입력 필수!');
      }

      const { data, error } = await supabase.from('gears').insert([{ 
        type: newGear.type, brand: newGear.brand, model: finalModel, focal_length: finalFocal, aperture: finalAperture 
      }]).select();

      if (error) throw error;
      setGears([data[0], ...gears]); // 목록 갱신
      setNewGear({ type: 'camera', brand: '', model: '', focal_length: '', aperture: '' }); // 폼 초기화
      // 모달은 닫지 않음 (연속 추가 가능하게)
    } catch (error) { alert('실패: ' + error.message); }
  };

  const deleteGear = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('gears').delete().eq('id', id);
    setGears(gears.filter(g => g.id !== id));
  };

  const handleUse = (stock) => {
    if (stock.quantity <= 0) return alert('재고 부족!');
    navigate('/scan', { state: { stock: { ...stock, name: stock.film_products.name } } });
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 relative">
      
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong> {errorMsg}
        </div>
      )}

      {/* 1. 필름 창고 */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Box className="text-gray-700" /> 내 필름 창고</h2>
          <button onClick={() => setShowAddStockModal(true)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100">+ 필름 입고</button>
        </div>
        <div className="space-y-4">
          {Object.values(groupedStocks).map(group => <StockGroupCard key={group.product.id} group={group} onUse={handleUse} />)}
          {stocks.length === 0 && !loading && <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300"><p>창고가 비었습니다.</p></div>}
        </div>
      </section>

      {/* 2. 장비 선반 (메인 화면용 - 보기 전용) */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Camera className="text-gray-700" /> 내 장비 선반</h2>
          {/* 장비 관리 버튼 (추가/삭제 모달 열기) */}
          <button onClick={() => setShowManageGearModal(true)} className="text-gray-600 text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 flex items-center gap-1">
            <Settings size={14} /> 장비 관리
          </button>
        </div>
        
        {gears.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <p>장비 선반이 비었습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gears.map(gear => (
              <div key={gear.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${gear.type === 'camera' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {gear.type === 'camera' ? <Camera size={18} /> : <Aperture size={18} />}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm truncate">{gear.model}</p>
                  <p className="text-xs text-gray-400 truncate">{gear.brand}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 모달 1: 필름 입고 (기존 동일) */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddStockModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h3 className="text-lg font-bold mb-4">필름 입고</h3>
            <form onSubmit={handleAddStock}>
              {/* (필름 검색 폼 - 위와 동일) */}
              {!selectedProduct && !isCustomAdd ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">필름 검색</label>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="예: Gold, Portra..." className="w-full border border-gray-300 rounded-xl p-3 outline-none" autoFocus />
                  <div className="mt-2 space-y-1">
                    {searchResults.map(prod => ( <div key={prod.id} onClick={() => setSelectedProduct(prod)} className="p-3 bg-gray-50 rounded-lg cursor-pointer flex justify-between"><span className="font-bold">{prod.name}</span><span className="text-xs bg-gray-200 px-2 py-1 rounded">{prod.brand}</span></div> ))}
                    {searchTerm && <div onClick={() => setIsCustomAdd(true)} className="p-3 text-indigo-600 font-bold cursor-pointer text-center">+ 직접 추가</div>}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="font-bold text-lg text-indigo-900 mb-2">{isCustomAdd ? '새 필름 등록' : selectedProduct.name}</p>
                  {isCustomAdd && <input type="text" placeholder="이름" value={customFilm.name} onChange={e => setCustomFilm({...customFilm, name: e.target.value})} className="w-full p-2 border rounded mb-2" />}
                  <div className="flex gap-2">
                    <input type="number" value={newStock.quantity} onChange={e => setNewStock({...newStock, quantity: e.target.value})} className="w-full p-2 border rounded" placeholder="수량" />
                    <input type="number" value={newStock.cost} onChange={e => setNewStock({...newStock, cost: e.target.value})} className="w-full p-2 border rounded" placeholder="가격" />
                  </div>
                  <input type="date" value={newStock.expiry_date} onChange={e => setNewStock({...newStock, expiry_date: e.target.value})} className="w-full p-2 border rounded mt-2" />
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4">입고 완료</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 모달 2: 장비 관리 (추가 + 목록/삭제 통합) */}
      {showManageGearModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowManageGearModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h3 className="text-lg font-bold mb-4">장비 관리</h3>
            
            {/* 1. 장비 추가 폼 */}
            <form onSubmit={handleAddGear} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 mb-2">새 장비 등록</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewGear({...newGear, type: 'camera'})} className={`flex-1 py-1.5 rounded-lg text-sm font-bold ${newGear.type === 'camera' ? 'bg-gray-800 text-white' : 'bg-white border text-gray-500'}`}>카메라</button>
                <button type="button" onClick={() => setNewGear({...newGear, type: 'lens'})} className={`flex-1 py-1.5 rounded-lg text-sm font-bold ${newGear.type === 'lens' ? 'bg-gray-800 text-white' : 'bg-white border text-gray-500'}`}>렌즈</button>
              </div>
              <input type="text" placeholder="브랜드 (예: Nikon)" value={newGear.brand} onChange={e => setNewGear({...newGear, brand: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              {newGear.type === 'camera' && <input type="text" placeholder="모델명 (예: F3)" value={newGear.model} onChange={e => setNewGear({...newGear, model: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />}
              {newGear.type === 'lens' && <div className="flex gap-2"><div className="flex-1 relative"><input type="number" placeholder="화각 (50)" value={newGear.focal_length} onChange={e => setNewGear({...newGear, focal_length: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required /><span className="absolute right-3 top-2 text-gray-400 text-xs">mm</span></div><div className="flex-1 relative"><input type="number" placeholder="조리개 (1.4)" value={newGear.aperture} onChange={e => setNewGear({...newGear, aperture: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required step="0.1" /><span className="absolute right-3 top-2 text-gray-400 text-xs">f/</span></div></div>}
              <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-black">추가</button>
            </form>

            {/* 2. 장비 목록 (삭제 기능 포함) */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">등록된 장비 ({gears.length})</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {gears.map(gear => (
                  <div key={gear.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${gear.type === 'camera' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {gear.type === 'camera' ? <Camera size={16} /> : <Aperture size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{gear.model}</p>
                        <p className="text-[10px] text-gray-400">{gear.brand}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteGear(gear.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                ))}
                {gears.length === 0 && <p className="text-center text-xs text-gray-400 py-4">목록이 비었습니다.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// (StockGroupCard는 기존과 동일)
function StockGroupCard({ group, onUse }) {
  const [expanded, setExpanded] = useState(false);
  const { product, totalQty, items } = group;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div onClick={() => setExpanded(!expanded)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded flex items-center justify-center font-bold text-xs text-gray-900 border border-yellow-500">{product.iso || 'FILM'}</div>
          <div><h3 className="font-bold text-gray-900">{product.name}</h3><p className="text-xs text-gray-500">{product.brand} • 총 {totalQty}롤</p></div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>
      {expanded && <div className="bg-gray-50 border-t border-gray-100 p-2 space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center text-sm">
            <div className="text-gray-600"><span className="block font-medium">유통기한: {item.expiry_date || '-'}</span><span className="text-xs text-gray-400">₩{item.cost.toLocaleString()}</span></div>
            <div className="flex items-center gap-3"><span className="font-bold text-gray-900">{item.quantity}롤</span><button onClick={(e) => {e.stopPropagation(); onUse(item);}} disabled={item.quantity <= 0} className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-black disabled:opacity-30">사용</button></div>
          </div>
        ))}
      </div>}
    </div>
  );
}
