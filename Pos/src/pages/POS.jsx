import { useState } from 'react';
import {
  Search, Add, Remove, Delete, ShoppingCartCheckout,
  CategoryOutlined,
} from '@mui/icons-material';
import { Button, Chip, Divider, IconButton, InputAdornment, TextField } from '@mui/material';

const categories = ['Barchasi', 'Ichimliklar', 'Oziq-ovqat', 'Sut mahsulotlari', 'Shirinliklar', 'Kraxmal'];

const products = [
  { id: 1, name: 'Cola 1L', price: 10000, category: 'Ichimliklar', emoji: '🥤', stock: 45 },
  { id: 2, name: 'Pepsi 1L', price: 9500, category: 'Ichimliklar', emoji: '🥤', stock: 30 },
  { id: 3, name: 'Non (Tandir)', price: 8000, category: 'Oziq-ovqat', emoji: '🫓', stock: 20 },
  { id: 4, name: "Lay's Chips", price: 12000, category: 'Shirinliklar', emoji: '🍟', stock: 50 },
  { id: 5, name: 'Snickers 50g', price: 9000, category: 'Shirinliklar', emoji: '🍫', stock: 60 },
  { id: 6, name: 'Smetana 20%', price: 15000, category: 'Sut mahsulotlari', emoji: '🥛', stock: 10 },
  { id: 7, name: 'Qatiq', price: 11000, category: 'Sut mahsulotlari', emoji: '🥛', stock: 8 },
  { id: 8, name: 'Shakar 1kg', price: 18000, category: 'Oziq-ovqat', emoji: '🍬', stock: 3 },
  { id: 9, name: 'Tuz 1kg', price: 5000, category: 'Kraxmal', emoji: '🧂', stock: 0 },
  { id: 10, name: 'Sut 1L', price: 13000, category: 'Sut mahsulotlari', emoji: '🥛', stock: 5 },
  { id: 11, name: "Yog' 1L", price: 25000, category: 'Oziq-ovqat', emoji: '🫙', stock: 12 },
  { id: 12, name: 'Makaron', price: 7000, category: 'Kraxmal', emoji: '🍝', stock: 40 },
];

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";

export default function POS() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Barchasi');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('Naqd');

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === 'Barchasi' || p.category === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax;

  const clearCart = () => setCart([]);

  const checkout = () => {
    if (cart.length === 0) return;
    alert(`Sotuv muvaffaqiyatli amalga oshirildi!\nJami: ${fmt(total)}`);
    clearCart();
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-96px)]">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <TextField
            size="small"
            placeholder="Mahsulot qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search style={{ fontSize: 18, color: '#9ca3af' }} />
                </InputAdornment>
              ),
              style: { borderRadius: 8, fontSize: 14 },
            }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#e5e7eb' } } }}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gray-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
              style={{
                background: selectedCat === cat ? '#4361ee' : '#f3f4f6',
                color: selectedCat === cat ? '#fff' : '#6b7280',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => p.stock > 0 && addToCart(p)}
              disabled={p.stock === 0}
              className="bg-gray-50 rounded-xl p-3 text-left hover:bg-blue-50 hover:border-blue-300 border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl mb-2">{p.emoji}</div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{p.name}</p>
              <p className="text-xs font-bold mt-1" style={{ color: '#4361ee' }}>{fmt(p.price)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {p.stock > 0 ? `${p.stock} ta qoldi` : 'Tugagan'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-72 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-sm">Savat</h2>
          <Chip
            label={`${cart.length} ta`}
            size="small"
            sx={{ bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 700, fontSize: 11 }}
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <CategoryOutlined style={{ fontSize: 40 }} />
              <p className="text-xs mt-2">Savat bo'sh</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">{item.name}</p>
                  <p className="text-xs text-blue-600 font-medium">{fmt(item.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton size="small" onClick={() => updateQty(item.id, -1)} sx={{ p: 0.3 }}>
                    <Remove style={{ fontSize: 14 }} />
                  </IconButton>
                  <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                  <IconButton size="small" onClick={() => updateQty(item.id, 1)} sx={{ p: 0.3 }}>
                    <Add style={{ fontSize: 14 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeItem(item.id)} sx={{ p: 0.3 }}>
                    <Delete style={{ fontSize: 14, color: '#ef4444' }} />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="p-4 border-t border-gray-100">
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Jami mahsulot:</span>
              <span className="font-medium text-gray-700">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Soliq (12%):</span>
              <span className="font-medium text-gray-700">{fmt(tax)}</span>
            </div>
            <Divider sx={{ my: 0.5 }} />
            <div className="flex justify-between text-sm font-bold text-gray-800">
              <span>Jami:</span>
              <span style={{ color: '#4361ee' }}>{fmt(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="flex gap-1.5 mb-3">
            {['Naqd', 'Karta', 'Online'].map((m) => (
              <button
                key={m}
                onClick={() => setPayMethod(m)}
                className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                style={{
                  background: payMethod === m ? '#4361ee' : '#f3f4f6',
                  color: payMethod === m ? '#fff' : '#6b7280',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCartCheckout />}
            onClick={checkout}
            disabled={cart.length === 0}
            sx={{
              bgcolor: '#4361ee',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              py: 1.2,
              '&:hover': { bgcolor: '#3451d1' },
            }}
          >
            To'lov qilish
          </Button>
        </div>
      </div>
    </div>
  );
}
