import { useState } from 'react';
import {
  Store, Person, Notifications, Security, Palette,
  Receipt, Language, DarkMode, LightMode,
} from '@mui/icons-material';
import { Switch, Slider, Button, TextField, Avatar } from '@mui/material';

const sections = [
  { id: 'market', label: 'Market Ma\'lumotlari', icon: <Store fontSize="small" /> },
  { id: 'profile', label: 'Profil', icon: <Person fontSize="small" /> },
  { id: 'notifications', label: 'Bildirishnomalar', icon: <Notifications fontSize="small" /> },
  { id: 'security', label: 'Xavfsizlik', icon: <Security fontSize="small" /> },
  { id: 'appearance', label: 'Ko\'rinish', icon: <Palette fontSize="small" /> },
  { id: 'receipt', label: 'Kvitansiya', icon: <Receipt fontSize="small" /> },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('market');
  const [darkMode, setDarkMode] = useState(false);
  const [notifs, setNotifs] = useState({ lowStock: true, expire: true, dailyReport: false, orders: true });
  const [market, setMarket] = useState({
    name: 'SmartPOS Market', address: 'Toshkent, Yunusobod tumani', phone: '+998901234567',
    email: 'info@market.uz', taxRate: 12, currency: "so'm",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Sozlamalar</h1>
        <p className="text-sm text-gray-500">Tizim sozlamalarini boshqarish</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-52 bg-white rounded-xl shadow-sm p-2 h-fit">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors"
              style={{
                background: activeSection === sec.id ? '#eef0ff' : 'transparent',
                color: activeSection === sec.id ? '#4361ee' : '#6b7280',
              }}
            >
              <span style={{ color: activeSection === sec.id ? '#4361ee' : '#9ca3af' }}>{sec.icon}</span>
              {sec.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
          {activeSection === 'market' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Market Ma'lumotlari</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Market nomi', field: 'name' },
                  { label: 'Manzil', field: 'address' },
                  { label: 'Telefon', field: 'phone' },
                  { label: 'Email', field: 'email' },
                ].map(({ label, field }) => (
                  <TextField key={field} label={label} value={market[field]}
                    onChange={(e) => setMarket((m) => ({ ...m, [field]: e.target.value }))}
                    size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                ))}
                <TextField label="Soliq stavkasi (%)" type="number" value={market.taxRate}
                  onChange={(e) => setMarket((m) => ({ ...m, taxRate: e.target.value }))}
                  size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                <TextField label="Valyuta" value={market.currency}
                  onChange={(e) => setMarket((m) => ({ ...m, currency: e.target.value }))}
                  size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              </div>
              <Button variant="contained" sx={{ mt: 4, bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
                Saqlash
              </Button>
            </div>
          )}

          {activeSection === 'profile' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Profil Sozlamalari</h2>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#4361ee', fontSize: 22 }}>A</Avatar>
                <div>
                  <p className="font-bold text-gray-800">Akmaljon</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                  <button className="text-xs mt-1" style={{ color: '#4361ee' }}>Rasmni o'zgartirish</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Ism', value: 'Akmaljon' },
                  { label: 'Familiya', value: 'Toshmatov' },
                  { label: 'Telefon', value: '+998901234567' },
                  { label: 'Email', value: 'akmaljon@market.uz' },
                ].map(({ label, value }) => (
                  <TextField key={label} label={label} defaultValue={value}
                    size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                ))}
              </div>
              <Button variant="contained" sx={{ mt: 4, bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
                Saqlash
              </Button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Bildirishnomalar</h2>
              <div className="space-y-4">
                {[
                  { key: 'lowStock', label: 'Kam qolgan mahsulotlar haqida', sub: 'Stock minimal darajaga tushganda xabar berish' },
                  { key: 'expire', label: 'Muddati tugayotgan mahsulotlar', sub: "Muddat tugashidan 3 kun oldin ogohlantirish" },
                  { key: 'dailyReport', label: 'Kunlik hisobot', sub: 'Har kuni ish tugaganda kunlik sotuv hisoboti' },
                  { key: 'orders', label: 'Yangi buyurtmalar', sub: "Yangi xarid buyurtmasi kelganda xabar berish" },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                    <Switch
                      checked={notifs[key]}
                      onChange={(e) => setNotifs((n) => ({ ...n, [key]: e.target.checked }))}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4361ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4361ee' } }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Xavfsizlik</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 max-w-sm">
                  <TextField label="Joriy parol" type="password" size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                  <TextField label="Yangi parol" type="password" size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                  <TextField label="Yangi parolni tasdiqlang" type="password" size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl max-w-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Ikki bosqichli tasdiqlash</p>
                    <p className="text-xs text-gray-400 mt-0.5">Hisobni himoyalash uchun yoqing</p>
                  </div>
                  <Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4361ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4361ee' } }} />
                </div>
                <Button variant="contained" sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
                  Parolni o'zgartirish
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Ko'rinish Sozlamalari</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode ? <DarkMode style={{ color: '#6366f1' }} /> : <LightMode style={{ color: '#f59e0b' }} />}
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {darkMode ? "Qorong'u rejim" : 'Yoriq rejim'}
                      </p>
                      <p className="text-xs text-gray-400">Interfeys rangini o'zgartirish</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4361ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4361ee' } }} />
                </div>
                <div className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Asosiy rang</p>
                  <p className="text-xs text-gray-400 mb-3">Interfeysdagi asosiy rang</p>
                  <div className="flex gap-3">
                    {['#4361ee', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'].map((color) => (
                      <button key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                        style={{ background: color }} />
                    ))}
                  </div>
                </div>
                <div className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Til</p>
                  <div className="flex gap-2">
                    {["O'zbek", "Русский", "English"].map((lang) => (
                      <button key={lang} className="text-xs px-4 py-2 rounded-lg font-medium border transition-colors"
                        style={{ border: lang === "O'zbek" ? '1.5px solid #4361ee' : '1.5px solid #e5e7eb',
                                 color: lang === "O'zbek" ? '#4361ee' : '#6b7280',
                                 background: lang === "O'zbek" ? '#eef0ff' : '#fff' }}>
                        <Language style={{ fontSize: 12, marginRight: 4 }} />{lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'receipt' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Kvitansiya Sozlamalari</h2>
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Kvitansiya sarlavhasi" defaultValue="SmartPOS Market"
                  size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                <TextField label="Pastki matn" defaultValue="Rahmat! Yana keling!"
                  size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Logotipni ko\'rsatish', checked: true },
                  { label: 'QR kodni ko\'rsatish', checked: true },
                  { label: 'Soliq summasini ko\'rsatish', checked: false },
                  { label: 'Kassir ismini ko\'rsatish', checked: true },
                ].map(({ label, checked }) => (
                  <div key={label} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <p className="text-sm text-gray-700">{label}</p>
                    <Switch defaultChecked={checked}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4361ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4361ee' } }} />
                  </div>
                ))}
              </div>
              <Button variant="contained" sx={{ mt: 4, bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
                Saqlash
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
