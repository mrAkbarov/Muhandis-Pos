import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Add, CalendarToday, ArrowBack, ArrowForward, Delete, Print } from '@mui/icons-material';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Autocomplete, IconButton } from '@mui/material';

const itemsPerPage = 5;

const productConfig = {
  1: { // Cola 1L
    types: [
      { value: 'shakarli', label: 'Shakarli' },
      { value: 'shakarsiz', label: 'Shakarsiz' }
    ],
    sizes: ['0.5L', '1.0L', '1.5L', '2.0L']
  },
  2: { // Pepsi 1L
    types: [
      { value: 'shakarli', label: 'Shakarli' },
      { value: 'shakarsiz', label: 'Shakarsiz' }
    ],
    sizes: ['0.5L', '1.0L', '1.5L', '2.0L']
  },
  3: { // Non (Tandir)
    types: [
      { value: 'tuzli', label: 'Tuzli' },
      { value: 'tuzsiz', label: 'Tuzsiz' }
    ],
    sizes: ['300g', '500g']
  },
  4: { // Lay's Chips
    types: [
      { value: 'tuzli', label: 'Tuzli' },
      { value: 'tuzsiz', label: 'Tuzsiz' }
    ],
    sizes: ['26g', '50g', '90g', '140g']
  },
  5: { // Snickers 50g
    types: [
      { value: 'standart', label: 'Standart' }
    ],
    sizes: ['50g', '80g']
  },
  6: { // Smetana 20%
    types: [
      { value: 'standart', label: 'Standart' }
    ],
    sizes: ['200g', '400g']
  },
  7: { // Qatiq
    types: [
      { value: 'standart', label: 'Standart' }
    ],
    sizes: ['500g', '1000g']
  }
};

const defaultProductConfig = {
  types: [
    { value: 'standart', label: 'Standart' }
  ],
  sizes: ['1 ta', '5 ta', '10 ta']
};

const typeLabels = {
  tuzli: 'Tuzli',
  tuzsiz: 'Tuzsiz',
  shakarli: 'Shakarli',
  shakarsiz: 'Shakarsiz',
  standart: 'Standart'
};

export default function DealerOrders() {
  const { dealerOrders, setDealerOrders, suppliers, getBusinessProducts, currentBusinessId } = useApp();
  const [search, setSearch] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [itemsList, setItemsList] = useState([]);
  const [itemForm, setItemForm] = useState({
    productId: '',
    qty: '',
    blocksCount: '',
    itemsPerBlock: '',
    type: '',
    size: '',
    costPrice: ''
  });

  const businessSuppliers = suppliers.filter(s => s.businessId === currentBusinessId);
  const businessProducts = getBusinessProducts();
  const businessOrders = dealerOrders.filter(o => o.businessId === currentBusinessId);

  const filtered = businessOrders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleBlocksChange = (val, field) => {
    setItemForm(prev => {
      const updated = { ...prev };
      if (field === 'blocksCount') {
        updated.blocksCount = val;
      } else {
        updated.itemsPerBlock = val;
      }
      const b = parseInt(updated.blocksCount, 10);
      const i = parseInt(updated.itemsPerBlock, 10);
      if (!isNaN(b) && !isNaN(i)) {
        updated.qty = String(b * i);
      }
      return updated;
    });
  };

  const handleAddItemToList = () => {
    if (!itemForm.productId || !itemForm.qty || !itemForm.costPrice) return;
    const prod = businessProducts.find(p => p.id === parseInt(itemForm.productId, 10));
    if (!prod) return;

    let unit = 'ta';
    if (itemForm.size.endsWith('L')) {
      unit = 'litr';
    } else if (itemForm.size.endsWith('g')) {
      unit = 'gr';
    } else if (itemForm.size.endsWith(' ta')) {
      unit = 'ta';
    }

    const newItem = {
      productId: prod.id,
      name: prod.name,
      quantity: parseInt(itemForm.qty, 10),
      blocksCount: itemForm.blocksCount ? parseInt(itemForm.blocksCount, 10) : null,
      itemsPerBlock: itemForm.itemsPerBlock ? parseInt(itemForm.itemsPerBlock, 10) : null,
      type: itemForm.type,
      size: itemForm.size,
      unit: unit,
      costPrice: parseFloat(itemForm.costPrice)
    };

    setItemsList(prev => [...prev, newItem]);
    
    // Clear item form state
    setItemForm({
      productId: '',
      qty: '',
      blocksCount: '',
      itemsPerBlock: '',
      type: '',
      size: '',
      costPrice: ''
    });
  };

  const handleRemoveItem = (index) => {
    setItemsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedSupplierId || itemsList.length === 0) return;
    const sup = suppliers.find(s => s.id === parseInt(selectedSupplierId, 10));
    if (!sup) return;

    const totalVal = itemsList.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
    const newOrder = {
      id: `PO-${String(dealerOrders.length + 1).padStart(3, '0')}`,
      supplierId: sup.id,
      supplierName: sup.name,
      date: new Date().toISOString().slice(0, 10),
      businessId: currentBusinessId,
      items: itemsList,
      total: totalVal,
      status: 'Kutilmoqda'
    };

    setDealerOrders(prev => [newOrder, ...prev]);
    
    // Reset states
    setSelectedSupplierId('');
    setItemsList([]);
    setItemForm({
      productId: '',
      qty: '',
      blocksCount: '',
      itemsPerBlock: '',
      type: '',
      size: '',
      costPrice: ''
    });
    setOpenAddDialog(false);
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; text-align: left;">${idx + 1}</td>
        <td style="padding: 10px; text-align: left;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 11px; color: #718096;">Turi: ${typeLabels[item.type] || item.type}, O'lchovi: ${item.size || '—'}</span>
        </td>
        <td style="padding: 10px; text-align: center;">
          ${item.blocksCount ? `${item.blocksCount} blok x ${item.itemsPerBlock || 1} ta<br/>` : ''}
          ${item.quantity} ${item.unit || 'ta'}
        </td>
        <td style="padding: 10px; text-align: right;">${item.costPrice.toLocaleString('uz-UZ')} so'm</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">${(item.quantity * item.costPrice).toLocaleString('uz-UZ')} so'm</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
      <head>
        <title>Buyurtma ${order.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #2d3748; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #1a365d; }
          .info-block { display: flex; justify-content: space-between; margin-bottom: 30px; line-height: 1.6; }
          .info-col { width: 48%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f7fafc; color: #4a5568; padding: 12px 10px; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
          .total-section { display: flex; justify-content: flex-end; font-size: 18px; font-weight: bold; color: #2b6cb0; border-top: 2px solid #e2e8f0; padding-top: 15px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { margin: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="background-color: #4361ee; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">Chop etish / PDF yuklash</button>
        </div>
        <div class="header">
          <div>
            <div class="title">BUYURTMA INVOYS</div>
            <div style="font-size: 14px; color: #718096; margin-top: 5px;">ID: ${order.id}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 18px; color: #2b6cb0;">ERP & POS TIZIMI</div>
            <div style="font-size: 12px; color: #718096;">Sana: ${order.date}</div>
          </div>
        </div>
        
        <div class="info-block">
          <div class="info-col">
            <h4 style="margin: 0 0 8px 0; color: #4a5568;">Yetkazib beruvchi (Diler):</h4>
            <strong>${order.supplierName}</strong><br/>
            Kompaniya ID: #${order.supplierId || '—'}
          </div>
          <div class="info-col" style="text-align: right;">
            <h4 style="margin: 0 0 8px 0; color: #4a5568;">Buyurtma holati:</h4>
            <span style="background-color: ${order.status === 'Yetkazilgan' ? '#c6f6d5' : '#feebc8'}; color: ${order.status === 'Yetkazilgan' ? '#22543d' : '#744210'}; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold;">
              ${order.status}
            </span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: left;">#</th>
              <th style="width: 45%; text-align: left;">Mahsulot nomi</th>
              <th style="width: 20%; text-align: center;">Miqdori</th>
              <th style="width: 15%; text-align: right;">Tannarxi</th>
              <th style="width: 15%; text-align: right;">Jami</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-section">
          Jami summa: &nbsp;&nbsp; ${order.total.toLocaleString('uz-UZ')} so'm
        </div>

        <div class="footer">
          Xaridingiz uchun rahmat! Tizim orqali avtomatik ravishda shakllantirildi.
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dilerlar - Zakaz (Buyurtmalar)</h1>
          <p className="text-sm text-gray-500">{businessOrders.length} ta dilerlar buyurtmasi</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAddDialog(true)}
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
        >
          Yangi buyurtma (Zakaz)
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Buyurtma ID yoki Diler qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Buyurtma ID</TableCell>
                <TableCell>Diler (Supplier)</TableCell>
                <TableCell>Jami Summa</TableCell>
                <TableCell>Sana</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                    <p className="text-sm">Buyurtmalar topilmadi</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((o, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <TableRow 
                      key={o.id} 
                      hover 
                      sx={{ 
                        '& td': { py: 1.5, fontSize: 13 },
                        bgcolor: isEven ? '#f4f9ff' : 'white',
                        '&:hover': { bgcolor: '#eaf4ff !important' }
                      }}
                    >
                      <TableCell>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="font-bold text-blue-600 hover:underline text-left cursor-pointer border-none bg-transparent p-0"
                        >
                          {o.id}
                        </button>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>{o.supplierName}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4361ee' }}>{fmt(o.total)}</TableCell>
                      <TableCell sx={{ color: '#9ca3af' }}>{o.date}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'Yetkazilgan' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {o.status}
                        </span>
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
            Jami {filtered.length} tadan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} ko'rsatilmoqda
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Oldingi
            </Button>
            <span className="text-xs font-semibold px-2 py-1 bg-white border rounded">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              endIcon={<ArrowForward />}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </div>

      {/* View Items Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 18, borderBottom: '1px solid #f1f5f9', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Buyurtma Tafsiloti ({selectedOrder.id})</span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Print />}
                onClick={() => handlePrint(selectedOrder)}
                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 12 }}
              >
                Chop etish / PDF
              </Button>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-1.5 border">
                <p><span className="text-gray-500">Diler:</span> <b>{selectedOrder.supplierName}</b></p>
                <p><span className="text-gray-500">Sana:</span> <b>{selectedOrder.date}</b></p>
                <p><span className="text-gray-500">Holat:</span> <b>{selectedOrder.status}</b></p>
                {selectedOrder.receiptDate && <p><span className="text-gray-500">Qabul qilingan sana:</span> <b>{selectedOrder.receiptDate}</b></p>}
              </div>
              <p className="font-bold text-xs text-gray-500 mt-2 uppercase tracking-wider">Xarid qilingan mahsulotlar</p>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-white hover:shadow-sm transition-all duration-200 grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <p className="font-bold text-gray-800">{item.name}</p>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Soni: <span className="font-semibold text-gray-700">{item.quantity} {item.unit || 'ta'}</span></p>
                      {item.blocksCount && (
                        <p className="text-[10px] text-blue-600">Blok: {item.blocksCount} blk x {item.itemsPerBlock} ta</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 text-right">
                      <p>Narxi: <span className="font-semibold text-gray-700">{fmt(item.costPrice)}</span></p>
                      <p className="font-bold text-blue-600">Jami: {fmt(item.quantity * item.costPrice)}</p>
                    </div>
                    <div className="col-span-2 text-xs text-gray-400 border-t pt-1.5 flex gap-3">
                      <span>Turi: {typeLabels[item.type] || item.type}</span>
                      <span>O'lchovi: {item.size || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                <span className="font-bold text-gray-700">Jami buyurtma summasi:</span>
                <span className="font-extrabold text-blue-600 text-lg">{fmt(selectedOrder.total)}</span>
              </div>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
              <Button onClick={() => setSelectedOrder(null)} variant="contained"
                sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}>
                Yopish
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Yangi Buyurtma Yaratish (Zakaz)
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Supplier Selector */}
          <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
            <InputLabel id="supplier-select-label">Diler (Yetkazib beruvchi)</InputLabel>
            <Select
              labelId="supplier-select-label"
              label="Diler (Yetkazib beruvchi)"
              value={selectedSupplierId}
              disabled={itemsList.length > 0}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value=""><em>Dilerni tanlang</em></MenuItem>
              {businessSuppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          {selectedSupplierId && (
            <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-xl space-y-3">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Mahsulot qo'shish</p>
              
              {/* Product Autocomplete */}
              <Autocomplete
                size="small"
                options={businessProducts}
                getOptionLabel={(option) => option.name || ''}
                value={businessProducts.find(p => p.id === parseInt(itemForm.productId, 10)) || null}
                onChange={(event, newValue) => {
                  if (newValue) {
                    const pId = newValue.id;
                    const config = productConfig[pId] || defaultProductConfig;
                    setItemForm(prev => ({
                      ...prev,
                      productId: String(pId),
                      type: config.types[0]?.value || '',
                      size: config.sizes[0] || '',
                      costPrice: String(newValue.cost || '')
                    }));
                  } else {
                    setItemForm(prev => ({
                      ...prev,
                      productId: '',
                      type: '',
                      size: '',
                      costPrice: ''
                    }));
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Mahsulot qidirish..." />}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}
              />

              {itemForm.productId && (
                <>
                  {/* Blocks Multipliers (Optional) */}
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Blok soni"
                      type="number"
                      value={itemForm.blocksCount}
                      onChange={(e) => handleBlocksChange(e.target.value, 'blocksCount')}
                      size="small"
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}
                    />
                    <TextField
                      label="Blokdagi dona soni"
                      type="number"
                      value={itemForm.itemsPerBlock}
                      onChange={(e) => handleBlocksChange(e.target.value, 'itemsPerBlock')}
                      size="small"
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Jami dona (Soni)"
                      type="number"
                      value={itemForm.qty}
                      onChange={(e) => setItemForm(prev => ({ ...prev, qty: e.target.value }))}
                      size="small"
                      fullWidth
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}
                    />
                    <TextField
                      label="Tannarx (Kirim narxi)"
                      type="number"
                      value={itemForm.costPrice}
                      onChange={(e) => setItemForm(prev => ({ ...prev, costPrice: e.target.value }))}
                      size="small"
                      fullWidth
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}
                    />
                  </div>

                  {(() => {
                    const currentConfig = productConfig[parseInt(itemForm.productId, 10)] || defaultProductConfig;
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}>
                          <InputLabel id="type-select-label">Turi</InputLabel>
                          <Select
                            labelId="type-select-label"
                            label="Turi"
                            value={itemForm.type}
                            onChange={(e) => setItemForm(prev => ({ ...prev, type: e.target.value }))}
                            MenuProps={{ disablePortal: true }}
                          >
                            {currentConfig.types.map(t => (
                              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, bgcolor: 'white' }}>
                          <InputLabel id="size-select-label">Hajmi / O'lchovi</InputLabel>
                          <Select
                            labelId="size-select-label"
                            label="Hajmi / O'lchovi"
                            value={itemForm.size}
                            onChange={(e) => setItemForm(prev => ({ ...prev, size: e.target.value }))}
                            MenuProps={{ disablePortal: true }}
                          >
                            {currentConfig.sizes.map(sz => (
                              <MenuItem key={sz} value={sz}>{sz}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                    );
                  })()}

                  <div className="flex justify-end mt-1">
                    <Button
                      variant="contained"
                      onClick={handleAddItemToList}
                      sx={{ bgcolor: '#4361ee', textTransform: 'none', borderRadius: 1.5, px: 3 }}
                    >
                      Ro'yxatga qo'shish
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* List of items currently added */}
          {itemsList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buyurtmadagi mahsulotlar ro'yxati</p>
              <div className="border rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, py: 1 }}>Mahsulot</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, py: 1 }} align="center">Miqdor</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, py: 1 }} align="right">Narxi</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, py: 1 }} align="right">Jami</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, py: 1 }} align="center"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemsList.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: 11, py: 0.75 }}>
                          <div>
                            <b>{item.name}</b>
                            <div className="text-[10px] text-gray-400">
                              {typeLabels[item.type] || item.type} | {item.size || '—'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, py: 0.75 }} align="center">
                          {item.blocksCount ? `${item.blocksCount} blk x ${item.itemsPerBlock} ta` : `${item.quantity} ${item.unit}`}
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, py: 0.75 }} align="right">{fmt(item.costPrice)}</TableCell>
                        <TableCell sx={{ fontSize: 11, py: 0.75, fontWeight: 600 }} align="right">{fmt(item.quantity * item.costPrice)}</TableCell>
                        <TableCell sx={{ fontSize: 11, py: 0.75 }} align="center">
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                            <Delete style={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border text-sm font-bold text-gray-700">
                <span>Jami summa:</span>
                <span className="text-blue-600 text-base">
                  {fmt(itemsList.reduce((sum, item) => sum + item.quantity * item.costPrice, 0))}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => {
            setSelectedSupplierId('');
            setItemsList([]);
            setOpenAddDialog(false);
          }} sx={{ textTransform: 'none', color: '#6b7280' }}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedSupplierId || itemsList.length === 0}
            variant="contained"
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}
          >
            Zakaz Berish
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
