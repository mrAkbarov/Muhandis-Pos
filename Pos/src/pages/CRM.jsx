import { useState } from 'react';
import {
  Add, Search, Phone, Email, Person,
} from '@mui/icons-material';
import {
  Button, Avatar, Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

const initialCustomers = [
  { id: 1, name: 'Akbar Toshmatov', phone: '+998901234567', email: 'akbar@mail.uz', totalPurchase: 1250000, visits: 23, lastVisit: '2025-05-18', level: 'Gold' },
  { id: 2, name: 'Zulfiya Karimova', phone: '+998912345678', email: 'zulfiya@mail.uz', totalPurchase: 980000, visits: 18, lastVisit: '2025-05-17', level: 'Silver' },
  { id: 3, name: 'Bobur Umarov', phone: '+998923456789', email: 'bobur@mail.uz', totalPurchase: 2300000, visits: 45, lastVisit: '2025-05-18', level: 'Platinum' },
  { id: 4, name: 'Malika Hasanova', phone: '+998934567890', email: 'malika@mail.uz', totalPurchase: 560000, visits: 9, lastVisit: '2025-05-16', level: 'Bronze' },
  { id: 5, name: 'Jasur Raximov', phone: '+998945678901', email: 'jasur@mail.uz', totalPurchase: 1800000, visits: 32, lastVisit: '2025-05-15', level: 'Gold' },
  { id: 6, name: 'Nodira Yusupova', phone: '+998956789012', email: 'nodira@mail.uz', totalPurchase: 320000, visits: 5, lastVisit: '2025-05-13', level: 'Bronze' },
  { id: 7, name: 'Sanjar Mirzayev', phone: '+998967890123', email: 'sanjar@mail.uz', totalPurchase: 3100000, visits: 58, lastVisit: '2025-05-18', level: 'Platinum' },
];

const levelColors = {
  Platinum: { bg: '#f0f0ff', color: '#6366f1', border: '#a5b4fc' },
  Gold: { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  Silver: { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  Bronze: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
};

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";

const avatarColor = (name) => {
  const colors = ['#4361ee', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function CRM() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', level: 'Bronze' });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    setCustomers((prev) => [...prev, {
      id: Date.now(), ...form,
      totalPurchase: 0, visits: 0, lastVisit: new Date().toISOString().slice(0, 10),
    }]);
    setForm({ name: '', phone: '', email: '', level: 'Bronze' });
    setOpenDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">CRM — Mijozlar</h1>
          <p className="text-sm text-gray-500">{customers.length} ta mijoz ro'yxatda</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
        >
          Mijoz qo'shish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Jami mijozlar', value: customers.length, color: '#4361ee', bg: '#eef0ff' },
          { label: 'Platinum', value: customers.filter((c) => c.level === 'Platinum').length, color: '#6366f1', bg: '#f0f0ff' },
          { label: 'Gold', value: customers.filter((c) => c.level === 'Gold').length, color: '#d97706', bg: '#fffbeb' },
          { label: 'Bugun kelganlar', value: customers.filter((c) => c.lastVisit === '2025-05-18').length, color: '#22c55e', bg: '#f0fdf4' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Ism yoki telefon raqam bo'yicha qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
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
                <TableCell>Mijoz</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Jami xarid</TableCell>
                <TableCell>Tashriflar</TableCell>
                <TableCell>So'nggi tashrif</TableCell>
                <TableCell>Daraja</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => {
                const lc = levelColors[c.level] || levelColors.Bronze;
                return (
                  <TableRow key={c.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: avatarColor(c.name) }}>
                          {c.name.charAt(0)}
                        </Avatar>
                        <span className="font-semibold text-gray-800">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone style={{ fontSize: 14, color: '#9ca3af' }} /> {c.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Email style={{ fontSize: 14, color: '#9ca3af' }} /> {c.email}
                      </div>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4361ee' }}>{fmt(c.totalPurchase)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.visits} marta</TableCell>
                    <TableCell sx={{ color: '#9ca3af' }}>{c.lastVisit}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.level}
                        size="small"
                        sx={{ fontSize: 11, bgcolor: lc.bg, color: lc.color, fontWeight: 700, border: `1px solid ${lc.border}` }}
                      />
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
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Yangi mijoz qo'shish</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Ism familiya', field: 'name' },
            { label: 'Telefon', field: 'phone' },
            { label: 'Email', field: 'email' },
          ].map(({ label, field }) => (
            <TextField
              key={field}
              label={label}
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
          <Button onClick={handleSave} variant="contained"
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
