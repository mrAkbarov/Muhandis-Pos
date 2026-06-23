import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Search, ExpandMore, ExpandLess, ChevronRight } from '@mui/icons-material';
import {
  Button, Chip, Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider, IconButton,
} from '@mui/material';
import { formatCurrency } from '../utils/format';

const fmt = (n) => formatCurrency(n);
const fmtNum = (n) => Number(n).toLocaleString('uz-UZ');
const TOUCH_ROW = { minHeight: 64, py: 1.5, cursor: 'pointer' };
const TOUCH_BTN = { minHeight: 52, fontSize: 16, fontWeight: 700, borderRadius: 2, textTransform: 'none', px: 3 };

function formatTxnDate(t) {
  if (t.saleDetail?.date) {
    const d = new Date(t.saleDetail.date);
    const date = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${date} ${(t.saleDetail.time || '').slice(0, 5)}`.trim();
  }
  if (t.createdAt) {
    const d = new Date(t.createdAt);
    return d.toLocaleString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }
  return '—';
}

function PurchaseHistory({ transactions }) {
  const charges = (transactions || []).filter((t) => t.kind === 'charge');
  if (!charges.length) {
    return <p className="text-sm text-gray-400 py-2">Nasiya xaridlari yo&apos;q</p>;
  }

  return (
    <div className="space-y-3 pt-1">
      {charges.map((t) => (
        <div key={t.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className="text-sm font-bold text-gray-700">{formatTxnDate(t)}</span>
            <span className="text-sm font-bold text-amber-800">{fmt(t.amount)}</span>
          </div>
          {t.saleDetail?.items?.length ? (
            <ul className="space-y-1">
              {t.saleDetail.items.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex justify-between gap-2">
                  <span>{item.name} × {item.qty}</span>
                  <span className="text-gray-500 shrink-0">{fmtNum(item.price * item.qty)} so&apos;m</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Mahsulot ro&apos;yxati saqlanmagan</p>
          )}
          {(t.saleDetail?.cashierName || t.cashierName) && (
            <p className="text-xs text-gray-400 mt-2">
              Kassir: {t.saleDetail?.cashierName || t.cashierName}
              {t.saleDetail?.externalId ? ` · Chek ${t.saleDetail.externalId}` : ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, subtitle, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors text-left min-h-[56px]"
      >
        <div>
          <p className="text-base font-bold text-gray-800">{title}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <IconButton tabIndex={-1} sx={{ color: '#6b7280' }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </button>
      <Collapse in={open}>
        <div className="px-4 pb-4 border-t border-gray-100">{children}</div>
      </Collapse>
    </div>
  );
}

export default function CreditLedger() {
  const { creditAccounts, currentBusinessId, recordCreditPayment, saving } = useApp();
  const { permissions } = useAuth();
  const canPay = permissions.canRecordCreditPayment;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [error, setError] = useState('');
  const [proofOpen, setProofOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const accounts = useMemo(
    () => creditAccounts.filter(
      (a) => String(a.businessId) === String(currentBusinessId) && Number(a.balance) > 0,
    ),
    [creditAccounts, currentBusinessId],
  );

  const filtered = accounts.filter((a) =>
    a.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  const totalDebt = filtered.reduce((s, a) => s + a.balance, 0);

  const chargeCount = (selected?.transactions || []).filter((t) => t.kind === 'charge').length;
  const paymentCount = (selected?.transactions || []).filter((t) => t.kind === 'payment').length;

  const openPay = (account) => {
    setSelected(account);
    setPayAmount('');
    setError('');
    setProofOpen(false);
    setPaymentsOpen(false);
  };

  const handlePay = async () => {
    if (!selected) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setError('To\'lov summasini kiriting');
      return;
    }
    if (amount > selected.balance) {
      setError(`Qarz ${fmt(selected.balance)} — undan ko'p to'lab bo'lmaydi`);
      return;
    }
    const result = await recordCreditPayment(selected.id, amount, '');
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Qarz daftarchasi</h1>
          <p className="text-sm text-gray-500">Nasiya mijozlari va to&apos;lovlar</p>
        </div>
        <Chip
          label={`Jami qarz: ${fmt(totalDebt)}`}
          sx={{ fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', fontSize: 14, py: 2.5, height: 36 }}
        />
      </div>

      <TextField
        placeholder="Mijoz qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{
          maxWidth: 480,
          '& .MuiOutlinedInput-root': { borderRadius: 2, minHeight: 52, fontSize: 16 },
        }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9ca3af' }} /></InputAdornment>,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 14, py: 1.5 } }}>
                <TableCell>Mijoz</TableCell>
                <TableCell align="right">Qarz summasi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 8, color: '#9ca3af', fontSize: 15 }}>
                    Qarzdor mijozlar yo&apos;q
                  </TableCell>
                </TableRow>
              ) : filtered.map((a, i) => (
                <TableRow
                  key={a.id}
                  hover
                  onClick={() => openPay(a)}
                  sx={{
                    ...TOUCH_ROW,
                    bgcolor: i % 2 === 1 ? '#fffbeb' : 'white',
                    '&:hover': { bgcolor: '#fef3c7 !important' },
                    '&:active': { bgcolor: '#fde68a !important' },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, fontSize: 17 }}>
                    <div className="flex items-center gap-2">
                      {a.customerName}
                      <ChevronRight sx={{ color: '#9ca3af', fontSize: 22 }} />
                    </div>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#b45309', fontSize: 17 }}>
                    {fmt(a.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="px-4 py-3 border-t text-sm text-gray-500">
          Jami {filtered.length} ta mijoz · qatorni bosing
        </div>
      </div>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 22, pb: 1, pt: 2.5 }}>
          {selected?.customerName}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0, px: 3 }}>
          <p className="text-base bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
            Joriy qarz: <b className="text-lg">{selected ? fmt(selected.balance) : ''}</b>
          </p>

          {chargeCount > 0 && (
            <CollapsibleSection
              title="Nima olgan — ispot"
              subtitle="Mijoz inkor qilsa oching va ko'rsating"
              open={proofOpen}
              onToggle={() => setProofOpen((v) => !v)}
            >
              <PurchaseHistory transactions={selected?.transactions} />
            </CollapsibleSection>
          )}

          {paymentCount > 0 && (
            <CollapsibleSection
              title="Oldingi to'lovlar"
              subtitle={`${paymentCount} ta to'lov`}
              open={paymentsOpen}
              onToggle={() => setPaymentsOpen((v) => !v)}
            >
              <div className="space-y-2 text-sm pt-1">
                {selected.transactions.filter((t) => t.kind === 'payment').map((t) => (
                  <div key={t.id} className="flex justify-between border-b border-gray-50 py-2">
                    <span>{formatTxnDate(t)}</span>
                    <span className="text-green-600 font-bold">−{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          <Divider />

          {error && <p className="text-red-600 text-base">{error}</p>}
          {canPay ? (
            <>
              <TextField
                label="To'lov summasi (so'm)"
                type="number"
                fullWidth
                autoFocus
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Masalan: 5000"
                sx={{
                  '& .MuiOutlinedInput-root': { minHeight: 56, fontSize: 18, borderRadius: 2 },
                  '& .MuiInputLabel-root': { fontSize: 15 },
                }}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              Ko&apos;ruvchi rejim — to&apos;lov qabul qilish mumkin emas.
            </p>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setSelected(null)} sx={TOUCH_BTN} fullWidth variant="outlined">
            Yopish
          </Button>
          {canPay && (
          <Button
            variant="contained"
            onClick={handlePay}
            disabled={saving || !payAmount}
            fullWidth
            sx={{ ...TOUCH_BTN, bgcolor: '#4361ee', '&:hover': { bgcolor: '#3451d1' } }}
          >
            To&apos;lovni saqlash
          </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
