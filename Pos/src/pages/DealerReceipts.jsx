import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, LocalShipping, CalendarToday, ArrowBack, CheckCircle, WarningAmber } from '@mui/icons-material';
import { Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { typeLabels } from '../config/dealerProducts';
import { formatCurrency } from '../utils/format';

export default function DealerReceipts() {
  const { dealerOrders, setDealerOrders, updateProductStock, activeBusinessWarehouses, selectedWarehouseId, setSelectedWarehouseId, currentBusinessId } = useApp();
  const [search, setSearch] = useState('');
  
  // State for active Prixod form
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [damagedQty, setDamagedQty] = useState('0');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));

  const businessOrders = dealerOrders.filter(o => o.businessId === currentBusinessId);
  const pendingOrders = businessOrders.filter(o => o.status === 'Kutilmoqda');

  const filtered = pendingOrders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const startReceipt = (order) => {
    setActiveReceiptOrder(order);
    // Default received quantity to the ordered quantity
    const firstItemQty = order.items[0]?.quantity || 0;
    setReceivedQty(String(firstItemQty));
    setDamagedQty('0');
    setReceiptDate(new Date().toISOString().slice(0, 10));
  };

  const handleConfirmReceipt = () => {
    if (!activeReceiptOrder || !receivedQty) return;
    
    const recQtyVal = parseInt(receivedQty, 10);
    const dmgQtyVal = parseInt(damagedQty, 10) || 0;
    
    // Update the order in global state
    setDealerOrders(prev => prev.map(order => {
      if (order.id === activeReceiptOrder.id) {
        return {
          ...order,
          status: 'Yetkazilgan',
          receiptDate: receiptDate,
          items: order.items.map(item => ({
            ...item,
            receivedQty: recQtyVal,
            damagedQty: dmgQtyVal
          }))
        };
      }
      return order;
    }));

    // Add received items to the current warehouse stock
    const firstItem = activeReceiptOrder.items[0];
    if (firstItem) {
      updateProductStock(firstItem.productId, recQtyVal, selectedWarehouseId);
    }

    alert("Prixod muvaffaqiyatli qabul qilindi va mahsulotlar skladga qo'shildi!");
    setActiveReceiptOrder(null);
  };

  if (activeReceiptOrder) {
    const item = activeReceiptOrder.items[0];
    return (
      <div className="space-y-4 max-w-lg bg-white p-6 rounded-xl shadow-sm">
        {/* Header with back button */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Button
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => setActiveReceiptOrder(null)}
            sx={{ textTransform: 'none' }}
          >
            Orqaga
          </Button>
          <h1 className="text-lg font-bold text-gray-800">Prixod Qabul Qilish ({activeReceiptOrder.id})</h1>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-1">
          <p><span className="text-gray-500">Diler:</span> <b>{activeReceiptOrder.supplierName}</b></p>
          <p><span className="text-gray-500">Zakaz sanasi:</span> <b>{activeReceiptOrder.date}</b></p>
          {item && (
            <>
              <p><span className="text-gray-500">Mahsulot:</span> <b>{item.name}</b></p>
              <p><span className="text-gray-500">Buyurtma qilingan:</span> <b>{item.quantity} ta ({typeLabels[item.type] || item.type}, {item.size})</b></p>
            </>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-4 pt-2">
          {activeBusinessWarehouses.length > 1 && (
            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
              <InputLabel id="warehouse-select-label">Sklad (Kirim qilinadigan ombor)</InputLabel>
              <Select
                labelId="warehouse-select-label"
                label="Sklad (Kirim qilinadigan ombor)"
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(parseInt(e.target.value, 10))}
                MenuProps={{ disablePortal: true }}
              >
                {activeBusinessWarehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Kelgan miqdor (ta)"
              type="number"
              value={receivedQty}
              onChange={(e) => setReceivedQty(e.target.value)}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              label="Brak / Kam kelgan (ta)"
              type="number"
              value={damagedQty}
              onChange={(e) => setDamagedQty(e.target.value)}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
          </div>

          <TextField
            label="Qabul qilingan sana"
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />

          <Button
            variant="contained"
            fullWidth
            startIcon={<CheckCircle />}
            onClick={handleConfirmReceipt}
            sx={{ bgcolor: '#22c55e', borderRadius: 2, textTransform: 'none', py: 1.2, fontWeight: 700, '&:hover': { bgcolor: '#16a34a' } }}
          >
            Prixodni Skladga Qabul Qilish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dilerlar - Prixod (Kirim / Qabul)</h1>
        <p className="text-sm text-gray-500">Dilerlardan kutilayotgan buyurtmalarni omborga qabul qilish</p>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Kutilayotgan zakaz yoki diler qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[300px]">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Zakaz ID</TableCell>
                <TableCell>Diler</TableCell>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Buyurtma Miqdori</TableCell>
                <TableCell>Jami Summa</TableCell>
                <TableCell>Zakaz Sanasi</TableCell>
                <TableCell>Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                    <LocalShipping className="mb-2 text-gray-300" style={{ fontSize: 40 }} />
                    <p className="text-sm">Kutilayotgan prixodlar (zakazlar) mavjud emas</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => {
                  const item = o.items[0];
                  return (
                    <TableRow key={o.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#374151' }}>{o.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{o.supplierName}</TableCell>
                      <TableCell>{item ? item.name : '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item ? `${item.quantity} ta` : '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4361ee' }}>{formatCurrency(o.total)}</TableCell>
                      <TableCell sx={{ color: '#9ca3af' }}>{o.date}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => startReceipt(o)}
                          sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', fontSize: 12, '&:hover': { bgcolor: '#3451d1' } }}
                        >
                          Qabul qilish (Prixod)
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
