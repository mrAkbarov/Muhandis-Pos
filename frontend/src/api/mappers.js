import { resolveMediaUrl } from '../utils/image';

export function mapUserFromApi(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    role: u.role,
    active: u.active ?? u.is_active ?? true,
    branch: u.branch ?? null,
    branchName: u.branch_name ?? null,
    branchCode: u.branch_code ?? null,
    isGlobalAdmin: u.is_global_admin ?? false,
  };
}

export function mapBranchToBusiness(b) {
  return {
    id: b.id,
    name: b.name,
  };
}

export function mapProductFromApi(p) {
  const imageUrl = p.image_url || p.image || '';
  return {
    id: p.id,
    name: p.name,
    category: p.category_name || p.category || '',
    price: Number(p.price ?? p.selling_price ?? 0),
    cost: Number(p.cost ?? p.base_price ?? 0),
    barcode: p.barcode || '',
    emoji: p.emoji || '📦',
    image: resolveMediaUrl(imageUrl),
    size: p.size || '',
    unit: p.unit || 'dona',
    isDraft: false,
    businessId: p.business_id || p.branch,
    stock: p.stock ?? 0,
  };
}

export function mapWarehouseFromApi(w) {
  return {
    id: w.id,
    name: w.name,
    businessId: w.business_id || w.branch,
  };
}

export function mapInventoryFromApi(i) {
  return {
    id: i.id,
    productId: i.product_id ?? i.product,
    warehouseId: i.warehouse_id ?? i.warehouse,
    quantity: i.quantity ?? 0,
  };
}

export function mapSupplierFromApi(s) {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone || '',
    address: s.address || '',
    agentName: s.agent_name || '',
    agentPhone: s.agent_phone || '',
    totalOrders: s.total_orders ?? 0,
    status: s.status || 'Faol',
    businessId: s.business_id || s.branch,
    catalog: (s.catalog || []).map(mapCatalogItemFromApi),
  };
}

/** Agent endi alohida jadval emas — diler ichidagi agent_name/agent_phone */
export function mapAgentsFromSuppliers(suppliers) {
  return (suppliers || [])
    .filter((s) => s.agentName)
    .map((s) => ({
      id: s.id,
      name: s.agentName,
      phone: s.agentPhone || '',
      businessId: s.businessId,
      supplierId: s.id,
      supplierName: s.name,
    }));
}

export function mapCatalogItemFromApi(c) {
  return {
    id: c.id,
    name: c.name,
    category: c.category || '',
    defaultCost: Number(c.default_cost ?? 0),
    itemType: c.item_type || '',
    size: c.size || '',
    unit: c.unit || 'ta',
    barcode: c.barcode || '',
    productId: c.product_id ?? c.product ?? null,
  };
}

export function mapPurchaseOrderFromApi(o) {
  return {
    dbId: o.id,
    id: o.external_id || String(o.id),
    supplierId: o.supplier_id ?? o.supplier,
    supplierName: o.supplier_name || '',
    date: o.date,
    businessId: o.business_id || o.branch,
    items: (o.lines || []).map((l) => ({
      lineId: l.id,
      productId: l.product_id ?? l.product,
      catalogItemId: l.catalog_item_id ?? l.catalog_item,
      name: l.name,
      quantity: l.quantity,
      type: l.item_type,
      size: l.size,
      unit: l.unit,
      costPrice: Number(l.cost_price ?? 0),
    })),
    total: Number(o.total ?? 0),
    status: o.status || '',
    receiptDate: o.receipt_date || null,
  };
}

export function mapCreditTransactionFromApi(t) {
  const detail = t.sale_detail;
  return {
    id: t.id,
    kind: t.kind,
    amount: Number(t.amount ?? 0),
    note: t.note || '',
    cashierName: t.cashier_name || '',
    createdAt: t.created_at,
    saleId: t.sale ?? null,
    saleDetail: detail ? {
      externalId: detail.external_id,
      date: detail.date,
      time: detail.time || '',
      items: (detail.items || []).map((i) => ({
        name: i.name,
        qty: i.qty,
        price: Number(i.price ?? 0),
      })),
      amount: Number(detail.amount ?? 0),
      cashierName: detail.cashier_name || '',
    } : null,
  };
}

export function mapCreditAccountFromApi(a) {
  return {
    id: a.id,
    customerName: a.customer_name,
    phone: a.phone || '',
    balance: Number(a.balance ?? 0),
    businessId: a.business_id || a.branch,
    purchaseCount: Number(a.purchase_count ?? 0),
    transactions: (a.transactions || []).map(mapCreditTransactionFromApi),
  };
}

export function mapCustomerFromApi(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    businessId: c.business_id || c.branch,
  };
}

export function mapAgentFromApi(a) {
  return {
    id: a.id,
    name: a.name,
    phone: a.phone || '',
    businessId: a.business_id || a.branch,
    supplierId: a.supplier_id ?? a.supplier,
    supplierName: a.supplier_name || '',
  };
}

export function mapAgentOrderFromApi(o) {
  return {
    id: o.id,
    supplierId: o.supplier_id ?? o.supplier,
    agentName: o.agent_name || '',
    customerName: o.customer_name || '',
    items: o.items || '',
    total: Number(o.total ?? 0),
    date: o.date,
    businessId: o.business_id || o.branch,
  };
}

export function mapSaleFromApi(s) {
  return {
    id: s.external_id || String(s.id),
    date: s.date,
    time: s.time || '',
    items: s.items || [],
    amount: Number(s.amount ?? 0),
    method: s.method || 'Naqd',
    paymentBreakdown: s.payment_breakdown || {},
    cashier: s.cashier_name || '',
    businessId: s.business_id || s.branch,
  };
}

export function mapCategoryFromApi(c) {
  return typeof c === 'string' ? c : c.name;
}
