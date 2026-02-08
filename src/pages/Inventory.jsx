import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, Box, ScanLine, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Inventory() {
  const [stocks, setStocks] = useState([]); // Raw data
  const [groupedStocks, setGroupedStocks] = useState({}); // Grouped by product_id
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // 선택된 필름

  // 입고 폼
  const [newStock, setNewStock] = useState({
    expiry_date: '',
    cost: '',
    quantity: 1
  });

  // 새 필름 직접 추가 (DB에 없을 때)
  const [isCustomAdd, setIsCustomAdd] = useState(false);
  const [customFilm, setCustomFilm] = useState({ name: '', brand: '', iso: '' });

  // 1. 재고 목록 가져오기 (Join)
  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('film_stocks')
        .select(`
          *,
          film_products (id, name, brand, iso)
        `)
        .order('expiry_date', { ascending: true }); // 유통기한 임박순

      if (error) throw error;

      setStocks(data || []);
      groupStocks(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // 2. 그룹화 로직 (같은 제품끼리 묶기)
  const groupStocks = (data) => {
    const groups = data.reduce((acc, stock) => {
      const pid = stock.product_id;
      if (!acc[pid]) {
        acc[pid] = {
          product: stock.film_products,
          totalQty: 0,
          items: []
        };
      }
      acc[pid].totalQty += stock.quantity;
      acc[pid].items.push(stock);
      return acc;
    }, {});
    setGroupedStocks(groups);
  };

  // 3. 필름 검색 (Debounce 없이 간단하게 Enter or Typing)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('film_products')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 4. 입고 처리
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    try {
      let productId = selectedProduct?.id;

      // (A) 커스텀 필름 추가인 경우 -> 마스터 DB에 먼저 등록
      if (isCustomAdd) {
        const { data: newProd, error: prodError } = await supabase
          .from('film_products')
          .insert([{ 
            name: customFilm.name, 
            brand: customFilm.brand, 
            iso: parseInt(customFilm.iso) || null 
          }])
          .select()
          .single();
        
        if (prodError) throw prodError;
        productId = newProd.id;
      }

      if (!productId) return alert('필름을 선택하거나 등록해주세요.');

      // (B) 재고 등록
      const { data, error } = await supabase
        .from('film_stocks')
        .insert([{
          product_id: productId,
          expiry_date: newStock.expiry_date || null,
          cost: parseInt(newStock.cost) || 0,
          quantity: parseInt(newStock.quantity) || 1
        }])
        .select(`*, film_products(*)`)
        .single();

      if (error) throw error;

      // 상태 업데이트 (리패치 대신 로컬 업데이트)
      const newStocks = [...stocks, data];
      setStocks(newStocks);
      groupStocks(newStocks);

      // 초기화
      setShowAddModal(false);
      setSearchTerm('');
      setSelectedProduct(null);
      setIsCustomAdd(false);
      setCustomFilm({ name: '', brand: '', iso: '' });
      setNewStock({ expiry_date: '', cost: '', quantity: 1 });
      alert('입고 완료! 📦');

    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  // 5. 사용/스캔 이동
  const handleUse = (stock) => {
    if (stock.quantity <= 0) return alert('재고가 없습니다!');
    // stock 객체 안에 film_products 정보가 포함되어 있어야 함
    const stockWithInfo = {
        ...stock,
        name: stock.film_products.name // ScanPage에서 name을 쓰므로 매핑
    };
    navigate('/scan', { state: { stock: stockWithInfo } });
  };

  // --- 렌더링 ---
  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 relative">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Box className="text-gray-700" /> 내 필름 창고
      </h2>

      {/* 재고 목록 (그룹화) */}
      <div className="space-y-4">
        {Object.values(groupedStocks).map((group) => (
          <StockGroupCard key={group.product.id} group={group} onUse={handleUse} />
        ))}
        {stocks.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p>창고가 비었습니다.</p>
            <p className="text-sm mt-1">새 필름을 입고해보세요!</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition z-20">
        <Plus size={28} />
      </button>

      {/* 입고 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h3 className="text-lg font-bold mb-4">필름 입고</h3>

            <form onSubmit={handleAddStock}>
              {/* 1. 필름 검색/선택 */}
              {!selectedProduct && !isCustomAdd ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">필름 검색</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="예: Gold, Portra..."
                      className="w-full pl-10 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  {/* 검색 결과 */}
                  <div className="mt-2 space-y-1">
                    {searchResults.map(prod => (
                      <div key={prod.id} onClick={() => setSelectedProduct(prod)} className="p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer flex justify-between items-center">
                        <span className="font-bold text-gray-800">{prod.name}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{prod.brand}</span>
                      </div>
                    ))}
                    {searchTerm && !searching && (
                      <div onClick={() => setIsCustomAdd(true)} className="p-3 text-indigo-600 font-bold cursor-pointer text-center hover:bg-indigo-50 rounded-lg">
                        + "{searchTerm}" 직접 추가하기
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 선택된 필름 표시 */
                <div className="mb-6 bg-indigo-50 p-4 rounded-xl flex justify-between items-center border border-indigo-100">
                  <div>
                    <p className="text-xs text-indigo-500 font-bold mb-1">선택된 필름</p>
                    <p className="font-bold text-lg text-indigo-900">
                      {isCustomAdd ? customFilm.name || '새 필름' : selectedProduct.name}
                    </p>
                  </div>
                  <button type="button" onClick={() => { setSelectedProduct(null); setIsCustomAdd(false); }} className="text-indigo-400 hover:text-indigo-600">변경</button>
                </div>
              )}

              {/* (옵션) 새 필름 정보 입력 */}
              {isCustomAdd && (
                <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input type="text" placeholder="필름 이름 (예: Kodak Gold 200)" value={customFilm.name} onChange={e => setCustomFilm({...customFilm, name: e.target.value})} className="w-full p-2 border rounded" required />
                  <div className="flex gap-2">
                    <input type="text" placeholder="브랜드 (Kodak)" value={customFilm.brand} onChange={e => setCustomFilm({...customFilm, brand: e.target.value})} className="w-full p-2 border rounded" />
                    <input type="number" placeholder="ISO (200)" value={customFilm.iso} onChange={e => setCustomFilm({...customFilm, iso: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                </div>
              )}

              {/* 2. 재고 정보 입력 (공통) */}
              {(selectedProduct || isCustomAdd) && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">수량</label>
                      <input type="number" value={newStock.quantity} onChange={e => setNewStock({...newStock, quantity: e.target.value})} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">가격 (1롤)</label>
                      <input type="number" value={newStock.cost} onChange={e => setNewStock({...newStock, cost: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">유통기한</label>
                    <input type="date" value={newStock.expiry_date} onChange={e => setNewStock({...newStock, expiry_date: e.target.value})} className="w-full p-3 border rounded-xl" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg mt-4">입고 완료</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 하위 컴포넌트: 재고 그룹 카드
function StockGroupCard({ group, onUse }) {
  const [expanded, setExpanded] = useState(false);
  const { product, totalQty, items } = group;

  // 가장 빠른 유통기한 찾기
  const urgentItem = items
    .filter(i => i.quantity > 0 && i.expiry_date)
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 (요약) */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded flex items-center justify-center font-bold text-xs text-gray-900 border border-yellow-500">
            {product.iso || 'FILM'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{product.name}</h3>
            <p className="text-xs text-gray-500">
              {product.brand} • 총 {totalQty}롤
              {urgentItem && <span className="text-red-500 ml-2 font-medium">({urgentItem.expiry_date} 임박)</span>}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>

      {/* 상세 목록 (펼침) */}
      {expanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-2 space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center text-sm">
              <div className="text-gray-600">
                <span className="block font-medium">유통기한: {item.expiry_date || '정보 없음'}</span>
                <span className="text-xs text-gray-400">입고: {item.created_at.split('T')[0]} • ₩{item.cost.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">{item.quantity}롤</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onUse(item); }}
                  disabled={item.quantity <= 0}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-black disabled:opacity-30"
                >
                  사용
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
