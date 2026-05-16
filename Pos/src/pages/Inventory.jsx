import { useState } from 'react';
import {
  Add, Search, TrendingDown, TrendingUp,
} from '@mui/icons-material';
import {
  Button, Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress,
} from '@mui/material';

const inventoryData = [
  { id: 1, name: 'Cola 1L', emoji: '🥤', category: 'Ichimliklar', current: 45, min: 20, max: 100, unit: 'ta', lastUpdate: '2025-05-18' },
  { id: 2, name: 'Pepsi 1L', emoji: '🥤', category: 'Ichimliklar', current: 30, min: 20, max: 80, unit: 'ta', lastUpdate: '2025-05-17' },
  { id: 3, name: 'Non (Tandir)', emoji: '🫓', category: 'Oziq-ovqat', current: 20, min: 30, max: 100, unit: 'ta', lastUpdate: '2025-05-18' },
  { id: 4, name: "Yog' 1L", emoji: '🫙', category: 'Oziq-ovqat', current: 1, min: 10, max: 50, unit: 'ta', lastUpdate: '2025-05-16' },
  { id: 5, name: 'Shakar 1kg', emoji: '🍬', category: 'Oziq-ovqat', current: 3, min: 15, max: 60, unit: 'kg', lastUpdate: '2025-05-15' },
  { id: 6, name: 'Tuz 1kg', emoji: '🧂', category: 'Kraxmal', current: 0, min: 10, max: 40, unit: 'kg', lastUpdate: '2025-05-14' },
  { id: 7, name: 'Pepsi 1L', emoji: '🥤', category: 'Ichimliklar', current: 2, min: 10, max: 50, unit: 'ta', lastUpdate: '2025-05-18' },
  { id: 8, name: 'Smetana 20%', emoji: '🥛', category: 'Sut mahsulotlari', current: 10, min: 5, max: 30, unit: 'ta', lastUpdate: '2025-05-18' },
  { id: 9, name: 'Qatiq', emoji: '🥛', category: 'Sut mahsulotlari', current: 8, min: 10, max: 40, unit: 'ta', lastUpdate: '2025-05-17' },
  { id: 10, name: "Lay's Chips", emoji: '🍟', category: 'Shirinliklar', current: 50, min: 15, max: 80, unit: 'ta', lastUpdate: '2025-05-16' },
];

const statusInfo = (current, min) => {
  if (current === 0) return { label: 'Tugagan', bg: '#fee2e2', color: '#ef4444' };
  if (current < min) return { label: 'Kam', bg: '#fff7ed', color: '#f97316' };
  return { label: 'Yetarli', bg: '#f0fdf4', color: '#22c55e' };
};

export default function Inventory() {
  const [search, setSearch] = useState('');

  const filtered = inventoryData.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = inventoryData.filter((p) => p.current < p.min).length;
  const outOfStock = inventoryData.filter((p) => p.current === 0).length;
  const healthy = inventoryData.filter((p) => p.current >= p.min).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500">Mahsulotlar qoldig'ini boshqarish</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
        >
          Kirim qilish
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Yetarli mahsulotlar', value: healthy, color: '#22c55e', bg: '#f0fdf4', icon: <TrendingUp style={{ color: '#22c55e', fontSize: 20 }} /> },
          { label: 'Kam qolganlar', value: lowStock, color: '#f97316', bg: '#fff7ed', icon: <TrendingDown style={{ color: '#f97316', fontSize: 20 }} /> },
          { label: "Tugaganlar", value: outOfStock, color: '#ef4444', bg: '#fee2e2', icon: <TrendingDown style={{ color: '#ef4444', fontSize: 20 }} /> },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Joriy miqdor</TableCell>
                <TableCell>Min / Max</TableCell>
                <TableCell>Dolbosad</TableCell>
                <TableCell>Holat</TableCell>
                <TableCell>So'nggi yangilanish</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item) => {
                const status = statusInfo(item.current, item.min);
                const pct = Math.min((item.current / item.max) * 100, 100);
                return (
                  <TableRow key={item.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="font-semibold text-gray-800">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small" sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: status.color }}>
                      {item.current} {item.unit}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280' }}>
                      {item.min} / {item.max} {item.unit}
                    </TableCell>
                    <TableCell sx={{ width: 120 }}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6, borderRadius: 3, bgcolor: '#f3f4f6',
                          '& .MuiLinearProgress-bar': { bgcolor: status.color, borderRadius: 3 },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} size="small"
                        sx={{ fontSize: 11, bgcolor: status.bg, color: status.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#9ca3af' }}>{item.lastUpdate}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
