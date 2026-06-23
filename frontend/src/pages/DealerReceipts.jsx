import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, LocalShipping, CheckCircle } from '@mui/icons-material';
import {
  Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import { typeLabels, formatProductSizeDisplay } from '../config/dealerProducts';
import { formatCurrency } from '../utils/format';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } };

function formatLineLabel(item) {
  const size = formatProductSizeDisplay(item);
  const type = typeLabels[item.type] || item.type || '';
  const parts = [item.name, size, type].filter(Boolean);
  return parts.join(' · ');
}

export default function DealerReceipts() {
  const {
    dealerOrders, activeBusinessWarehouses, selectedWarehouseId,
    setSelectedWarehouseId, currentBusinessId, confirmPurchaseReceipt, saving,
  } = useApp();
  const [search, setSearch] = useState('');
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);
  const [lineReceipts, setLineReceipts] = useState({});
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const businessOrders = dealerOrders.filter(o => o.businessId === currentBusinessId);
  const pendingOrders = businessOrders.filter(o => o.status === 'Kutilmoqda');

  const filtered = pendingOrders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const startReceipt = (order) => {
    const initial = {};
    for (const item of order.items || []) {
      if (item.lineId) {
        initial[item.lineId] = {
          received_qty: String(item.quantity ?? 0),
          damaged_qty: '0',
        };
      }
    }
    setLineReceipts(initial);
    setActiveReceiptOrder(order);
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  const updateLine = (lineId, field, value) => {
    setLineReceipts((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: value },
    }));
  };

  const handleConfirmReceipt = async () => {
    if (!activeReceiptOrder) return;
    setError('');

    const lines = (activeReceiptOrder.items || []).map((item) => {
      const row = lineReceipts[item.lineId] || {};
      return {
        line_id: item.lineId,
        received_qty: parseInt(row.received_qty, 10) || 0,
        damaged_qty: parseInt(row.damaged_qty, 10) || 0,
      };
    }).filter((l) => l.line_id);

    if (!lines.length) {
      setError('Buyurtma qatorlari topilmadi');
      return;
    }
    if (!lines.some((l) => l.received_qty > 0)) {
      setError('Kamida bitta mahsulot uchun kelgan miqdorni kiriting');
      return;
    }

    const result = await confirmPurchaseReceipt(activeReceiptOrder.dbId, {
      warehouseId: selectedWarehouseId,
      receiptDate,
      lines,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    alert("Prixod muvaffaqiyatli qabul qilindi va mahsulotlar skladga qo'shildi!");
    setActiveReceiptOrder(null);
    setLineReceipts({});
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dilerlar - Prixod (Qabul)</h1>
        <p className="text-sm text-gray-500">{pendingOrders.length} ta kutilayotgan buyurtma</p>
      </div>

      <TextField size="small" placeholder="Qidirish..." value={search}
        onChange={(e) => setSearch(e.target.value)} sx={{ width: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                <TableCell>ID</TableCell>
                <TableCell>Diler</TableCell>
                <TableCell>Summa</TableCell>
                <TableCell>Sana</TableCell>
                <TableCell align="right">Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9ca3af' }}>Kutilayotgan buyurtmalar yo&apos;q</TableCell></TableRow>
              ) : filtered.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.supplierName}</TableCell>
                  <TableCell>{formatCurrency(o.total)}</TableCell>
                  <TableCell>{o.date}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" startIcon={<LocalShipping />}
                      onClick={() => startReceipt(o)}
                      sx={{ bgcolor: '#4361ee', textTransform: 'none', fontSize: 12 }}>Qabul qilish</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          Jami {filtered.length} ta buyurtma
        </div>
      </div>

      <Dialog
        open={!!activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {activeReceiptOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 1 }}>
              Prixod qabul qilish ({activeReceiptOrder.id})
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="bg-blue-50 p-4 rounded-xl text-sm space-y-1 border border-blue-100">
                <p><span className="text-gray-500">Diler:</span> <b>{activeReceiptOrder.supplierName}</b></p>
                <p><span className="text-gray-500">Zakaz sanasi:</span> <b>{activeReceiptOrder.date}</b></p>
                <p><span className="text-gray-500">Mahsulotlar:</span> <b>{activeReceiptOrder.items?.length || 0} ta qator</b></p>
              </div>

              {activeBusinessWarehouses.length > 1 && (
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel shrink>Ombor</InputLabel>
                  <Select label="Ombor" value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}>
                    {activeBusinessWarehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Buyurtmadagi mahsulotlar</p>
                {(activeReceiptOrder.items || []).map((item) => {
                  const row = lineReceipts[item.lineId] || { received_qty: '', damaged_qty: '0' };
                  return (
                    <div key={item.lineId} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-800">{formatLineLabel(item)}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Buyurtma: <b>{item.quantity} ta</b>
                            {item.costPrice ? ` · ${formatCurrency(item.costPrice)} / dona` : ''}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[#4361ee]">
                          Jami: {formatCurrency((item.costPrice || 0) * (item.quantity || 0))}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextField
                          label="Kelgan miqdor (ta)"
                          type="number"
                          value={row.received_qty}
                          onChange={(e) => updateLine(item.lineId, 'received_qty', e.target.value)}
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={fieldSx}
                        />
                        <TextField
                          label="Shikastlangan"
                          type="number"
                          value={row.damaged_qty}
                          onChange={(e) => updateLine(item.lineId, 'damaged_qty', e.target.value)}
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={fieldSx}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Divider />

              <TextField label="Qabul sanasi" type="date" value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)} size="small" fullWidth
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => setActiveReceiptOrder(null)} sx={{ textTransform: 'none' }}>
                Bekor
              </Button>
              <Button variant="contained" disabled={saving} startIcon={<CheckCircle />}
                onClick={handleConfirmReceipt}
                sx={{ bgcolor: '#4361ee', textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}>
                Prixodni tasdiqlash
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
