import { createContext, useContext, useState, useEffect } from 'react';
import {
  initialProducts,
  initialWarehouses,
  initialInventory,
  initialSuppliers,
  initialDealerOrders,
  initialCustomers,
  initialAgents,
  initialAgentOrders,
  initialSales,
  businesses,
  defaultCategories,
} from '../data/initialData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const val = localStorage.getItem('sidebar_collapsed');
    return val ? JSON.parse(val) : false;
  });

  const [currentBusinessId, setCurrentBusinessId] = useState(() => {
    const val = localStorage.getItem('current_business_id');
    return val ? parseInt(val, 10) : 1;
  });

  const [products, setProducts] = useState(() => {
    const val = localStorage.getItem('pos_products');
    return val ? JSON.parse(val) : initialProducts;
  });

  const [warehouses, setWarehouses] = useState(() => {
    const val = localStorage.getItem('pos_warehouses');
    return val ? JSON.parse(val) : initialWarehouses;
  });

  const [inventory, setInventory] = useState(() => {
    const val = localStorage.getItem('pos_inventory');
    return val ? JSON.parse(val) : initialInventory;
  });

  const [suppliers, setSuppliers] = useState(() => {
    const val = localStorage.getItem('pos_suppliers');
    return val ? JSON.parse(val) : initialSuppliers;
  });

  const [dealerOrders, setDealerOrders] = useState(() => {
    const val = localStorage.getItem('pos_dealer_orders');
    return val ? JSON.parse(val) : initialDealerOrders;
  });

  const [customers, setCustomers] = useState(() => {
    const val = localStorage.getItem('pos_customers');
    return val ? JSON.parse(val) : initialCustomers;
  });

  const [agents, setAgents] = useState(() => {
    const val = localStorage.getItem('pos_agents');
    return val ? JSON.parse(val) : initialAgents;
  });

  const [agentOrders, setAgentOrders] = useState(() => {
    const val = localStorage.getItem('pos_agent_orders');
    return val ? JSON.parse(val) : initialAgentOrders;
  });

  const [sales, setSales] = useState(() => {
    const val = localStorage.getItem('pos_sales');
    return val ? JSON.parse(val) : initialSales;
  });

  const [categories, setCategories] = useState(defaultCategories);

  // Client-side migration for existing local storage state
  useEffect(() => {
    setCurrentBusinessId(1);
    setProducts(prev => prev.filter(p => p.businessId === 1));
    setWarehouses(prev => prev.filter(w => w.businessId === 1 && w.id !== 2));
    setInventory(prev => prev.filter(i => i.warehouseId === 1));
    setSuppliers(prev => prev.filter(s => s.businessId === 1));
    setDealerOrders(prev => prev.filter(o => o.businessId === 1));
    setCustomers(prev => prev.filter(c => c.businessId === 1));
    setAgents(prev => prev.filter(a => a.businessId === 1));
    setAgentOrders(prev => prev.filter(ao => ao.businessId === 1));
    setSales(prev => prev.filter(s => s.businessId === 1));
  }, []);

  // Persists
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('current_business_id', currentBusinessId);
  }, [currentBusinessId]);

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('pos_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('pos_dealer_orders', JSON.stringify(dealerOrders));
  }, [dealerOrders]);

  useEffect(() => {
    localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pos_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('pos_agent_orders', JSON.stringify(agentOrders));
  }, [agentOrders]);

  useEffect(() => {
    localStorage.setItem('pos_sales', JSON.stringify(sales));
  }, [sales]);

  // Derived Active Warehouse
  const activeBusinessWarehouses = warehouses.filter(w => w.businessId === currentBusinessId);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(activeBusinessWarehouses[0]?.id || 1);

  // Auto-switch warehouse when business changes
  useEffect(() => {
    const validWarehouses = warehouses.filter(w => w.businessId === currentBusinessId);
    if (validWarehouses.length > 0) {
      setSelectedWarehouseId(validWarehouses[0].id);
    }
  }, [currentBusinessId, warehouses]);

  // Inventory Helper
  const getProductStock = (productId, wId) => {
    const whId = wId || selectedWarehouseId;
    const inv = inventory.find(i => i.productId === productId && i.warehouseId === whId);
    return inv ? inv.quantity : 0;
  };

  const updateProductStock = (productId, quantityToAdd, wId) => {
    const whId = wId || selectedWarehouseId;
    setInventory(prev => {
      const idx = prev.findIndex(i => i.productId === productId && i.warehouseId === whId);
      if (idx >= 0) {
        return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + quantityToAdd } : item);
      } else {
        return [...prev, { id: Date.now() + Math.random(), productId, warehouseId: whId, quantity: quantityToAdd }];
      }
    });
  };

  const getBusinessProducts = () => {
    return products.filter(p => p.businessId === currentBusinessId);
  };

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId);

  return (
    <AppContext.Provider value={{
      collapsed, setCollapsed,
      businesses,
      currentBusiness, currentBusinessId, setCurrentBusinessId,
      products, setProducts, getBusinessProducts,
      warehouses, setWarehouses, activeBusinessWarehouses,
      selectedWarehouseId, setSelectedWarehouseId,
      inventory, setInventory, getProductStock, updateProductStock,
      suppliers, setSuppliers,
      dealerOrders, setDealerOrders,
      customers, setCustomers,
      agents, setAgents,
      agentOrders, setAgentOrders,
      sales, setSales,
      categories, setCategories
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
