import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Dashboard as DashboardIcon,
  PointOfSale,
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
  Person,
  MenuOpen,
  Menu
} from '@mui/icons-material';
import { Avatar, Collapse, IconButton } from '@mui/material';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed } = useApp();
  
  const [dilerlarOpen, setDilerlarOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/' },
    { label: 'POS', icon: <PointOfSale fontSize="small" />, path: '/pos' },
    { label: 'Products', icon: <ShoppingBag fontSize="small" />, path: '/products' },
    { label: 'Sklad', icon: <InventoryIcon fontSize="small" />, path: '/inventory' },
    { label: 'Agentlar', icon: <Person fontSize="small" />, path: '/agents' },
  ];

  const bottomNavItems = [
    { label: 'AI Analytica', icon: <Analytics fontSize="small" />, path: '/ai-analytics' },
    { label: 'Yaroqlilik Mudati', icon: <WarningAmber fontSize="small" />, path: '/expire-management' },
    { label: 'Hisobot', icon: <Assessment fontSize="small" />, path: '/reports' },
    { label: 'Sozlamalar', icon: <Settings fontSize="small" />, path: '/settings' },
  ];

  return (
    <div
      className="flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300"
      style={{
        background: 'linear-gradient(180deg, #1a2035 0%, #1a2035 100%)',
        width: collapsed ? 72 : 224
      }}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#4361ee' }}>
              <ShoppingCart style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <span className="text-white font-bold text-base leading-tight">POS</span>
          </div>
        )}
        {/*{collapsed && (*/}
        {/*  <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center" style={{ background: '#4361ee' }}>*/}
        {/*    <ShoppingCart style={{ color: '#fff', fontSize: 16 }} />*/}
        {/*  </div>*/}
        {/*)}*/}
        {!collapsed && (
          <IconButton onClick={() => setCollapsed(true)} size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <MenuOpen />
          </IconButton>
        )}
        {collapsed && (
          <IconButton onClick={() => setCollapsed(false)} size="small" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, mx: 'auto' }}>
            <Menu />
          </IconButton>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-2.5'} text-left transition-all duration-150 relative`}
              style={{
                background: isActive ? '#4361ee' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="absolute right-0 w-1 h-8 rounded-l" style={{ background: '#fff' }} />
              )}
            </button>
          );
        })}

        {/* Dilerlar Expandable Menu */}
        <div>
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setDilerlarOpen(true);
              } else {
                setDilerlarOpen(!dilerlarOpen);
              }
            }}
            className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-2.5'} text-left transition-all duration-150`}
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
              <LocalShipping fontSize="small" />
            </span>
            {!collapsed && (
              <>
                <span className="text-sm font-medium flex-1">Dilerlar</span>
                {dilerlarOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </>
            )}
          </button>
          <Collapse in={dilerlarOpen && !collapsed}>
            <div className="bg-black/20 py-1">
              <button
                onClick={() => navigate('/dilerlar/zakaz')}
                className={`w-full flex items-center gap-3 pl-12 pr-5 py-2 text-left text-xs transition-colors ${location.pathname === '/dilerlar/zakaz' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                <span>• Zakaz (Buyurtma)</span>
              </button>
              <button
                onClick={() => navigate('/dilerlar/prixod')}
                className={`w-full flex items-center gap-3 pl-12 pr-5 py-2 text-left text-xs transition-colors ${location.pathname === '/dilerlar/prixod' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                <span>• Prixod (Qabul)</span>
              </button>
            </div>
          </Collapse>
        </div>

        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-2.5'} text-left transition-all duration-150 relative`}
              style={{
                background: isActive ? '#4361ee' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="absolute right-0 w-1 h-8 rounded-l" style={{ background: '#fff' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-white/10">
        <button
          className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-4'} hover:bg-white/5 transition-colors`}
          onClick={() => !collapsed && setUserOpen(!userOpen)}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#4361ee', fontSize: 14 }}>A</Avatar>
          {!collapsed && (
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-medium leading-tight">Akmaljon</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Kassir</p>
            </div>
          )}
          {!collapsed && (
            userOpen ? (
              <ExpandLess style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
            ) : (
              <ExpandMore style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
            )
          )}
        </button>
        <Collapse in={userOpen && !collapsed}>
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

