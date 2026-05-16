import { useState } from 'react';
import {
  Add, Search, Edit, Delete, FilterList,
} from '@mui/icons-material';
import {
  Button, Chip, IconButton, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

const initialProducts = [
  { id: 1, name: 'Cola 1L', category: 'Ichimliklar', price: 10000, cost: 7000, stock: 45, barcode: '8901234567890', emoji: '🥤' },
  { id: 2, name: 'Pepsi 1L', category: 'Ichimliklar', price: 9500, cost: 6500, stock: 30, barcode: '8901234567891', emoji: '🥤' },
  { id: 3, name: 'Non (Tandir)', category: 'Oziq-ovqat', price: 8000, cost: 4000, stock: 20, barcode: '8901234567892', emoji: '🫓' },
  { id: 4, name: "Lay's Chips", category: 'Shirinliklar', price: 12000, cost: 8000, stock: 50, barcode: '8901234567893', emoji: '🍟' },
  { id: 5, name: 'Snickers 50g', category: 'Shirinliklar', price: 9000, cost: 6000, stock: 60, barcode: '8901234567894', emoji: '🍫' },
  { id: 6, name: 'Smetana 20%', category: 'Sut mahsulotlari', price: 15000, cost: 10000, stock: 10, barcode: '8901234567895', emoji: '🥛' },
  { id: 7, name: 'Qatiq', category: 'Sut mahsulotlari', price: 11000, cost: 7500, stock: 8, barcode: '8901234567896', emoji: '🥛' },
  { id: 8, name: 'Shakar 1kg', category: 'Oziq-ovqat', price: 18000, cost: 13000, stock: 3, barcode: '8901234567897', emoji: '🍬' },
  { id: 9, name: 'Tuz 1kg', category: 'Kraxmal', price: 5000, cost: 3000, stock: 0, barcode: '8901234567898', emoji: '🧂' },
  { id: 10, name: 'Sut 1L', category: 'Sut mahsulotlari', price: 13000, cost: 9000, stock: 5, barcode: '8901234567899', emoji: '🥛' },
];

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";

const stockStatus = (qty) => {
  if (qty === 0) return { label: 'Tugagan', bg: '#fee2e2', color: '#ef4444' };
  if (qty <= 5) return { label: 'Kam', bg: '#fff7ed', color: '#f97316' };
  return { label: 'Yetarli', bg: '#f0fdf4', color: '#22c55e' };
};

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', stock: '', barcode: '', emoji: '📦' });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', category: '', price: '', cost: '', stock: '', barcode: '', emoji: '📦' });
    setOpenDialog(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, price: p.price, cost: p.cost, stock: p.stock, barcode: p.barcode, emoji: p.emoji });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editProduct) {
      setProducts((prev) => prev.map((p) =>
        p.id === editProduct.id ? { ...p, ...form, price: +form.price, cost: +form.cost, stock: +form.stock } : p
      ));
    } else {
      setProducts((prev) => [...prev, {
        id: Date.now(), ...form,
        price: +form.price, cost: +form.cost, stock: +form.stock,
      }]);
    }
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("O'chirishni tasdiqlaysizmi?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mahsulotlar</h1>
          <p className="text-sm text-gray-500">{products.length} ta mahsulot</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAdd}
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
        >
          Mahsulot qo'shish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Mahsulot qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#6b7280', borderColor: '#e5e7eb', fontSize: 13 }}
        >
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>#</TableCell>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Narx</TableCell>
                <TableCell>Tannarx</TableCell>
                <TableCell>Foyda</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Holat</TableCell>
                <TableCell>Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p, i) => {
                const status = stockStatus(p.stock);
                return (
                  <TableRow key={p.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                    <TableCell sx={{ color: '#9ca3af' }}>{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.emoji}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.barcode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.category} size="small" sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4361ee' }}>{fmt(p.price)}</TableCell>
                    <TableCell sx={{ color: '#6b7280' }}>{fmt(p.cost)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#22c55e' }}>+{fmt(p.price - p.cost)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.stock} ta</TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ fontSize: 11, bgcolor: status.bg, color: status.color, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <IconButton size="small" onClick={() => openEdit(p)}>
                          <Edit style={{ fontSize: 16, color: '#4361ee' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(p.id)}>
                          <Delete style={{ fontSize: 16, color: '#ef4444' }} />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          {editProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Nomi', field: 'name' },
            { label: 'Kategoriya', field: 'category' },
            { label: 'Narx (so\'m)', field: 'price', type: 'number' },
            { label: 'Tannarx (so\'m)', field: 'cost', type: 'number' },
            { label: 'Miqdor', field: 'stock', type: 'number' },
            { label: 'Shtrix-kod', field: 'barcode' },
          ].map(({ label, field, type }) => (
            <TextField
              key={field}
              label={label}
              type={type || 'text'}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Bekor qilish</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
