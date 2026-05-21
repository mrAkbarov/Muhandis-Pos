import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, Add, Remove, Delete, ShoppingCartCheckout,
  CategoryOutlined, CalendarToday, Assistant, ArrowBack, ArrowForward, Close
} from '@mui/icons-material';
import { Button, Chip, Divider, IconButton, InputAdornment, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Drawer } from '@mui/material';

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";
const itemsPerPage = 6;

export default function POS() {
  const { getBusinessProducts, getProductStock, updateProductStock, setSales } = useApp();
  
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Barchasi');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('Naqd');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog and AI drawer states
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);

  // Time state
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const businessProducts = getBusinessProducts();

  // Show all products in POS
  const activeProducts = businessProducts;

  // Categories list derived from products
  const categoriesList = ['Barchasi', ...new Set(activeProducts.map(p => p.category))];

  const filtered = activeProducts.filter((p) => {
    const matchCat = !search.trim() ? (selectedCat === 'Barchasi' || p.category === selectedCat) : true;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search.trim()));
    return matchCat && matchSearch;
  });

  useEffect(() => {
    if (!search.trim()) return;
    const barcodeTrimmed = search.trim();
    const exactMatch = activeProducts.find(p => p.barcode === barcodeTrimmed);
    if (exactMatch) {
      const stock = getProductStock(exactMatch.id);
      if (stock > 0) {
        setCart((prev) => {
          const existing = prev.find((i) => i.id === exactMatch.id);
          if (existing) {
            if (existing.qty >= stock) {
              alert("Skladda yetarli mahsulot yo'q!");
              return prev;
            }
            return prev.map((i) => i.id === exactMatch.id ? { ...i, qty: i.qty + 1 } : i);
          }
          return [...prev, { ...exactMatch, qty: 1 }];
        });
        setSearch('');
      } else {
        alert(`${exactMatch.name} skladda qolmagan!`);
        setSearch('');
      }
    }
  }, [search, activeProducts, getProductStock]);

  // Pagination for products
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage);

  const addToCart = (product) => {
    const currentStock = getProductStock(product.id);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= currentStock) {
          alert("Skladda yetarli mahsulot yo'q!");
          return prev;
        }
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    const currentStock = getProductStock(id);
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          if (newQty > currentStock) {
            alert("Skladda yetarli mahsulot yo'q!");
            return i;
          }
          return { ...i, qty: Math.max(1, newQty) };
        }
        return i;
      })
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;

  const clearCart = () => setCart([]);

  const checkout = () => {
    if (cart.length === 0) return;

    // Deduct stock for each cart item
    cart.forEach(item => {
      updateProductStock(item.id, -item.qty);
    });

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toISOString().slice(0, 10);
    const txnId = `TXN-${Date.now().toString().slice(-6)}`;

    const newSale = {
      id: txnId,
      date: formattedDate,
      time: formattedTime,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      amount: total,
      method: payMethod,
      cashier: 'Akmaljon',
      businessId: activeProducts[0]?.businessId || 1
    };

    // Save to global sales
    setSales(prev => [newSale, ...prev]);

    // Show custom success dialog receipt
    setReceiptDialog(newSale);
    clearCart();
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-90px)]">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-5 py-3 rounded-2xl shadow-md border border-blue-500/20">
        <div className="flex items-center gap-3">
          <span className="font-bold text-base tracking-wide">Kassa Tizimi (POS)</span>
          <Chip label="ONLINE" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 700, fontSize: 10, border: '1px solid rgba(34, 197, 94, 0.4)' }} />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-gray-200">Kassir: <b className="text-white font-semibold">Akmaljon</b></span>
          </div>
          <span className="text-indigo-400">|</span>
          <span className="text-gray-200 font-mono bg-white/10 px-2.5 py-1 rounded-lg font-bold">
            {time.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Products Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
          {/* Search */}
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex gap-2">
            <TextField
              size="small"
              placeholder="Mahsulot qidirish (Shtrix-kod yoki Nomi)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search style={{ fontSize: 18, color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                style: { borderRadius: 10, fontSize: 13, backgroundColor: '#ffffff' },
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#4361ee' },
                  '&.Mui-focused fieldset': { borderColor: '#4361ee', borderWidth: '1px' }
                } 
              }}
            />
          </div>

          {/* Categories Tab Bar */}
          <div className="flex px-3 bg-gray-50 border-b border-gray-100 overflow-x-auto scrollbar-none gap-1">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCat(cat); setCurrentPage(1); }}
                className="whitespace-nowrap text-xs px-4 py-2.5 font-bold transition-all flex-shrink-0"
                style={{
                  borderBottom: selectedCat === cat ? '3px solid #4361ee' : '3px solid transparent',
                  color: selectedCat === cat ? '#4361ee' : '#6b7280',
                  fontWeight: selectedCat === cat ? '700' : '600'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start bg-gray-50/50">
            {paginatedProducts.length === 0 ? (
              <div className="col-span-3 text-center py-10 text-gray-400 text-sm">
                Mahsulotlar topilmadi
              </div>
            ) : (
              paginatedProducts.map((p) => {
                const stock = getProductStock(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => stock > 0 && addToCart(p)}
                    disabled={stock === 0}
                    className="bg-white rounded-2xl border border-gray-200/80 p-3.5 text-left hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-45 disabled:bg-gray-100 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed flex flex-col justify-between h-[135px] shadow-sm relative group"
                  >
                    <div className="w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-200">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 leading-tight truncate" title={p.name}>{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{p.barcode || 'Shtrix-kod yo\'q'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-full mt-3 pt-2.5 border-t border-gray-100 flex items-end justify-between">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Narxi</p>
                        <p className="text-xs font-black text-blue-600">{fmt(p.price)}</p>
                      </div>
                      <div className="text-right">
                        {stock > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-bold">
                            {stock} ta
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold">
                            Tugagan
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-semibold text-gray-500">
              Jami: {filtered.length} ta mahsulot
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                startIcon={<ArrowBack style={{ fontSize: 14 }} />}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: 12, 
                  color: '#4361ee',
                  fontWeight: 600,
                  '&.Mui-disabled': { color: '#9ca3af' }
                }}
              >
                Oldingi
              </Button>
              <span className="text-xs font-bold px-2.5 py-1 bg-white border rounded-lg shadow-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="small"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                endIcon={<ArrowForward style={{ fontSize: 14 }} />}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: 12, 
                  color: '#4361ee',
                  fontWeight: 600,
                  '&.Mui-disabled': { color: '#9ca3af' }
                }}
              >
                Keyingi
              </Button>
            </div>
          </div>
        </div>

        {/* Cart Panel (SAP Receipt View) */}
        <div className="w-[380px] flex flex-col bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Joriy Savatcha</h2>
            <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-sm">
              {cart.length} TA MAXSULOT
            </span>
          </div>

          {/* Cart Items Table */}
          <div className="flex-1 overflow-y-auto bg-white">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center space-y-2">
                <CategoryOutlined style={{ fontSize: 40, color: '#d1d5db' }} />
                <p className="text-xs font-semibold text-gray-500">Savat hozircha bo'sh</p>
                <p className="text-[10px] text-gray-400">Kassaga mahsulot qo'shish uchun chap tomondagi kartalarni bosing yoki shtrix-kodni skanerlang.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100 text-[10px] text-gray-500 uppercase font-bold">
                    <th className="p-3 pl-4">Mahsulot</th>
                    <th className="p-3 text-center w-24">Soni</th>
                    <th className="p-3 text-right">Summa</th>
                    <th className="p-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <tr key={item.id} className="text-xs hover:bg-gray-50/55 transition-colors">
                      <td className="p-3 pl-4 min-w-0">
                        <p className="font-bold text-gray-800 truncate w-32" title={item.name}>{item.name}</p>
                        <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{fmt(item.price)}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-white p-0.5 w-[90px] shadow-sm">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg font-bold text-xs transition-colors"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-bold text-gray-800 w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg font-bold text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-extrabold text-gray-800">
                        {fmt(item.price * item.qty).replace(" so'm", "")}
                      </td>
                      <td className="p-3 text-center">
                        <IconButton
                          onClick={() => removeItem(item.id)}
                          size="small"
                          sx={{ 
                            color: '#ef4444', 
                            bgcolor: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: 2,
                            p: 0.7,
                            '&:hover': { bgcolor: '#fecaca' }
                          }}
                        >
                          <Delete style={{ fontSize: 15 }} />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary & Payment */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-150 space-y-2 shadow-inner">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Turlar soni:</span>
                <span className="font-semibold text-gray-700">{cart.length} xil</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Dona soni:</span>
                <span className="font-semibold text-gray-700">{cart.reduce((sum, item) => sum + item.qty, 0)} ta</span>
              </div>
              <Divider sx={{ my: 1 }} />
              <div className="flex justify-between items-center text-sm font-black text-gray-850">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Jami summa:</span>
                <span className="text-blue-600 font-black text-lg">{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">To'lov usuli</p>
              <div className="flex border border-gray-200 bg-white rounded-xl overflow-hidden p-0.5 shadow-sm">
                {['Naqd', 'Karta', 'Online'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className="flex-1 text-xs py-2 font-bold rounded-lg transition-all"
                    style={{
                      background: payMethod === m ? '#4361ee' : 'transparent',
                      color: payMethod === m ? '#ffffff' : '#4b5563',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Button
              fullWidth
              variant="contained"
              startIcon={<ShoppingCartCheckout />}
              onClick={checkout}
              disabled={cart.length === 0}
              sx={{
                bgcolor: '#4361ee',
                color: '#ffffff',
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: 13,
                py: 1.4,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#3451d1', boxShadow: 'none' },
                '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
              }}
            >
              Sotish va Chek berish
            </Button>
          </div>
        </div>
      </div>

      {/* Success Dialog Receipt Details */}
      <Dialog open={!!receiptDialog} onClose={() => setReceiptDialog(null)} maxWidth="xs" fullWidth>
        {receiptDialog && (
          <>
            <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 'bold', fontSize: 16, py: 2, px: 3, textAlign: 'center' }}>
              Xarid Muvaffaqiyatli Yakunlandi!
            </DialogTitle>
            <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <div className="text-center font-bold text-sm text-gray-800 border-b border-gray-100 pb-2 uppercase tracking-widest text-[11px]">
                SAVDO CHEKI / RECEIPT
              </div>
              <div className="bg-gray-50 border rounded-2xl p-4 text-xs space-y-2 font-mono">
                <div className="flex justify-between"><span className="text-gray-400">Tranzaksiya ID:</span> <b className="text-gray-700">{receiptDialog.id}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Sana / Vaqt:</span> <b className="text-gray-700">{receiptDialog.date} {receiptDialog.time}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Kassir:</span> <b className="text-gray-700">{receiptDialog.cashier}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">To'lov turi:</span> <b className="text-gray-700">{receiptDialog.method}</b></div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Mahsulotlar</p>
                <div className="border rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="p-2 pl-3">Mahsulot nomi</th>
                        <th className="p-2 text-center">Soni</th>
                        <th className="p-2 text-right pr-3">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {receiptDialog.items.map((item, idx) => (
                        <tr key={idx} className="text-gray-700">
                          <td className="p-2 pl-3 font-semibold">{item.name}</td>
                          <td className="p-2 text-center font-mono">{item.qty} ta</td>
                          <td className="p-2 text-right pr-3 font-mono font-bold">{fmt(item.price * item.qty).replace(" so'm", "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-xs text-green-800">To'langan jami summa:</span>
                <span className="font-extrabold text-green-600 text-base font-mono">{fmt(receiptDialog.amount)}</span>
              </div>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
              <Button 
                onClick={() => setReceiptDialog(null)} 
                variant="contained" 
                fullWidth
                sx={{ 
                  bgcolor: '#4361ee', 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 'bold',
                  py: 1,
                  '&:hover': { bgcolor: '#3451d1' } 
                }}
              >
                Chekni Yopish
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* AI Assistant Drawer */}
      <Drawer anchor="right" open={aiOpen} onClose={() => setAiOpen(false)}>
        <div className="w-80 p-5 flex flex-col justify-between h-full bg-[#1e1b4b] text-white">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Assistant className="text-purple-400" />
                <h2 className="font-bold text-base">POS AI Ko'makchisi</h2>
              </div>
              <IconButton onClick={() => setAiOpen(false)} size="small" sx={{ color: '#fff' }}>
                <Close />
              </IconButton>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <p>Salom! Men sizga POS dasturidagi asosiy funksiyalar va imkoniyatlarni tushuntiraman:</p>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">💡 Mahsulotlarni sotish (Kassa)</p>
                <p>O'ng tomondagi ro'yxatdan mahsulotlarni tanlab savatga qo'shing. To'lov usulini belgilang va "Sotish" tugmasini bosing.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">📦 Sklad / Prixod nazorati</p>
                <p>Dilerga buyurtma (Zakaz) bering. Prixod bo'limidan kelgan mahsulotlarni qabul qiling, bu mahsulotlar avtomatik ravishda ombor qoldig'iga qo'shiladi.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">👥 Agentlar va CRM</p>
                <p>Mijozlarni ro'yxatga oling. Agentlar orqali buyurtmalarni tarqating va ularning statistikasini alohida kuzating.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-[10px] text-gray-400 text-center">
            POS System AI • v1.0.0
          </div>
        </div>
      </Drawer>
    </div>
  );
}
