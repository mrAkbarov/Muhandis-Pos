import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';
import { PAGE_BG, SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '../../config/constants';

export default function Layout({ children }) {
  const { collapsed } = useApp();
  const marginLeft = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="flex min-h-screen" style={{ background: PAGE_BG }}>
      <Sidebar />
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft }}>
        <Header />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
