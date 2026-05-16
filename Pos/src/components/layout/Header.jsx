import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  NotificationsOutlined,
  FullscreenOutlined,
  CalendarToday,
} from '@mui/icons-material';
import { Badge, InputAdornment, TextField } from '@mui/material';

const pageTitles = {
  '/': 'Dashboard',
  '/pos': 'POS (Kassa)',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/crm': 'CRM (Mijozlar)',
  '/suppliers': 'Suppliers',
  '/purchase-orders': 'Purchase Orders',
  '/ai-analytics': 'AI Analytics',
  '/expire-management': 'Expire Management',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-40"
      style={{ minHeight: 60 }}
    >
      {/* Search */}
      <div className="flex-1 max-w-xs">
        <TextField
          size="small"
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search style={{ color: '#9ca3af', fontSize: 18 }} />
              </InputAdornment>
            ),
            style: {
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: '#f8fafc',
            },
          }}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#e5e7eb' },
              '&:hover fieldset': { borderColor: '#4361ee' },
            },
          }}
        />
      </div>

      <div className="flex-1" />

      {/* Date */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{today}</span>
        <CalendarToday style={{ fontSize: 16, color: '#6b7280' }} />
      </div>

      {/* Notifications */}
      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
        <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
          <NotificationsOutlined style={{ fontSize: 22, color: '#6b7280' }} />
        </Badge>
      </button>

      {/* Fullscreen */}
      <button
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={handleFullscreen}
      >
        <FullscreenOutlined style={{ fontSize: 22, color: '#6b7280' }} />
      </button>
    </header>
  );
}
