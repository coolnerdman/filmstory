import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, Box, ScanLine, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStock, setNewStock] = useState({
    name: '',
    expiry_date: '',
    cost_per_roll: '',
    quantity: 1
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('film_stocks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setStocks(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newStock.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('film_stocks')
        .insert([{
          name: newStock.name,
          expiry_date: newStock.expiry_date || null,
          cost_per_roll: parseInt(newStock.cost_per_roll, 10) || 0,
          quantity: parseInt(newStock.quantity, 10) || 1
        }])
        .select();

      if (error) throw error;

      setStocks([data[0], ...stocks]);
      setShowAddModal(false);
      setNewStock({ name: '', expiry_date: '', cost_per_roll: '', quantity: 1 });
      alert('입고 완료! 📦');
    } catch (error) {
      alert('입고 실패: ' + error.message);
    }
  };

  const handleUse = (stock) => {
    if (stock.quantity <= 0) {
      alert('재고가 없습니다! 😭');
      return;
    }
    navigate('/scan', { state: { stock } });
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 relative">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Box className="text-gray-700" />
        내 필름 창고
      </h2>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>창고가 비었습니다.</p>
          <p className="text-sm mt-1">새 필름을 입고해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stocks.map((stock) => (
            <div key={stock.id} className={`bg-white p-4 rounded-xl shadow-sm border ${stock.quantity === 0 ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{stock.name}</h3>
                  <p className="text-xs text-gray-500">
                    {stock.expiry_date ? `유통기한: ${stock.expiry_date}` : '유통기한 미입력'}
                    {stock.cost_per_roll > 0 && ` • ₩${stock.cost_per_roll.toLocaleString()}`}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${stock.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stock.quantity}롤 남음
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => handleUse(stock)}
                  disabled={stock.quantity <= 0}
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ScanLine size={16} />
                  사용 / 스캔
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 버튼 */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition active:scale-95 z-20"
      >
        <Plus size={28} />
      </button>

      {/* 모달 (애니메이션 제거) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Box size={20} /> 새 필름 입고</h3>
            
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">필름 이름</label>
                <input type="text" value={newStock.name} onChange={(e) => setNewStock({...newStock, name: e.target.value})} placeholder="예: Kodak Gold 200" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required autoFocus />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">수량 (롤)</label>
                  <input type="number" min="1" value={newStock.quantity} onChange={(e) => setNewStock({...newStock, quantity: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">가격 (1롤당)</label>
                  <input type="number" value={newStock.cost_per_roll} onChange={(e) => setNewStock({...newStock, cost_per_roll: e.target.value})} placeholder="0" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">유통기한 (선택)</label>
                <input type="date" value={newStock.expiry_date} onChange={(e) => setNewStock({...newStock, expiry_date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition mt-4">입고하기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
