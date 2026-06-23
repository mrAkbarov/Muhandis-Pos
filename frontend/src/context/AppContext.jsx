import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  loadPosData, createSupplier, createPurchaseOrder, receivePurchaseOrder,
  saveProduct, deleteProduct, createSale, registerCatalogProduct,
  addCatalogItemToSupplier, payCreditAccount, updateSupplierAgent,
} from '../api/pos';
import { businesses as fallbackBusinesses, defaultCategories } from '../data/initialData';

const AppContext = createContext();

const BRANCH_STORAGE_KEY = 'pos_selected_branch';

function preferMagazinBranch(businesses, branchId) {
  if (!businesses.length) return branchId;
  if (branchId) {
    const current = businesses.find((b) => String(b.id) === String(branchId));
    if (current?.name?.startsWith('Magazin')) return branchId;
  }
  const mag = businesses.find((b) => b.name?.startsWith('Magazin'));
  return mag?.id ? String(mag.id) : branchId;
}

function resolveBusinessId(businesses, currentUser) {
  if (!businesses.length) return null;

  const userBranchId = currentUser?.branch ? String(currentUser.branch) : null;
  if (userBranchId) {
    const match = businesses.find((b) => String(b.id) === userBranchId);
    return match ? match.id : userBranchId;
  }

  if (currentUser?.isGlobalAdmin) {
    try {
      const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (stored && businesses.some((b) => String(b.id) === stored)) {
        return preferMagazinBranch(businesses, stored);
      }
    } catch {
      /* ignore */
    }
  }

  const mag = businesses.find((b) => b.name?.startsWith('Magazin'));
  return mag?.id ?? businesses[0]?.id ?? null;
}

function warehouseForBusiness(warehouses, businessId) {
  if (!businessId) return null;
  const list = warehouses.filter((w) => String(w.businessId) === String(businessId));
  return list[0]?.id ?? null;
}

function getLoadBranchId(currentUser) {
  if (currentUser?.branch) return String(currentUser.branch);
  if (currentUser?.isGlobalAdmin) {
    try {
      const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function enrichProductsWithCatalogSize(productList, supplierList) {
  return productList.map((p) => {
    if (p.size) return p;
    for (const sup of supplierList) {
      const cat = (sup.catalog || []).find((c) => c.productId === p.id && c.size);
      if (cat) {
        return { ...p, size: cat.size, unit: cat.unit || p.unit };
      }
    }
    return p;
  });
}

export function AppProvider({ children }) {
  const { currentUser, authReady, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    const val = localStorage.getItem('sidebar_collapsed');
    return val ? JSON.parse(val) : false;
  });

  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [businesses, setBusinesses] = useState(fallbackBusinesses);
  const [currentBusinessId, setCurrentBusinessIdState] = useState(null);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dealerOrders, setDealerOrders] = useState([]);
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentOrders, setAgentOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  const refreshData = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    if (!currentUser) {
      setDataReady(true);
      return;
    }

    if (!silent) {
      setDataReady(false);
    }
    setDataError(null);

    try {
      const branchForLoad = options.branchId ?? getLoadBranchId(currentUser);
      const data = await loadPosData(branchForLoad);
      setBusinesses(data.businesses.length ? data.businesses : fallbackBusinesses);
      setSuppliers(data.suppliers);
      setProducts(enrichProductsWithCatalogSize(data.products, data.suppliers));
      setWarehouses(data.warehouses);
      setInventory(data.inventory);
      setDealerOrders(data.dealerOrders);
      setCreditAccounts(data.creditAccounts);
      setAgents(data.agents);
      setAgentOrders(data.agentOrders);
      setSales(data.sales);
      setCategories(data.categories.length ? data.categories : defaultCategories);

      const nextBusinesses = data.businesses.length ? data.businesses : fallbackBusinesses;
      const branchId = data.activeBranchId ?? resolveBusinessId(nextBusinesses, currentUser);
      setCurrentBusinessIdState(branchId);
      setSelectedWarehouseId(warehouseForBusiness(data.warehouses, branchId));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        return;
      }
      setDataError(err.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setDataReady(true);
    }
  }, [currentUser, logout]);

  const setCurrentBusinessId = useCallback((id) => {
    setCurrentBusinessIdState(id);
    if (currentUser?.isGlobalAdmin && id) {
      localStorage.setItem(BRANCH_STORAGE_KEY, String(id));
      refreshData({ branchId: id, silent: true });
    }
  }, [currentUser?.isGlobalAdmin, refreshData]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      setDataReady(true);
      setDataError(null);
      return;
    }
    refreshData();
  }, [authReady, currentUser, refreshData]);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const activeBusinessWarehouses = warehouses.filter(
    (w) => w.businessId === currentBusinessId
  );

  useEffect(() => {
    if (!currentBusinessId) return;
    const validWarehouses = warehouses.filter((w) => w.businessId === currentBusinessId);
    if (validWarehouses.length > 0 && !validWarehouses.some((w) => w.id === selectedWarehouseId)) {
      setSelectedWarehouseId(validWarehouses[0].id);
    }
  }, [currentBusinessId, warehouses, selectedWarehouseId]);

  const getProductStock = (productId, wId) => {
    const whId = wId || selectedWarehouseId;
    const inv = inventory.find((i) => i.productId === productId && i.warehouseId === whId);
    return inv ? inv.quantity : 0;
  };

  const getBusinessProducts = () =>
    products.filter((p) => p.businessId === currentBusinessId);

  const getSupplierCatalog = (supplierId) => {
    const sup = suppliers.find((s) => String(s.id) === String(supplierId));
    return sup?.catalog || [];
  };

  const getIncomingAlerts = useCallback(() => {
    if (!currentBusinessId) {
      return { unlinkedCatalog: [], pendingReceipts: [], totalCount: 0 };
    }
    const businessSuppliers = suppliers.filter((s) => s.businessId === currentBusinessId);
    const unlinkedCatalog = [];
    for (const sup of businessSuppliers) {
      for (const item of sup.catalog || []) {
        if (!item.productId) {
          unlinkedCatalog.push({
            ...item,
            supplierId: sup.id,
            supplierName: sup.name,
          });
        }
      }
    }
    const pendingReceipts = dealerOrders.filter(
      (o) => o.businessId === currentBusinessId && o.status === 'Kutilmoqda',
    );
    return {
      unlinkedCatalog,
      pendingReceipts,
      totalCount: unlinkedCatalog.length + pendingReceipts.length,
    };
  }, [suppliers, dealerOrders, currentBusinessId]);

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId);

  const withSave = useCallback(async (fn) => {
    setSaving(true);
    try {
      const data = await fn();
      await refreshData({ silent: true });
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message || 'Xatolik yuz berdi' };
    } finally {
      setSaving(false);
    }
  }, [refreshData]);

  const addSupplier = useCallback((data) =>
    withSave(() => createSupplier(currentBusinessId, data)), [currentBusinessId, withSave]);

  const addPurchaseOrder = useCallback((data) =>
    withSave(() => createPurchaseOrder(currentBusinessId, data)), [currentBusinessId, withSave]);

  const confirmPurchaseReceipt = useCallback((orderDbId, payload) =>
    withSave(() => receivePurchaseOrder(orderDbId, payload)), [withSave]);

  const addProduct = useCallback((data, editId) =>
    withSave(() => saveProduct(currentBusinessId, data, editId)), [currentBusinessId, withSave]);

  const removeProduct = useCallback((id) =>
    withSave(() => deleteProduct(id)), [withSave]);

  const addAgent = useCallback((data) =>
    withSave(() => updateSupplierAgent(data.supplierId, { name: data.name, phone: data.phone })),
  [withSave]);

  const addCatalogToProducts = useCallback((supplierId, catalogItemId, options) =>
    withSave(() => registerCatalogProduct(supplierId, catalogItemId, options)), [withSave]);

  const addSupplierCatalogItem = useCallback((supplierId, item, category) =>
    withSave(() => addCatalogItemToSupplier(supplierId, item, category)), [withSave]);

  const addSale = useCallback((data) =>
    withSave(() => createSale(currentBusinessId, data)), [currentBusinessId, withSave]);

  const recordCreditPayment = useCallback((accountId, amount, note) =>
    withSave(() => payCreditAccount(accountId, amount, note)), [withSave]);

  return (
    <AppContext.Provider
      value={{
        collapsed, setCollapsed,
        dataReady, dataError, saving, refreshData,
        businesses, currentBusiness, currentBusinessId, setCurrentBusinessId,
        products, setProducts, getBusinessProducts,
        warehouses, setWarehouses, activeBusinessWarehouses,
        selectedWarehouseId, setSelectedWarehouseId,
        inventory, setInventory, getProductStock,
        suppliers, setSuppliers, getSupplierCatalog, getIncomingAlerts,
        dealerOrders, setDealerOrders,
        creditAccounts, setCreditAccounts,
        agents, setAgents,
        agentOrders, setAgentOrders,
        sales, setSales,
        categories, setCategories,
        addSupplier, addPurchaseOrder, confirmPurchaseReceipt,
        addProduct, removeProduct, addAgent, addCatalogToProducts, addSupplierCatalogItem, addSale,
        recordCreditPayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
