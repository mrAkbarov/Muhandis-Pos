import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Add, Search, Edit, Delete, FilterList, ArrowBack, ArrowForward,
} from '@mui/icons-material';
import {
  Button, Chip, IconButton, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox
} from '@mui/material';

import { formatCurrency } from '../utils/format';

const stockStatus = (qty) => {
  if (qty === 0) return { label: 'Tugagan', bg: '#fee2e2', color: '#ef4444' };
  if (qty <= 5) return { label: 'Kam', bg: '#fff7ed', color: '#f97316' };
  return { label: 'Yetarli', bg: '#f0fdf4', color: '#22c55e' };
};

export default function Products() {
  const {
    getBusinessProducts,
    categories,
    currentBusinessId,
    selectedWarehouseId,
    getProductStock,
    setProducts,
    setInventory
  } = useApp();

  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', barcode: '', image: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const businessProducts = getBusinessProducts();

  const filtered = businessProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', category: categories[0] || '', price: '', cost: '', barcode: '', image: '' });
    setOpenDialog(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      cost: p.cost,
      barcode: p.barcode || '',
      image: p.image || ''
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    const newPrice = parseFloat(form.price) || 0;
    const newCost = parseFloat(form.cost) || 0;

    let savedProductId = editProduct ? editProduct.id : Date.now();

    if (editProduct) {
      setProducts((prev) => prev.map((p) =>
        p.id === editProduct.id ? {
          ...p,
          name: form.name,
          category: form.category,
          price: newPrice,
          cost: newCost,
          barcode: form.barcode,
          image: form.image,
          isDraft: false
        } : p
      ));
    } else {
      setProducts((prev) => [...prev, {
        id: savedProductId,
        name: form.name,
        category: form.category,
        price: newPrice,
        cost: newCost,
        barcode: form.barcode,
        image: form.image,
        isDraft: false,
        businessId: currentBusinessId
      }]);

      // Initialize stock to 0 in inventory for the selected warehouse
      setInventory((prev) => {
        const idx = prev.findIndex(i => i.productId === savedProductId && i.warehouseId === selectedWarehouseId);
        if (idx >= 0) return prev;
        return [...prev, { id: Date.now() + Math.random(), productId: savedProductId, warehouseId: selectedWarehouseId, quantity: 0 }];
      });
    }

    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("O'chirishni tasdiqlaysizmi?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mahsulotlar</h1>
          <p className="text-sm text-gray-500">
            Jami {businessProducts.length} ta mahsulot
          </p>
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
          onChange={handleSearchChange}
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


      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
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
                <TableCell>Stock (Omborda)</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                    Mahsulotlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p, i) => {
                  const stock = getProductStock(p.id, selectedWarehouseId);
                  const status = stockStatus(stock);
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      onClick={() => openEdit(p)}
                      style={{ cursor: 'pointer' }}
                      sx={{ 
                        '& td': { py: 1.5, fontSize: 13 },
                        bgcolor: i % 2 === 0 ? '#ffffff' : '#f4f9ff',
                        '&:hover': {
                          bgcolor: i % 2 === 0 ? '#f1f5f9 !important' : '#eaf4ff !important'
                        }
                      }}
                    >
                      <TableCell sx={{ color: '#9ca3af' }}>{startIndex + i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-[#f2f2f2] flex items-center justify-center shrink-0 border border-[#e5e5e5] overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-800">{p.name}</p>
                            </div>
                            <p className="text-xs text-gray-400">{p.barcode || 'Shtrix-kod yo\'q'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.category} size="small" sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#4361ee' }}>{formatCurrency(p.price)}</TableCell>
                      <TableCell sx={{ color: '#6b7280' }}>{formatCurrency(p.cost)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#22c55e' }}>+{formatCurrency(p.price - p.cost)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{stock} ta</TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: status.bg, color: status.color, fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs text-gray-500">
            Jami {filtered.length} ta mahsulotdan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} ko'rsatilmoqda
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontSize: 11 }}
            >
              Oldingi
            </Button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border rounded-md">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              endIcon={<ArrowForward />}
              sx={{ textTransform: 'none', fontSize: 11 }}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <TextField
              label="Nomi"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
              <InputLabel id="category-select-label">Kategoriya</InputLabel>
              <Select
                labelId="category-select-label"
                label="Kategoriya"
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                MenuProps={{ disablePortal: true }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Narx (so'm)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              size="small"
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              label="Tannarx (so'm)"
              type="number"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Shtrix-kod"
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <div className="flex flex-col gap-1 justify-center">
              <label className="text-xs text-gray-500 font-semibold">Mahsulot rasmi (ixtiyoriy)</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ textTransform: 'none', fontSize: 12, py: 0.7 }}
                >
                  Rasm yuklash
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm(f => ({ ...f, image: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                {form.image && (
                  <div className="flex items-center gap-1">
                    <img src={form.image} alt="Preview" className="w-8 h-8 object-cover rounded border" />
                    <Button
                      color="error"
                      size="small"
                      onClick={() => setForm(f => ({ ...f, image: '' }))}
                      sx={{ textTransform: 'none', fontSize: 10, minWidth: 'auto', p: 0.5 }}
                    >
                      O'chirish
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
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
