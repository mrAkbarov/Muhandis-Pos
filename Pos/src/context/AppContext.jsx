import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const initialProducts = [
  // Business 1 (Market) Products
  { id: 1, name: 'Cola 1L', category: 'Ichimliklar', price: 10000, cost: 7000, barcode: '8901234567890', emoji: '🥤', isDraft: false, businessId: 1 },
  { id: 2, name: 'Pepsi 1L', category: 'Ichimliklar', price: 9500, cost: 6500, barcode: '8901234567891', emoji: '🥤', isDraft: false, businessId: 1 },
  { id: 3, name: 'Non (Tandir)', category: 'Oziq-ovqat', price: 8000, cost: 4000, barcode: '8901234567892', emoji: '🫓', isDraft: false, businessId: 1 },
  { id: 4, name: "Lay's Chips", category: 'Shirinliklar', price: 12000, cost: 8000, barcode: '8901234567893', emoji: '🍟', isDraft: false, businessId: 1 },
  { id: 5, name: 'Snickers 50g', category: 'Shirinliklar', price: 9000, cost: 6000, barcode: '8901234567894', emoji: '🍫', isDraft: true, businessId: 1 }, // Draft item
  { id: 6, name: 'Smetana 20%', category: 'Sut mahsulotlari', price: 15000, cost: 10000, barcode: '8901234567895', emoji: '🥛', isDraft: false, businessId: 1 },
  { id: 7, name: 'Qatiq', category: 'Sut mahsulotlari', price: 11000, cost: 7500, barcode: '8901234567896', emoji: '🥛', isDraft: false, businessId: 1 },
];

const initialWarehouses = [
  // Business 1
  { id: 1, name: 'Asosiy Oziq-ovqat Ombori', businessId: 1 },
];

const initialInventory = [
  // Warehouse 1 (Business 1)
  { id: 1, productId: 1, warehouseId: 1, quantity: 150 },
  { id: 2, productId: 2, warehouseId: 1, quantity: 80 },
  { id: 3, productId: 3, warehouseId: 1, quantity: 20 },
  { id: 4, productId: 4, warehouseId: 1, quantity: 100 },
  { id: 5, productId: 5, warehouseId: 1, quantity: 15 },
];

const initialSuppliers = [
  { id: 1, name: 'Coca-Cola Uzbekistan', contact: 'Alisher', phone: '+998901112233', email: 'alcola@uz.com', address: 'Toshkent, Yunusobod', category: 'Ichimliklar', totalOrders: 45, status: 'Faol', businessId: 1 },
  { id: 2, name: 'PepsiCo UZ', contact: 'Bahodur', phone: '+998912223344', email: 'bpepsi@uz.com', address: 'Toshkent, Chilonzor', category: 'Ichimliklar', totalOrders: 32, status: 'Faol', businessId: 1 },
  { id: 3, name: 'Novda Non', contact: 'Xurshid', phone: '+998923334455', email: 'novda@uz.com', address: 'Toshkent, Mirzo Ulug\'bek', category: 'Non mahsulotlari', totalOrders: 78, status: 'Faol', businessId: 1 },
];

const initialDealerOrders = [
  {
    id: 'PO-001',
    supplierId: 1,
    supplierName: 'Coca-Cola Uzbekistan',
    date: '2026-05-18',
    businessId: 1,
    items: [
      { productId: 1, name: 'Cola 1L', quantity: 150, type: 'tuzsiz', size: '1L', unit: 'litr', costPrice: 7000 }
    ],
    total: 1050000,
    status: 'Yetkazilgan',
    receiptDate: '2026-05-18'
  },
  {
    id: 'PO-002',
    supplierId: 3,
    supplierName: 'Novda Non',
    date: '2026-05-20',
    businessId: 1,
    items: [
      { productId: 3, name: 'Non (Tandir)', quantity: 200, type: 'tuzli', size: '300g', unit: 'gr', costPrice: 4000 }
    ],
    total: 800000,
    status: 'Kutilmoqda'
  }
];

const initialCustomers = [
  { id: 1, name: 'Bobur Mirzo', phone: '+998901234567', email: 'bobur@gmail.com', businessId: 1 },
  { id: 2, name: 'Zilola Ahmedova', phone: '+998934567890', email: 'zilola@gmail.com', businessId: 1 },
];

const initialAgents = [
  { id: 1, name: 'Agent Davron', phone: '+998909998877', businessId: 1, supplierId: 1, supplierName: 'Coca-Cola Uzbekistan' },
];

const initialAgentOrders = [
  { id: 1, agentId: 1, agentName: 'Agent Davron', customerName: 'Bobur Mirzo', items: 'Cola 1L x50', total: 500000, date: '2026-05-20', businessId: 1 },
];

const initialSales = [
  { id: 'TXN-001', date: '2026-05-21', time: '12:30', items: [{ name: 'Cola 1L', qty: 2, price: 10000 }, { name: 'Non (Tandir)', qty: 1, price: 8000 }], amount: 28000, method: 'Naqd', cashier: 'Akmaljon', businessId: 1 },
];

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

  const [categories, setCategories] = useState(['Ichimliklar', 'Oziq-ovqat', 'Sut mahsulotlari', 'Shirinliklar', 'Kraxmal']);

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

  const businesses = [
    { id: 1, name: 'Market (Oziq-ovqat)' }
  ];

  const currentBusiness = businesses.find(b => b.id === currentBusinessId);

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
