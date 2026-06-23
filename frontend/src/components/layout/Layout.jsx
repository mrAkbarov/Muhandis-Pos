import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PAGE_BG, SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '../../config/constants';

export default function Layout({ children }) {
  const { collapsed, setCollapsed } = useApp();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPosKassa = location.pathname === '/pos';
  const marginLeft = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  useEffect(() => {
    if (isPosKassa) {
      setCollapsed(true);
    }
  }, [isPosKassa, setCollapsed]);

  if (isPosKassa) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#eef1f6]">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: PAGE_BG }}>
      <Sidebar />
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft }}>
        {currentUser?.isGlobalAdmin && (
          <div className="bg-indigo-600 text-white text-center text-sm py-2 px-4">
            Platform egasi rejimi — barcha magazinlarni ko&apos;rishingiz mumkin, o&apos;zgartirish taqiqlangan.
            {' '}
            <button
              type="button"
              className="underline font-semibold"
              onClick={() => navigate('/platform/magazinlar')}
            >
              Magazinlar holati →
            </button>
          </div>
        )}
        <Header />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
