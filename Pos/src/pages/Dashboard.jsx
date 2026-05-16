import { useState } from 'react';
import {
  ShoppingCart,
  AttachMoney,
  Inventory2,
  Warning,
  EventBusy,
  TrendingUp,
  TrendingDown,
  ArrowForward,
  SmartToy,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { Chip, Button, MenuItem, Select, LinearProgress } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Mock Data ────────────────────────────────────────────────
const salesData = [
  { day: '12 May', amount: 8200000 },
  { day: '13 May', amount: 9500000 },
  { day: '14 May', amount: 7800000 },
  { day: '15 May', amount: 11000000 },
  { day: '16 May', amount: 10200000 },
  { day: '17 May', amount: 9800000 },
  { day: '18 May', amount: 12450000 },
];

const topProducts = [
  { rank: 1, name: 'Cola 1L', sold: 125, revenue: 1250000, img: '🥤' },
  { rank: 2, name: 'Non (Tandir)', sold: 98, revenue: 980000, img: '🫓' },
  { rank: 3, name: 'Pepsi 1L', sold: 76, revenue: 760000, img: '🥤' },
  { rank: 4, name: "Lay's Chips", sold: 65, revenue: 650000, img: '🍟' },
  { rank: 5, name: 'Snickers 50g', sold: 54, revenue: 540000, img: '🍫' },
];

const aiInsights = [
  {
    type: 'success',
    icon: <CheckCircle style={{ fontSize: 18 }} />,
    text: 'Cola mahsuloti juda tez sotilmoqda.',
    sub: '50 ta buyurtma berish tavsiya etiladi.',
    bg: '#f0fdf4',
    border: '#86efac',
    color: '#16a34a',
  },
  {
    type: 'warning',
    icon: <Warning style={{ fontSize: 18 }} />,
    text: 'Non mahsulotining stocki kam qoldi.',
    sub: 'Buyurtma berishni unutmang.',
    bg: '#fffbeb',
    border: '#fcd34d',
    color: '#d97706',
  },
  {
    type: 'danger',
    icon: <Info style={{ fontSize: 18 }} />,
    text: 'Qurt mahsuloti zarar keltiryapti.',
    sub: "Kamroq olish tavsiya etiladi.",
    bg: '#fff1f2',
    border: '#fca5a5',
    color: '#dc2626',
  },
];

const inventoryAlerts = [
  { name: 'Cola 1L', qty: '2 ta qoldi', status: 'Kam', color: '#f97316' },
  { name: "Yog' 1L", qty: '1 ta qoldi', status: 'Kam', color: '#f97316' },
  { name: 'Shakar 1kg', qty: '3 ta qoldi', status: 'Kam', color: '#f97316' },
  { name: 'Tuz 1kg', qty: '0 ta qoldi', status: 'Tugagan', color: '#ef4444' },
  { name: 'Pepsi 1L', qty: '2 ta qoldi', status: 'Kam', color: '#f97316' },
];

const expireProducts = [
  { name: 'Smetana 20%', days: '14 kun qoldi', status: 'Yashil', dot: '#22c55e' },
  { name: 'Qatiq', days: '2 kun qoldi', status: 'Sariq', dot: '#f59e0b' },
  { name: "Salat Yaprog'i", days: '1 kun qoldi', status: 'Sariq', dot: '#f59e0b' },
  { name: 'Tvorog', days: '0 kun qoldi', status: 'Qizil', dot: '#ef4444' },
  { name: 'Sut 1L', days: "1 kun o'tgan", status: 'Qizil', dot: '#ef4444' },
];

const autoOrders = [
  { product: 'Cola 1L', status: 'Reorder kerak', qty: '50 ta' },
  { product: 'Shakar 1kg', status: 'Reorder kerak', qty: '30 ta' },
  { product: "Yog' 1L", status: 'Reorder kerak', qty: '20 ta' },
];

const profitLoss = [
  { product: 'Cola 1L', sotuv: 12500000, profit: 5000000, positive: true },
  { product: 'Pepsi 1L', sotuv: 7800000, profit: 3000000, positive: true },
  { product: 'Qurt', sotuv: 1200000, profit: -700000, positive: false },
];

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-xs border border-gray-100">
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-blue-600 font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

function StatCard({ icon, iconBg, title, value, sub, subColor, subText }) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{title}</p>
        <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs mt-0.5" style={{ color: subColor }}>
          {sub && <span className="font-medium">{sub} </span>}
          <span className="text-gray-400">{subText}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState('7 kunlik');
  const [topPeriod, setTopPeriod] = useState('Bugun');
  const [profitView, setProfitView] = useState('Grafik');

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Xush kelibsiz, Akmaljon! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Bugungi umumiy ko'rsatkichlar</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={<ShoppingCart style={{ color: '#4361ee', fontSize: 22 }} />}
          iconBg="#eef0ff"
          title="Bugungi Sotuv"
          value="12,450,000 so'm"
          sub="+ 18.5%"
          subColor="#16a34a"
          subText="Kecha bilan solishtirganda"
        />
        <StatCard
          icon={<AttachMoney style={{ color: '#22c55e', fontSize: 22 }} />}
          iconBg="#f0fdf4"
          title="Umumiy Foyda"
          value="3,250,000 so'm"
          sub="+ 22.1%"
          subColor="#16a34a"
          subText="Kecha bilan solishtirganda"
        />
        <StatCard
          icon={<Inventory2 style={{ color: '#3b82f6', fontSize: 22 }} />}
          iconBg="#eff6ff"
          title="Jami Mahsulotlar"
          value="1,234"
          sub="+ 6 ta"
          subColor="#3b82f6"
          subText="Yangi qo'shildi"
        />
        <StatCard
          icon={<Warning style={{ color: '#f97316', fontSize: 22 }} />}
          iconBg="#fff7ed"
          title="Kam Qolgan Mahsulotlar"
          value="23"
          sub="▲ Ogohlantirish"
          subColor="#f97316"
          subText=""
        />
        <StatCard
          icon={<EventBusy style={{ color: '#ef4444', fontSize: 22 }} />}
          iconBg="#fff1f2"
          title="Muddati O'tganlar"
          value="7"
          sub="▲ Darhol tekshirish kerak"
          subColor="#ef4444"
          subText=""
        />
      </div>

      {/* Row 2: Chart + Top Products + AI Insight */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sales Chart */}
        <div className="col-span-5 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700">Sotuv Statistikasi</h2>
            <Select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              size="small"
              sx={{ fontSize: 12, height: 28, minWidth: 90 }}
            >
              <MenuItem value="7 kunlik" sx={{ fontSize: 12 }}>7 kunlik</MenuItem>
              <MenuItem value="30 kunlik" sx={{ fontSize: 12 }}>30 kunlik</MenuItem>
              <MenuItem value="Yillik" sx={{ fontSize: 12 }}>Yillik</MenuItem>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#4361ee"
                strokeWidth={2.5}
                dot={{ fill: '#4361ee', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#4361ee' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="col-span-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Top Mahsulotlar</h2>
            <Select
              value={topPeriod}
              onChange={(e) => setTopPeriod(e.target.value)}
              size="small"
              sx={{ fontSize: 12, height: 28, minWidth: 70 }}
            >
              <MenuItem value="Bugun" sx={{ fontSize: 12 }}>Bugun</MenuItem>
              <MenuItem value="Hafta" sx={{ fontSize: 12 }}>Hafta</MenuItem>
              <MenuItem value="Oy" sx={{ fontSize: 12 }}>Oy</MenuItem>
            </Select>
          </div>
          <div className="space-y-2">
            {topProducts.map((p) => (
              <div key={p.rank} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4">{p.rank}</span>
                <span className="text-base">{p.img}</span>
                <span className="flex-1 text-xs font-medium text-gray-700 truncate">{p.name}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{p.sold} ta</span>
                <span className="text-xs font-semibold text-gray-700 w-24 text-right">
                  {(p.revenue / 1000).toFixed(0)},000 so'm
                </span>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs flex items-center gap-1" style={{ color: '#4361ee' }}>
            Barchasini ko'rish <ArrowForward style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* AI Insight */}
        <div className="col-span-3 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SmartToy style={{ color: '#4361ee', fontSize: 18 }} />
            <h2 className="text-sm font-bold text-gray-700">AI Insight</h2>
          </div>
          <div className="space-y-2.5">
            {aiInsights.map((ins, i) => (
              <div
                key={i}
                className="rounded-lg p-2.5"
                style={{
                  background: ins.bg,
                  border: `1px solid ${ins.border}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span style={{ color: ins.color, marginTop: 1 }}>{ins.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: ins.color }}>{ins.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ins.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs flex items-center gap-1" style={{ color: '#4361ee' }}>
            Barcha AI tavsiyalar <ArrowForward style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* Row 3: Inventory Alerts + Expire Products */}
      <div className="grid grid-cols-2 gap-4">
        {/* Inventory */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Inventory Ogohlantirishlar</h2>
          <div className="space-y-2.5">
            {inventoryAlerts.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                  🏪
                </div>
                <span className="flex-1 text-xs font-medium text-gray-700">{item.name}</span>
                <span className="text-xs" style={{ color: item.color }}>{item.qty}</span>
                <Chip
                  label={item.status}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    bgcolor: item.status === 'Tugagan' ? '#fee2e2' : '#fff7ed',
                    color: item.color,
                    fontWeight: 600,
                    border: `1px solid ${item.color}22`,
                  }}
                />
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs flex items-center gap-1" style={{ color: '#4361ee' }}>
            Barchasini ko'rish <ArrowForward style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* Expire */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Expire Mahsulotlar</h2>
          <div className="space-y-2.5">
            {expireProducts.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                  🥛
                </div>
                <span className="flex-1 text-xs font-medium text-gray-700">{item.name}</span>
                <span className="text-xs text-gray-400">{item.days}</span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: item.dot }}
                />
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs flex items-center gap-1" style={{ color: '#4361ee' }}>
            Barchasini ko'rish <ArrowForward style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* Row 4: Auto Order + Profit/Loss */}
      <div className="grid grid-cols-2 gap-4">
        {/* Auto Orders */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Auto Order Tavsiyalar</h2>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 text-left font-medium">Mahsulot</th>
                <th className="pb-2 text-left font-medium">Holat</th>
                <th className="pb-2 text-left font-medium">Tavsiya Etilgan Miqdor</th>
                <th className="pb-2 text-left font-medium">Amal</th>
              </tr>
            </thead>
            <tbody>
              {autoOrders.map((order, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 text-xs font-medium text-gray-700">{order.product}</td>
                  <td className="py-2.5">
                    <span className="text-xs font-medium text-red-500">{order.status}</span>
                  </td>
                  <td className="py-2.5 text-xs text-gray-600">{order.qty}</td>
                  <td className="py-2.5">
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        fontSize: 10,
                        py: 0.4,
                        px: 1.5,
                        bgcolor: '#4361ee',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        minWidth: 0,
                        '&:hover': { bgcolor: '#3451d1' },
                      }}
                    >
                      Buyurtma berish
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Profit/Loss */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Foyda / Zarar Tahlili</h2>
            <Select
              value={profitView}
              onChange={(e) => setProfitView(e.target.value)}
              size="small"
              sx={{ fontSize: 12, height: 28, minWidth: 80 }}
            >
              <MenuItem value="Grafik" sx={{ fontSize: 12 }}>Grafik</MenuItem>
              <MenuItem value="Jadval" sx={{ fontSize: 12 }}>Jadval</MenuItem>
            </Select>
          </div>
          <div className="space-y-3">
            {profitLoss.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{item.product}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {(item.sotuv / 1000000).toFixed(1)}M so'm
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: item.positive ? '#22c55e' : '#ef4444' }}
                    >
                      {item.positive ? '+' : ''}
                      {(item.profit / 1000000).toFixed(1)}M so'm
                    </span>
                  </div>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={item.positive ? Math.min((item.profit / item.sotuv) * 100 + 40, 100) : 20}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.positive ? '#22c55e' : '#ef4444',
                      borderRadius: 3,
                    },
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
