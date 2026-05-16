import { useState } from 'react';
import { FileDownload, CalendarToday, TrendingUp, TrendingDown } from '@mui/icons-material';
import { Button, Chip, MenuItem, Select } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const weeklyData = [
  { day: '12 May', sotuv: 8200000, foyda: 2100000, xarajat: 6100000 },
  { day: '13 May', sotuv: 9500000, foyda: 2500000, xarajat: 7000000 },
  { day: '14 May', sotuv: 7800000, foyda: 1900000, xarajat: 5900000 },
  { day: '15 May', sotuv: 11000000, foyda: 3200000, xarajat: 7800000 },
  { day: '16 May', sotuv: 10200000, foyda: 2800000, xarajat: 7400000 },
  { day: '17 May', sotuv: 9800000, foyda: 2600000, xarajat: 7200000 },
  { day: '18 May', sotuv: 12450000, foyda: 3250000, xarajat: 9200000 },
];

const categoryData = [
  { cat: 'Ichimliklar', sotuv: 4731000 },
  { cat: 'Oziq-ovqat', sotuv: 3112500 },
  { cat: 'Sut', sotuv: 2241000 },
  { cat: 'Shirinlik', sotuv: 1494000 },
  { cat: 'Boshqa', sotuv: 871500 },
];

const recentTransactions = [
  { id: 'TXN-001', time: '18:45', items: 3, amount: 32000, method: 'Naqd', cashier: 'Akmaljon' },
  { id: 'TXN-002', time: '18:30', items: 1, amount: 10000, method: 'Karta', cashier: 'Akmaljon' },
  { id: 'TXN-003', time: '18:15', items: 5, amount: 67500, method: 'Naqd', cashier: 'Akmaljon' },
  { id: 'TXN-004', time: '18:00', items: 2, amount: 18500, method: 'Online', cashier: 'Akmaljon' },
  { id: 'TXN-005', time: '17:45', items: 4, amount: 45000, method: 'Naqd', cashier: 'Akmaljon' },
];

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";
const fmtM = (n) => (n / 1000000).toFixed(1) + 'M';

const methodColor = { Naqd: '#22c55e', Karta: '#4361ee', Online: '#f59e0b' };

export default function Reports() {
  const [period, setPeriod] = useState('7 kun');

  const totalSotuv = weeklyData.reduce((s, d) => s + d.sotuv, 0);
  const totalFoyda = weeklyData.reduce((s, d) => s + d.foyda, 0);
  const avgOrder = Math.round(totalSotuv / 47);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hisobotlar</h1>
          <p className="text-sm text-gray-500">Sotuv va moliyaviy hisobotlar</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} size="small"
            sx={{ fontSize: 13, height: 36, minWidth: 100, borderRadius: 1.5 }}>
            <MenuItem value="7 kun" sx={{ fontSize: 13 }}>7 kun</MenuItem>
            <MenuItem value="30 kun" sx={{ fontSize: 13 }}>30 kun</MenuItem>
            <MenuItem value="Yil" sx={{ fontSize: 13 }}>Yil</MenuItem>
          </Select>
          <Button variant="outlined" startIcon={<FileDownload />}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 13, color: '#4361ee', borderColor: '#4361ee' }}>
            Excel
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Jami sotuv', value: fmt(totalSotuv), sub: '+18.5% o\'sish', positive: true },
          { label: 'Umumiy foyda', value: fmt(totalFoyda), sub: '+22.1% o\'sish', positive: true },
          { label: 'Jami tranzaksiyalar', value: '47 ta', sub: '+5 ta yangi', positive: true },
          { label: 'O\'rtacha order', value: fmt(avgOrder), sub: '-3.2% kamaygan', positive: false },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-gray-800">{s.value}</p>
            <p className="text-xs mt-0.5 flex items-center gap-0.5" style={{ color: s.positive ? '#22c55e' : '#ef4444' }}>
              {s.positive ? <TrendingUp style={{ fontSize: 13 }} /> : <TrendingDown style={{ fontSize: 13 }} />}
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Sotuv & Foyda Dinamikasi</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={fmtM} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'sotuv' ? 'Sotuv' : n === 'foyda' ? 'Foyda' : 'Xarajat']} />
              <Legend formatter={(v) => v === 'sotuv' ? 'Sotuv' : v === 'foyda' ? 'Foyda' : 'Xarajat'} />
              <Line type="monotone" dataKey="sotuv" stroke="#4361ee" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="foyda" stroke="#22c55e" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="xarajat" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Kategoriya bo'yicha</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={fmtM} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="sotuv" fill="#4361ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-3">So'nggi Tranzaksiyalar</h2>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              {['ID', 'Vaqt', 'Mahsulotlar', 'Summa', "To'lov turi", 'Kassir'].map((h) => (
                <th key={h} className="pb-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((txn) => (
              <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 text-xs font-bold" style={{ color: '#4361ee' }}>{txn.id}</td>
                <td className="py-2.5 text-xs text-gray-500">{txn.time}</td>
                <td className="py-2.5 text-xs text-gray-600">{txn.items} ta</td>
                <td className="py-2.5 text-xs font-semibold text-gray-800">{fmt(txn.amount)}</td>
                <td className="py-2.5">
                  <Chip label={txn.method} size="small"
                    sx={{ fontSize: 10, fontWeight: 600, height: 20, bgcolor: `${methodColor[txn.method]}22`, color: methodColor[txn.method] }} />
                </td>
                <td className="py-2.5 text-xs text-gray-600">{txn.cashier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
