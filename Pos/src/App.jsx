import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import AIAnalytics from './pages/AIAnalytics';
import ExpireManagement from './pages/ExpireManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Agents from './pages/Agents';
import DealerOrders from './pages/DealerOrders';
import DealerReceipts from './pages/DealerReceipts';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/dilerlar/zakaz" element={<DealerOrders />} />
        <Route path="/dilerlar/prixod" element={<DealerReceipts />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/ai-analytics" element={<AIAnalytics />} />
        <Route path="/expire-management" element={<ExpireManagement />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;

