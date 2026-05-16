import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  PointOfSale,
  Inventory2,
  Inventory as InventoryIcon,
  People,
  LocalShipping,
  ShoppingCart,
  Analytics,
  WarningAmber,
  Assessment,
  Settings,
  ExpandMore,
  ExpandLess,
  ShoppingBag,
} from '@mui/icons-material';
import { Avatar, Collapse } from '@mui/material';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/' },
  { label: 'POS (Kassa)', icon: <PointOfSale fontSize="small" />, path: '/pos' },
  { label: 'Products', icon: <ShoppingBag fontSize="small" />, path: '/products' },
  { label: 'Sklad', icon: <InventoryIcon fontSize="small" />, path: '/inventory' },
  { label: 'CRM (Mijozlar)', icon: <People fontSize="small" />, path: '/crm' },
  { label: 'Dilerlar', icon: <LocalShipping fontSize="small" />, path: '/suppliers' },
  { label: 'Purchase Orders', icon: <ShoppingCart fontSize="small" />, path: '/purchase-orders' },
  { label: 'AI Analytica', icon: <Analytics fontSize="small" />, path: '/ai-analytics' },
  { label: 'Yaroqlilik Mudati', icon: <WarningAmber fontSize="small" />, path: '/expire-management' },
  { label: 'Hisobot', icon: <Assessment fontSize="small" />, path: '/reports' },
  { label: 'Sozlamalar', icon: <Settings fontSize="small" />, path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userOpen, setUserOpen] = useState(false);

  return (
    <div
      className="flex flex-col h-screen w-56 fixed left-0 top-0 z-50"
      style={{ background: 'linear-gradient(180deg, #1a2035 0%, #1a2035 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: '#4361ee' }}>
          <ShoppingCart style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <span className="text-white font-bold text-base leading-tight">POS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 group"
              style={{
                background: isActive ? '#4361ee' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                borderRadius: isActive ? '0' : '0',
              }}
            >
              <span
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <span
                  className="absolute right-0 w-1 h-8 rounded-l"
                  style={{ background: '#fff' }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/10">
        <button
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
          onClick={() => setUserOpen(!userOpen)}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#4361ee', fontSize: 14 }}>A</Avatar>
          <div className="flex-1 text-left">
            <p className="text-white text-sm font-medium leading-tight">Akmaljon</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Admin</p>
          </div>
          {userOpen ? (
            <ExpandLess style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
          ) : (
            <ExpandMore style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
          )}
        </button>
        <Collapse in={userOpen}>
          <div className="px-5 pb-3">
            <button
              className="w-full text-left text-xs py-1.5 hover:text-white transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={() => navigate('/settings')}
            >
              Profil sozlamalari
            </button>
            <button
              className="w-full text-left text-xs py-1.5 hover:text-red-400 transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Chiqish
            </button>
          </div>
        </Collapse>
      </div>
    </div>
  );
}
