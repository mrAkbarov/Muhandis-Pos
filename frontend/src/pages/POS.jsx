import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { fetchPosDrafts, createPosDraft, deletePosDraft } from '../api/pos';
import { NAV_POS, filterByRole } from '../config/navigation';
import { canAccessRoute } from '../config/roles';
import { PRIMARY_COLOR, PAGE_BG } from '../config/constants';
import { formatDateShort } from '../utils/format';
import { formatProductSizeDisplay } from '../config/dealerProducts';
import { findProductByScanCode, parseScanCode } from '../utils/scanCode';
import { printThermalReceipt } from '../utils/printReceipt';
import BrandLogo from '../components/brand/BrandLogo';
import {
  Search, Remove, Delete, ShoppingCartCheckout,
  CategoryOutlined, CalendarToday, Assistant, Close,
  PauseCircleOutlined, PlaylistPlay, Menu, Print,
  ShoppingBag, AccountBalanceWallet, ReceiptLong, PointOfSale,
} from '@mui/icons-material';
import { Button, Chip, IconButton, InputAdornment, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Drawer, Badge, Autocomplete } from '@mui/material';

const POS_NAV_ICONS = {
  products: <ShoppingBag fontSize="small" />,
  credit: <AccountBalanceWallet fontSize="small" />,
  transactions: <ReceiptLong fontSize="small" />,
  pos: <PointOfSale fontSize="small" />,
};

const POS_MENU_WIDTH = 280;

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";
const fmtNum = (n) => Number(n).toLocaleString('uz-UZ');
const formatNasiyaOption = (a) => `${a.customerName} · ${fmtNum(a.balance)} so'm qarz`;
const receiptLine = '--------------------------------';
const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
const TOUCH_BTN = { minHeight: 56, fontSize: 16, fontWeight: 700, borderRadius: 14, textTransform: 'none', px: 2 };
const PAY_METHODS = ['Naqd', 'Karta', 'Online', 'Aralash'];
const PRIMARY = PRIMARY_COLOR;
const PRIMARY_HOVER = '#3451d1';
const PRIMARY_LIGHT = '#eef0ff';

export default function POS() {
  const navigate = useNavigate();
  const { products, getProductStock, addSale, saving, currentBusinessId, currentBusiness, creditAccounts, setCollapsed } = useApp();
  const { currentUser } = useAuth();
  const cashierName = currentUser?.name ?? 'Kassir';
  
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const searchDraftRef = useRef('');
  const lastScanRef = useRef({ code: '', at: 0 });
  const scanProcessingRef = useRef(false);
  const scanTimerRef = useRef(null);
  const SCAN_DEBOUNCE_MS = 120;
  const SCAN_COOLDOWN_MS = 600;

  const isScanLike = useCallback((value) => {
    const v = String(value || '').trim();
    return v.startsWith('01') && v.length >= 16;
  }, []);
  const [selectedCat, setSelectedCat] = useState('Barchasi');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('Naqd');

  const [posDrafts, setPosDrafts] = useState([]);
  const [draftsDrawerOpen, setDraftsDrawerOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [qtyEditItem, setQtyEditItem] = useState(null);
  const [qtyInput, setQtyInput] = useState('');
  
  // Dialog and AI drawer states
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [nasiyaOpen, setNasiyaOpen] = useState(false);
  const [nasiyaCustomer, setNasiyaCustomer] = useState('');
  const [nasiyaNewMode, setNasiyaNewMode] = useState(false);
  const [selectedNasiyaAccount, setSelectedNasiyaAccount] = useState(null);
  const [mixOpen, setMixOpen] = useState(false);
  const [mixCash, setMixCash] = useState('');
  const [mixCard, setMixCard] = useState('');

  const loadDrafts = useCallback(async () => {
    if (!currentBusinessId) return;
    try {
      const list = await fetchPosDrafts(currentBusinessId);
      setPosDrafts(list);
    } catch {
      setPosDrafts([]);
    }
  }, [currentBusinessId]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  useEffect(() => {
    setMenuOpen(false);
  }, []);

  /** Boshqa chernoviklarda band qilingan miqdor (joriy ochilgan chernovikdan tashqari) */
  const getDraftReserved = useCallback((productId, excludeDraftId = activeDraftId) => {
    let n = 0;
    for (const d of posDrafts) {
      if (excludeDraftId && d.id === excludeDraftId) continue;
      for (const item of d.items || []) {
        if (Number(item.id) === Number(productId)) {
          n += Number(item.qty) || 0;
        }
      }
    }
    return n;
  }, [posDrafts, activeDraftId]);

  /** Savatga qo'shish mumkin bo'lgan maksimal miqdor */
  const getMaxQtyForProduct = useCallback((productId, excludeDraftId = activeDraftId) => {
    const physical = getProductStock(productId);
    const reserved = getDraftReserved(productId, excludeDraftId);
    return Math.max(0, physical - reserved);
  }, [getProductStock, getDraftReserved, activeDraftId]);

  /** Yana 1 ta qo'shish mumkinmi (joriy savat hisobga olinadi) */
  const canAddMoreToCart = useCallback((productId, currentQtyInCart) => {
    return currentQtyInCart < getMaxQtyForProduct(productId);
  }, [getMaxQtyForProduct]);

  // Time state
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => searchRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, []);

  const focusSearch = useCallback(() => {
    window.setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const getSearchCode = useCallback(() => {
    const domVal = searchRef.current?.value;
    if (domVal != null && String(domVal).trim()) return String(domVal).trim();
    if (searchDraftRef.current.trim()) return searchDraftRef.current.trim();
    return search.trim();
  }, [search]);

  const clearSearchInput = useCallback(() => {
    searchDraftRef.current = '';
    setSearch('');
    if (searchRef.current) searchRef.current.value = '';
    focusSearch();
  }, [focusSearch]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.businessId === currentBusinessId),
    [products, currentBusinessId],
  );

  /** Qoldiq va bandlik — savat o'zgarganda qayta hisoblanmaydi */
  const productAvailability = useMemo(() => {
    const map = new Map();
    for (const p of activeProducts) {
      const physical = getProductStock(p.id);
      const reserved = getDraftReserved(p.id);
      map.set(p.id, { physical, available: Math.max(0, physical - reserved) });
    }
    return map;
  }, [activeProducts, getProductStock, getDraftReserved]);

  const cartQtyByProduct = useMemo(() => {
    const map = new Map();
    for (const item of cart) {
      map.set(item.id, (map.get(item.id) || 0) + item.qty);
    }
    return map;
  }, [cart]);

  // Categories list derived from products
  const categoriesList = ['Barchasi', ...new Set(activeProducts.map(p => p.category))];

  const filtered = activeProducts.filter((p) => {
    const matchCat = selectedCat === 'Barchasi' || p.category === selectedCat;
    const searchTerm = search.trim();
    if (!searchTerm || isScanLike(searchTerm)) return matchCat;
    const parsedSearch = parseScanCode(searchTerm);
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase())
      || (p.barcode && (
        p.barcode.includes(searchTerm)
        || (parsedSearch && p.barcode.includes(parsedSearch))
      ));
    return matchCat && matchSearch;
  });

  const menuPages = useMemo(() => {
    const role = currentUser?.role;
    if (!role) return [];
    return filterByRole(NAV_POS, role).filter((item) => canAccessRoute(role, item.path));
  }, [currentUser?.role]);

  const addByBarcode = useCallback((code) => {
    const barcodeTrimmed = parseScanCode(code);
    if (!barcodeTrimmed) return false;

    const now = Date.now();
    if (
      lastScanRef.current.code === barcodeTrimmed
      && now - lastScanRef.current.at < SCAN_COOLDOWN_MS
    ) {
      return true;
    }
    if (scanProcessingRef.current) return true;

    const exactMatch = findProductByScanCode(activeProducts, code);
    if (!exactMatch) return false;

    scanProcessingRef.current = true;

    let added = false;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === exactMatch.id);
      const maxQty = getMaxQtyForProduct(exactMatch.id);
      const inCart = existing?.qty || 0;

      if (inCart >= maxQty) {
        alert(`${exactMatch.name}: qoldiq yetarli emas (mavjud: ${maxQty} ta)!`);
        return prev;
      }

      added = true;
      if (existing) {
        return prev.map((i) => (
          i.id === exactMatch.id ? { ...i, qty: i.qty + 1 } : i
        ));
      }
      return [...prev, { ...exactMatch, qty: 1 }];
    });

    if (added) {
      lastScanRef.current = { code: barcodeTrimmed, at: now };
    }

    window.setTimeout(() => {
      scanProcessingRef.current = false;
    }, 150);

    return added;
  }, [activeProducts, getMaxQtyForProduct]);

  const runBarcodeScan = useCallback((code) => addByBarcode(code), [addByBarcode]);

  const processScanInput = useCallback((rawCode) => {
    const code = String(rawCode || '').trim();
    if (!code) return false;

    let matched = runBarcodeScan(code);
    if (!matched) {
      const byName = activeProducts.find((p) => p.name.toLowerCase() === code.toLowerCase());
      if (byName?.barcode) matched = runBarcodeScan(byName.barcode);
    }

    clearSearchInput();
    return matched;
  }, [activeProducts, clearSearchInput, runBarcodeScan]);

  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault?.();
    processScanInput(getSearchCode());
  }, [getSearchCode, processScanInput]);

  const handleSearchChange = useCallback((value) => {
    searchDraftRef.current = value;
    setSearch(value);

    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
    if (!isScanLike(value)) return;

    scanTimerRef.current = window.setTimeout(() => {
      processScanInput(value);
    }, SCAN_DEBOUNCE_MS);
  }, [isScanLike, processScanInput]);

  const addToCart = (product) => {
    const maxQty = getMaxQtyForProduct(product.id);
    if (maxQty < 1) {
      alert(`${product.name}: boshqa navbatda band — sotib bo'lmaydi!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (!canAddMoreToCart(product.id, existing.qty)) {
          alert("Skladda yetarli mahsulot yo'q (navbatlarda band qilingan)!");
          return prev;
        }
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    const maxQty = getMaxQtyForProduct(id);
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          if (newQty > maxQty) {
            alert(`Eng ko'pi ${maxQty} ta (navbatlarda band qilinganlar hisobga olingan)!`);
            return i;
          }
          return { ...i, qty: Math.max(1, newQty) };
        }
        return i;
      })
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const openQtyEditor = (item) => {
    setQtyEditItem(item);
    setQtyInput(String(item.qty));
  };

  const applyQtyInput = () => {
    if (!qtyEditItem) return;
    const maxQty = getMaxQtyForProduct(qtyEditItem.id);
    const n = parseInt(qtyInput, 10);
    if (!qtyInput.trim() || Number.isNaN(n) || n < 1) {
      alert('To\'g\'ri son kiriting');
      return;
    }
    if (n > maxQty) {
      alert(`Faqat ${maxQty} ta mavjud (buncha mahsulot yo'q)!`);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === qtyEditItem.id ? { ...i, qty: n } : i))
    );
    setQtyEditItem(null);
    setQtyInput('');
  };

  const handleNumpad = (key) => {
    if (key === 'C') {
      setQtyInput('');
      return;
    }
    if (key === 'OK') {
      applyQtyInput();
      return;
    }
    setQtyInput((prev) => {
      const next = `${prev}${key}`;
      if (next.length > 5) return prev;
      return next;
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;

  const clearCart = () => {
    setCart([]);
    setActiveDraftId(null);
  };

  const serializeCartItems = (items) =>
    items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      emoji: i.emoji,
      barcode: i.barcode,
      category: i.category,
      cost: i.cost,
    }));

  const saveCartToDraft = async () => {
    if (!currentBusinessId) return;
    if (cart.length === 0) {
      alert("Savat bo'sh — avval mahsulot qo'shing");
      return;
    }
    const defaultLabel = `Navbat #${posDrafts.length + 1}`;
    const label = window.prompt('Navbat nomi (masalan: qizil ko\'ylakli mijoz):', defaultLabel);
    if (label === null) return;

    setDraftSaving(true);
    try {
      await createPosDraft(currentBusinessId, {
        label: label.trim() || defaultLabel,
        payMethod,
        items: serializeCartItems(cart),
        total,
      });
      setCart([]);
      setActiveDraftId(null);
      await loadDrafts();
    } catch (err) {
      alert(err.message || 'Chernovik saqlanmadi');
    } finally {
      setDraftSaving(false);
    }
  };

  const restoreDraft = (draft) => {
    if (cart.length > 0) {
      const ok = window.confirm(
        "Joriy savat bekor qilinadi. Saqlangan navbat ochilsinmi?"
      );
      if (!ok) return;
    }
    const restored = [];
    const skipped = [];
    for (const item of draft.items || []) {
      const maxQty = getMaxQtyForProduct(item.id, draft.id);
      const want = Number(item.qty) || 1;
      if (maxQty < 1) {
        skipped.push(item.name);
        continue;
      }
      const qty = Math.min(want, maxQty);
      if (qty < want) {
        alert(`${item.name}: faqat ${qty} ta qoldi (${want - qty} ta boshqa mijozga sotilgan yoki band).`);
      }
      restored.push({ ...item, qty });
    }
    if (restored.length === 0) {
      alert(
        skipped.length
          ? `Savat ochilmadi — mahsulotlar boshqa mijozga sotilgan yoki band: ${skipped.join(', ')}`
          : 'Savat bo\'sh'
      );
      return;
    }
    setCart(restored);
    setPayMethod(draft.payMethod || 'Naqd');
    setActiveDraftId(draft.id);
    setDraftsDrawerOpen(false);
  };

  const handleDeleteDraft = async (draftId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Bu chernovik o\'chirilsinmi?')) return;
    try {
      await deletePosDraft(draftId);
      if (activeDraftId === draftId) setActiveDraftId(null);
      await loadDrafts();
    } catch (err) {
      alert(err.message || 'O\'chirib bo\'lmadi');
    }
  };

  const activeDraftLabel = posDrafts.find((d) => d.id === activeDraftId)?.label;

  const nasiyaAccounts = useMemo(
    () => creditAccounts
      .filter((a) => String(a.businessId) === String(currentBusinessId))
      .sort((a, b) => b.balance - a.balance || a.customerName.localeCompare(b.customerName, 'uz')),
    [creditAccounts, currentBusinessId],
  );

  const matchedNasiyaAccount = selectedNasiyaAccount;

  const resetNasiyaForm = useCallback(() => {
    setSelectedNasiyaAccount(null);
    setNasiyaCustomer('');
    setNasiyaNewMode(false);
  }, []);

  const checkout = async ({
    method = payMethod,
    customerName = '',
    customerPhone = '',
    creditAccountId = null,
    createNewCreditAccount = false,
    paymentBreakdown = null,
  } = {}) => {
    if (cart.length === 0) return;

    for (const item of cart) {
      const maxQty = getMaxQtyForProduct(item.id);
      if (item.qty > maxQty) {
        alert(`${item.name}: faqat ${maxQty} ta sotish mumkin (qoldiq yoki navbatlar band).`);
        return;
      }
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toLocaleDateString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
    const txnId = `TXN-${Date.now().toString().slice(-6)}`;
    const effectiveMethod = method === 'Aralash' ? 'Naqd+Karta' : method;
    const receiptSnapshot = {
      id: txnId,
      date: formattedDate,
      time: formattedTime,
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        barcode: i.barcode,
      })),
      amount: total,
      method: effectiveMethod,
      paymentBreakdown: paymentBreakdown || {},
      customerName: method === 'Nasiya' ? customerName : '',
      customerPhone: method === 'Nasiya' ? customerPhone : '',
      cashier: cashierName,
      storeName: currentBusiness?.name || 'SmartPOS Market',
      itemCount: cart.reduce((s, i) => s + i.qty, 0),
    };

    const newSale = {
      externalId: txnId,
      id: txnId,
      date: now.toISOString().slice(0, 10),
      time: formattedTime,
      items: receiptSnapshot.items,
      amount: total,
      method: effectiveMethod,
      paymentBreakdown: paymentBreakdown || {},
      customerName: method === 'Nasiya' ? customerName : '',
      customerPhone: method === 'Nasiya' ? customerPhone : '',
      creditAccountId: method === 'Nasiya' ? creditAccountId : null,
      createNewCreditAccount: method === 'Nasiya' ? createNewCreditAccount : false,
      cashier: cashierName,
      posDraftId: activeDraftId,
    };

    const result = await addSale(newSale);
    if (!result.ok) {
      alert(result.error || 'Sotuv saqlanmadi');
      return false;
    }

    setReceiptDialog(receiptSnapshot);
    if (activeDraftId) {
      try {
        await deletePosDraft(activeDraftId);
      } catch {
        /* chernovik allaqachon o'chirilgan bo'lishi mumkin */
      }
      setActiveDraftId(null);
      await loadDrafts();
    }
    setCart([]);
    return true;
  };

  const handleMixPay = async () => {
    const cash = parseInt(mixCash, 10) || 0;
    const card = parseInt(mixCard, 10) || 0;
    if (cash + card !== total) {
      alert(`Jami ${fmtNum(total)} so'm bo'lishi kerak (hozir: ${fmtNum(cash + card)})`);
      return;
    }
    if (cash <= 0 || card <= 0) {
      alert('Naqd va karta summasi ikkalasi ham 0 dan katta bo\'lishi kerak');
      return;
    }
    const ok = await checkout({
      method: 'Aralash',
      paymentBreakdown: { Naqd: cash, Karta: card },
    });
    if (ok) {
      setMixOpen(false);
      setMixCash('');
      setMixCard('');
    }
  };

  const openMixDialog = () => {
    if (cart.length === 0) return;
    setMixCash('');
    setMixCard(String(Math.round(total * 0.3)));
    setMixOpen(true);
  };

  const handlePayClick = () => {
    if (payMethod === 'Aralash') {
      openMixDialog();
      return;
    }
    checkout();
  };

  const handleNasiyaSale = async () => {
    if (nasiyaNewMode) {
      const name = nasiyaCustomer.trim();
      if (!name) {
        alert('Mijoz ismini kiriting');
        return;
      }
      const ok = await checkout({
        method: 'Nasiya',
        customerName: name,
        createNewCreditAccount: true,
      });
      if (ok) {
        setNasiyaOpen(false);
        resetNasiyaForm();
      }
      return;
    }

    if (!selectedNasiyaAccount) {
      alert('Ro\'yxatdan mijozni tanlang yoki "Yangi mijoz" tugmasini bosing');
      return;
    }
    const ok = await checkout({
      method: 'Nasiya',
      customerName: selectedNasiyaAccount.customerName,
      creditAccountId: selectedNasiyaAccount.id,
    });
    if (ok) {
      setNasiyaOpen(false);
      resetNasiyaForm();
    }
  };

  const navigateToPage = (path) => {
    setMenuOpen(false);
    if (path !== '/pos') {
      setCollapsed(false);
    }
    navigate(path);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Kassa sarlavha — POS terminal */}
      <div className="shrink-0 flex items-center justify-between text-white px-4 py-3 shadow-md gap-3" style={{ background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY_HOVER} 100%)` }}>
        <div className="flex items-center gap-3 min-w-0">
          <IconButton
            onClick={() => setMenuOpen((v) => !v)}
            sx={{
              color: '#fff',
              bgcolor: menuOpen ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
              width: 56,
              height: 56,
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
            }}
            aria-label="Menyu"
          >
            <Menu sx={{ fontSize: 28 }} />
          </IconButton>
          <BrandLogo size={30} onLight />
          <Chip label="ONLINE" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.3)', color: '#bbf7d0', fontWeight: 700, fontSize: 11, height: 28, display: { xs: 'none', sm: 'flex' } }} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col items-end">
            <span className="font-mono text-lg sm:text-xl font-bold bg-white/10 px-4 py-2 rounded-2xl leading-none">
              {time.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-sm text-blue-100 mt-1.5 font-semibold tracking-wide">
              {formatDateShort(time)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Kassa bilan birga ochilib-yopiladigan yon menyu — admin sidebar uslubida */}
        <aside
          className="shrink-0 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{
            width: menuOpen ? POS_MENU_WIDTH : 0,
            background: 'linear-gradient(180deg, #1a2035 0%, #1a2035 100%)',
          }}
        >
          <div className="w-[280px] h-full flex flex-col">
            <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
                  <PointOfSale sx={{ color: '#fff', fontSize: 18 }} />
                </div>
                <p className="font-bold text-white text-sm">Bo&apos;limlar</p>
              </div>
              <IconButton size="small" onClick={() => setMenuOpen(false)} aria-label="Menyuni yopish" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                <Close fontSize="small" />
              </IconButton>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto space-y-1">
              {menuPages.length === 0 ? (
                <p className="px-5 py-6 text-sm text-white/45">Boshqa sahifa yo&apos;q</p>
              ) : (
                menuPages.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateToPage(item.path)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-150 hover:bg-white/5"
                    style={{
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                      {POS_NAV_ICONS[item.icon]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-[11px] text-white/40 truncate">{item.title}</span>
                    </span>
                  </button>
                ))
              )}
            </nav>
            <div className="p-4 border-t border-white/10 shrink-0">
              <Button
                fullWidth
                variant="contained"
                startIcon={<PointOfSale />}
                onClick={() => setMenuOpen(false)}
                sx={{
                  ...TOUCH_BTN,
                  bgcolor: PRIMARY,
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: PRIMARY_HOVER },
                }}
              >
                Kassa
              </Button>
            </div>
          </div>
        </aside>

      <div className="flex flex-1 min-h-0 gap-3 p-3 overflow-hidden min-w-0" style={{ background: PAGE_BG }}>
        {/* Mahsulotlar */}
        <div className="flex-[1.8] flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-w-0">
          <div className="shrink-0 p-3 bg-white border-b border-gray-100 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSearchSubmit(e);
              }}
              action="#"
            >
              <TextField
                inputRef={searchRef}
                name="pos-scan-input"
                placeholder="Qidirish, shtrix-kod yoki QR skaner..."
                value={search}
                onChange={(e) => {
                  const v = e.target.value;
                  searchDraftRef.current = v;
                  setSearch(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'NumpadEnter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearchSubmit(e);
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                inputMode="text"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search style={{ fontSize: 26, color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: 58,
                    fontSize: 17,
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                  },
                }}
              />
            </form>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className="shrink-0 px-5 py-3 rounded-2xl text-base font-bold transition-all min-h-[52px]"
                  style={{
                    background: selectedCat === cat ? PRIMARY : '#f3f4f6',
                    color: selectedCat === cat ? '#fff' : '#4b5563',
                    border: selectedCat === cat ? 'none' : '2px solid #e5e7eb',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 content-start auto-rows-min" style={{ background: PAGE_BG }}>
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400 text-lg">Mahsulot topilmadi</div>
            ) : (
              filtered.map((p) => {
                const { physical, available: baseAvailable } = productAvailability.get(p.id) || { physical: 0, available: 0 };
                const inCart = cartQtyByProduct.get(p.id) || 0;
                const available = Math.max(0, baseAvailable - inCart);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => available > 0 && addToCart(p)}
                    disabled={available === 0}
                    className="relative bg-white rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed min-h-[168px] flex flex-col shadow-sm hover:shadow-md"
                    style={{ borderColor: available > 0 ? '#e2e8f0' : '#fecaca' }}
                  >
                    {available > 0 && (
                      <span
                        className="absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full z-10 leading-none"
                        style={{
                          background: available <= 5 ? '#fef3c7' : '#ecfdf5',
                          color: available <= 5 ? '#b45309' : '#15803d',
                        }}
                      >
                        {available} ta
                      </span>
                    )}
                    <div className="flex-1 flex items-center justify-center py-2 min-h-[88px]">
                      <div className="w-[72px] h-[72px] rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-4xl">{p.emoji || '📦'}</span>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">{p.name}</p>
                      {formatProductSizeDisplay(p) && (
                        <p className="text-xs font-semibold truncate mt-0.5" style={{ color: PRIMARY }}>{formatProductSizeDisplay(p)}</p>
                      )}
                      <div className="flex items-end justify-between mt-1.5 gap-2">
                        <p className="text-lg font-black leading-none" style={{ color: PRIMARY }}>{fmtNum(p.price)}</p>
                        {available <= 0 && physical > 0 && (
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700">Band</span>
                        )}
                        {available <= 0 && physical <= 0 && (
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-red-50 text-red-600">Tugagan</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Savat */}
        <div className="w-[min(480px,42vw)] shrink-0 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-[#f8fafc] border-b border-gray-100 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-gray-800 text-base uppercase tracking-wide">Savatcha</h2>
              <span className="text-base font-extrabold text-white min-w-[36px] h-9 px-3 flex items-center justify-center rounded-full" style={{ background: PRIMARY }}>
                {cart.length}
              </span>
            </div>
            {activeDraftLabel && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Chernovik: <b>{activeDraftLabel}</b>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outlined"
                startIcon={<PauseCircleOutlined sx={{ fontSize: 22 }} />}
                onClick={saveCartToDraft}
                disabled={cart.length === 0 || draftSaving}
                sx={{
                  flex: 1, ...TOUCH_BTN,
                  borderWidth: 2,
                  borderColor: PRIMARY, color: PRIMARY,
                  '&:hover': { borderWidth: 2, borderColor: PRIMARY_HOVER, bgcolor: PRIMARY_LIGHT },
                }}
              >
                Navbat
              </Button>
              <Badge badgeContent={posDrafts.length} color="warning" max={99} sx={{ flex: 1, '& .MuiBadge-badge': { fontSize: 12, height: 22, minWidth: 22 } }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlaylistPlay sx={{ fontSize: 22 }} />}
                  onClick={() => setDraftsDrawerOpen(true)}
                  sx={{ ...TOUCH_BTN, bgcolor: PRIMARY, boxShadow: 'none', '&:hover': { bgcolor: PRIMARY_HOVER } }}
                >
                  Ro&apos;yxat
                </Button>
              </Badge>
            </div>
          </div>

          {/* Savat ro'yxati */}
          <div className="flex-1 overflow-y-auto bg-white">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center space-y-3">
                <CategoryOutlined style={{ fontSize: 52, color: '#cbd5e1' }} />
                <p className="text-base font-semibold text-gray-500">Savat hozircha bo&apos;sh</p>
                <p className="text-sm text-gray-400">Mahsulot kartasini bosing yoki shtrix-kod skaner qiling</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50/60">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-[15px] leading-snug truncate" title={item.name}>{item.name}</p>
                      {formatProductSizeDisplay(item) && (
                        <p className="text-xs font-semibold truncate" style={{ color: PRIMARY }}>{formatProductSizeDisplay(item)}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-0.5">{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 border-2 border-gray-200 rounded-2xl bg-white p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-xl font-bold text-xl active:bg-gray-200"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => openQtyEditor(item)}
                        className="text-lg font-black min-w-[44px] text-center py-2 rounded-xl active:bg-blue-50"
                        style={{ color: PRIMARY }}
                      >
                        {item.qty}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-xl font-bold text-xl active:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    <IconButton
                      onClick={() => removeItem(item.id)}
                      sx={{
                        color: '#ef4444',
                        bgcolor: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: 2,
                        width: 48,
                        height: 48,
                        shrink: 0,
                      }}
                    >
                      <Delete sx={{ fontSize: 22 }} />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jami va to'lov */}
          <div className="p-5 bg-[#f8fafc] border-t border-gray-200 space-y-5">
            <div className="flex justify-between items-end px-1 pb-1">
              <span className="text-base uppercase text-gray-500 font-bold">Jami:</span>
              <div className="text-right">
                <span className="font-black text-3xl leading-none block" style={{ color: PRIMARY }}>{fmtNum(total)}</span>
                <span className="text-sm text-gray-400 mt-1 block">so&apos;m</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase font-bold text-gray-400 tracking-wide">To&apos;lov usuli</p>
              <div className="grid grid-cols-4 gap-2">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPayMethod(m);
                      if (m === 'Aralash') openMixDialog();
                    }}
                    className="font-bold rounded-2xl transition-all min-h-[54px] text-sm"
                    style={{
                      background: payMethod === m ? PRIMARY : '#fff',
                      color: payMethod === m ? '#fff' : '#4b5563',
                      border: payMethod === m ? `2px solid ${PRIMARY}` : '2px solid #e5e7eb',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) return;
                  resetNasiyaForm();
                  setNasiyaOpen(true);
                }}
                disabled={cart.length === 0 || saving}
                className="w-full mt-1 font-bold rounded-2xl transition-all min-h-[56px] text-base disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: payMethod === 'Nasiya' ? '#f59e0b' : '#fef3c7',
                  color: '#92400e',
                  border: '2px solid #f59e0b',
                }}
              >
                Nasiya (qarzga)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                fullWidth
                variant="contained"
                startIcon={<Delete sx={{ fontSize: 26 }} />}
                onClick={() => {
                  if (cart.length === 0) return;
                  if (window.confirm('Savat to\'liq tozalansinmi?')) clearCart();
                }}
                disabled={cart.length === 0}
                sx={{
                  bgcolor: '#ef4444',
                  color: '#fff',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 18,
                  minHeight: 72,
                  py: 2,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#dc2626' },
                  '&.Mui-disabled': { bgcolor: '#fecaca', color: '#991b1b' },
                }}
              >
                O&apos;chirish
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShoppingCartCheckout sx={{ fontSize: 28 }} />}
                onClick={handlePayClick}
                disabled={cart.length === 0 || saving}
                sx={{
                  bgcolor: PRIMARY,
                  color: '#fff',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 18,
                  minHeight: 72,
                  py: 2,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: PRIMARY_HOVER },
                  '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
                }}
              >
                {saving ? 'Saqlanmoqda...' : 'To\'lash'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Miqdor kiritish */}
      <Dialog open={!!qtyEditItem} onClose={() => setQtyEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          Miqdor: {qtyEditItem?.name}
          {qtyEditItem && formatProductSizeDisplay(qtyEditItem) ? ` · ${formatProductSizeDisplay(qtyEditItem)}` : ''}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <p className="text-xs text-gray-500 mb-2">
            Maksimal: <b>{qtyEditItem ? getMaxQtyForProduct(qtyEditItem.id) : 0}</b> ta
          </p>
          <TextField
            fullWidth
            size="small"
            label="Soni"
            type="number"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && applyQtyInput()}
            inputProps={{ min: 1, max: qtyEditItem ? getMaxQtyForProduct(qtyEditItem.id) : 999 }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 18, fontWeight: 700 } }}
          />
          <div className="grid grid-cols-3 gap-2">
            {NUMPAD.map((key) => (
              <Button
                key={key}
                variant={key === 'OK' ? 'contained' : 'outlined'}
                onClick={() => handleNumpad(key)}
                sx={{
                  minHeight: 52,
                  fontSize: 18,
                  fontWeight: 700,
                  borderRadius: 2,
                  ...(key === 'OK'
                    ? { bgcolor: '#4361ee', '&:hover': { bgcolor: '#3451d1' } }
                    : { borderColor: '#e5e7eb', color: '#374151' }),
                }}
              >
                {key}
              </Button>
            ))}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQtyEditItem(null)}>Bekor</Button>
          <Button variant="contained" onClick={applyQtyInput} sx={{ bgcolor: '#4361ee' }}>
            Tasdiqlash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kutilayotgan savatlar (chernoviklar) */}
      <Drawer
        anchor="right"
        open={draftsDrawerOpen}
        onClose={() => setDraftsDrawerOpen(false)}
        PaperProps={{ sx: { width: 340 } }}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Navbatdagi savatlar</h3>
            <p className="text-xs text-gray-500">Mijoz ketganda saqlangan chernoviklar</p>
          </div>
          <IconButton size="small" onClick={() => setDraftsDrawerOpen(false)}>
            <Close />
          </IconButton>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {posDrafts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 px-4">
              Hozircha navbat yo&apos;q. Savatni to&apos;ldirib «Navbatga saqlash» tugmasini bosing.
            </p>
          ) : (
            posDrafts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                onClick={() => restoreDraft(draft)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeDraftId === draft.id
                    ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100'
                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{draft.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {draft.items?.length || 0} xil · {draft.itemCount || 0} dona
                    </p>
                    <p className="text-xs font-bold text-blue-600 mt-1">{fmt(draft.total)}</p>
                  </div>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    sx={{ color: '#ef4444' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Bosib davom ettiring →</p>
              </button>
            ))
          )}
        </div>
      </Drawer>

      {/* Termal chek — ekranda (keyin printer/terminal) */}
      {receiptDialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 print:bg-white print:p-0"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto print:overflow-visible">
            <div
              id="pos-receipt-slip"
              className="w-[min(340px,92vw)] bg-[#faf9f6] text-black shadow-2xl print:shadow-none font-mono text-[12px] leading-relaxed px-5 py-6"
              style={{ fontFamily: '"Courier New", Courier, monospace' }}
            >
              <p className="text-center text-[15px] font-black uppercase tracking-wide">
                {receiptDialog.storeName}
              </p>
              <p className="text-center text-[10px] mt-1 text-gray-600">
                Kassa / POS tizimi
              </p>
              <p className="text-center text-[10px] text-gray-600">
                {receiptDialog.date} &nbsp; {receiptDialog.time}
              </p>
              <p className="text-center text-[10px] font-bold mt-1">
                CHEK № {receiptDialog.id}
              </p>

              <p className="text-center my-2 text-[10px]">{receiptLine}</p>
              <p className="text-center text-[11px] font-bold uppercase mb-3">
                Tovar chek / Savdo cheki
              </p>

              {receiptDialog.items.map((item, idx) => (
                <div key={idx} className="mb-3">
                  <p className="font-bold text-[11px] leading-snug">{item.name}</p>
                  {formatProductSizeDisplay(item) && (
                    <p className="text-[9px] text-blue-700 font-semibold">{formatProductSizeDisplay(item)}</p>
                  )}
                  {item.barcode && (
                    <p className="text-[9px] text-gray-500">{item.barcode}</p>
                  )}
                  <div className="flex justify-between gap-2 mt-0.5 text-[11px]">
                    <span>{item.qty} x {fmtNum(item.price)}</span>
                    <span className="font-bold">{fmtNum(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}

              <p className="text-center my-2 text-[10px]">{receiptLine}</p>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Mahsulot turlari:</span>
                  <span>{receiptDialog.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jami dona:</span>
                  <span>{receiptDialog.itemCount} ta</span>
                </div>
                <div className="flex justify-between">
                  <span>To&apos;lov turi:</span>
                  <span className="font-bold">{receiptDialog.method}</span>
                </div>
                {receiptDialog.paymentBreakdown && Object.keys(receiptDialog.paymentBreakdown).length > 0 && (
                  Object.entries(receiptDialog.paymentBreakdown).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="font-bold">{fmtNum(v)} so&apos;m</span>
                    </div>
                  ))
                )}
                {receiptDialog.method === 'Nasiya' && receiptDialog.customerName && (
                  <div className="flex justify-between">
                    <span>Mijoz:</span>
                    <span className="font-bold">
                      {receiptDialog.customerName}
                      {receiptDialog.customerPhone ? ` · ${receiptDialog.customerPhone}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Kassir:</span>
                  <span>{receiptDialog.cashier}</span>
                </div>
              </div>

              <p className="text-center my-3 text-[10px]">{receiptLine}</p>

              <div className="text-right">
                <p className="text-[10px] uppercase text-gray-600 mb-1">Jami to&apos;lov</p>
                <p className="text-[28px] font-black leading-none tracking-tight">
                  {fmtNum(receiptDialog.amount)}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">so&apos;m</p>
              </div>

              <p className="text-center mt-4 text-[10px] text-gray-500">
                *** Xaridingiz uchun rahmat! ***
              </p>
            </div>

            <div className="flex gap-2 w-[min(340px,92vw)] print:hidden">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Print />}
                onClick={async () => {
                  const result = await printThermalReceipt(receiptDialog);
                  if (!result.ok) alert(result.error);
                }}
                sx={{
                  bgcolor: '#fff',
                  borderColor: '#fff',
                  color: '#111',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#f3f4f6', borderColor: '#fff' },
                }}
              >
                Chop etish
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setReceiptDialog(null)}
                sx={{
                  bgcolor: '#4361ee',
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#3451d1' },
                }}
              >
                Yangi savdo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Aralash to'lov */}
      <Dialog open={mixOpen} onClose={() => setMixOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Aralash to&apos;lov</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-500 mb-3">
            Jami: <b>{fmt(total)}</b> — naqd va karta summasini kiriting.
          </p>
          <TextField
            fullWidth
            label="Naqd (so'm)"
            type="number"
            value={mixCash}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setMixCash(v);
              if (v) setMixCard(String(Math.max(0, total - parseInt(v, 10))));
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Karta (so'm)"
            type="number"
            value={mixCard}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setMixCard(v);
              if (v) setMixCash(String(Math.max(0, total - parseInt(v, 10))));
            }}
          />
          <p className="text-xs text-gray-400 mt-2">
            Masalan: {fmtNum(Math.round(total * 0.3))} naqd + {fmtNum(total - Math.round(total * 0.3))} karta
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMixOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={handleMixPay} disabled={saving} sx={{ bgcolor: PRIMARY }}>
            To&apos;lash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nasiya — mijoz tanlash */}
      <Dialog
        open={nasiyaOpen}
        onClose={() => {
          if (!saving) {
            setNasiyaOpen(false);
            resetNasiyaForm();
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Nasiya (qarzga) sotish</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-500 mb-3">
            Mavjud mijozni tanlang yoki bir xil ism bo&apos;lsa &quot;Yangi mijoz&quot; bosing.
          </p>

          <div className="flex gap-2 mb-3">
            <Button
              fullWidth
              variant={!nasiyaNewMode ? 'contained' : 'outlined'}
              onClick={() => setNasiyaNewMode(false)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Mavjud mijoz
            </Button>
            <Button
              fullWidth
              variant={nasiyaNewMode ? 'contained' : 'outlined'}
              onClick={() => {
                setNasiyaNewMode(true);
                setSelectedNasiyaAccount(null);
              }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Yangi mijoz
            </Button>
          </div>

          {!nasiyaNewMode ? (
            <>
              <Autocomplete
                autoHighlight
                options={nasiyaAccounts}
                value={selectedNasiyaAccount}
                onChange={(_, val) => setSelectedNasiyaAccount(val)}
                getOptionLabel={(opt) => formatNasiyaOption(opt)}
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts.filter((a) => a.balance > 0).slice(0, 10);
                  return opts.filter(
                    (a) => a.customerName.toLowerCase().includes(q)
                      || (a.phone && a.phone.includes(q)),
                  );
                }}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                disabled={saving}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div className="py-0.5">
                      <p className="font-medium">{option.customerName}</p>
                      <p className="text-xs text-gray-500">
                        <span className="text-amber-700 font-bold">{fmtNum(option.balance)} so&apos;m qarz</span>
                      </p>
                    </div>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    label="Mijoz qidirish"
                    placeholder="Ism bo'yicha qidiring"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNasiyaSale();
                      }
                    }}
                  />
                )}
              />

              {nasiyaAccounts.some((a) => a.balance > 0) && !selectedNasiyaAccount && (
                <div className="mt-3">
                  <p className="text-[11px] uppercase font-bold text-gray-400 mb-2">Tez tanlash</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nasiyaAccounts.filter((a) => a.balance > 0).slice(0, 6).map((a) => (
                      <Chip
                        key={a.id}
                        label={`${a.customerName} · ${fmtNum(a.balance)}`}
                        size="small"
                        onClick={() => setSelectedNasiyaAccount(a)}
                        sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <TextField
              autoFocus
              fullWidth
              label="Mijoz ismi"
              placeholder="Masalan: Botir"
              value={nasiyaCustomer}
              onChange={(e) => setNasiyaCustomer(e.target.value)}
              disabled={saving}
              helperText="Bir xil ism bo'lsa ham yangi alohida hisob ochiladi"
            />
          )}

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm space-y-1">
            <p>
              <span className="text-gray-600">Bu savdo: </span>
              <b>{fmt(total)}</b>
            </p>
            {matchedNasiyaAccount ? (
              <>
                <p>
                  <span className="text-gray-600">Tanlangan: </span>
                  <b>{matchedNasiyaAccount.customerName}</b>
                  {matchedNasiyaAccount.phone ? ` · ${matchedNasiyaAccount.phone}` : ''}
                </p>
                <p>
                  <span className="text-gray-600">Hozirgi qarz: </span>
                  <b>{fmt(matchedNasiyaAccount.balance)}</b>
                </p>
                <p className="text-amber-800 font-bold">
                  Savdodan keyin jami: {fmt(matchedNasiyaAccount.balance + total)}
                </p>
              </>
            ) : nasiyaNewMode && nasiyaCustomer.trim() ? (
              <p className="text-gray-600">Yangi mijoz hisobi ochiladi.</p>
            ) : null}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setNasiyaOpen(false);
              resetNasiyaForm();
            }}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleNasiyaSale}
            disabled={
              saving
              || (!nasiyaNewMode && !selectedNasiyaAccount)
              || (nasiyaNewMode && !nasiyaCustomer.trim())
            }
            sx={{
              bgcolor: '#f59e0b',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#d97706' },
            }}
          >
            {saving ? 'Saqlanmoqda...' : 'Qarzga yozish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Assistant Drawer */}
      <Drawer anchor="right" open={aiOpen} onClose={() => setAiOpen(false)}>
        <div className="w-80 p-5 flex flex-col justify-between h-full bg-[#1e1b4b] text-white">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Assistant className="text-purple-400" />
                <h2 className="font-bold text-base">POS AI Ko'makchisi</h2>
              </div>
              <IconButton onClick={() => setAiOpen(false)} size="small" sx={{ color: '#fff' }}>
                <Close />
              </IconButton>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <p>Salom! Men sizga POS dasturidagi asosiy funksiyalar va imkoniyatlarni tushuntiraman:</p>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">💡 Mahsulotlarni sotish (Kassa)</p>
                <p>O'ng tomondagi ro'yxatdan mahsulotlarni tanlab savatga qo'shing. To'lov usulini belgilang va "Sotish" tugmasini bosing.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">📦 Sklad / Prixod nazorati</p>
                <p>Dilerga buyurtma (Zakaz) bering. Prixod bo'limidan kelgan mahsulotlarni qabul qiling, bu mahsulotlar avtomatik ravishda ombor qoldig'iga qo'shiladi.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">👥 Agentlar va CRM</p>
                <p>Mijozlarni ro'yxatga oling. Agentlar orqali buyurtmalarni tarqating va ularning statistikasini alohida kuzating.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-[10px] text-gray-400 text-center">
            POS System AI • v1.0.0
          </div>
        </div>
      </Drawer>
    </div>
  );
}
