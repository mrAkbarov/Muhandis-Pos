import { useLocation } from 'react-router-dom';
import {
  NotificationsOutlined,
  FullscreenOutlined,
  CalendarToday,
} from '@mui/icons-material';
import { Badge } from '@mui/material';
import { getPageTitle } from '../../config/navigation';

export default function Header() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
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
      <h1 className="text-lg font-bold text-gray-800 shrink-0">{pageTitle}</h1>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{today}</span>
        <CalendarToday style={{ fontSize: 16, color: '#6b7280' }} />
      </div>

      <button type="button" className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
        <Badge
          badgeContent={3}
          color="error"
          sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
        >
          <NotificationsOutlined style={{ fontSize: 22, color: '#6b7280' }} />
        </Badge>
      </button>

      <button
        type="button"
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={handleFullscreen}
      >
        <FullscreenOutlined style={{ fontSize: 22, color: '#6b7280' }} />
      </button>
    </header>
  );
}
