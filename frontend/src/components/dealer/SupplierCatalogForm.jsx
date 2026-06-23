import { useState } from 'react';
import {
  Button, Chip, TextField, Select, MenuItem,
} from '@mui/material';
import {
  MEASURE_UNITS, getCatalogMeasureField,
  buildCatalogSizeWithPieces, buildVolumeCatalogSize, catalogChipLabel,
} from '../../config/dealerProducts';

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff', minHeight: 48 },
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SupplierCatalogForm({
  items = [],
  onItemsChange,
  singleMode = false,
  onAddSingle,
  onError,
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('dona');
  const [sizeValue, setSizeValue] = useState('');
  const [volumeLitr, setVolumeLitr] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [cost, setCost] = useState('');
  const [barcode, setBarcode] = useState('');

  const measureField = getCatalogMeasureField(unit);

  const resetMeasureFields = () => {
    setSizeValue('');
    setVolumeLitr('');
    setVolumeMl('');
  };

  const resetForm = () => {
    setName('');
    resetMeasureFields();
    setCost('');
    setBarcode('');
  };

  const buildSize = () => {
    if (measureField?.kind === 'volume') {
      return buildVolumeCatalogSize({ litr: volumeLitr, ml: volumeMl, pieces: '' });
    }
    if (measureField) {
      return buildCatalogSizeWithPieces(unit, { sizeValue, litr: volumeLitr, ml: volumeMl });
    }
    return '';
  };

  const handleAdd = () => {
    if (!name.trim()) {
      onError?.('Mahsulot nomini kiriting');
      return;
    }
    const barcodeTrimmed = barcode.trim();
    if (!barcodeTrimmed) {
      onError?.('Shtrix-kodni skanerlang yoki kiriting');
      return;
    }
    const costNum = parseFloat(cost);
    if (!costNum || costNum <= 0) {
      onError?.('Kirim narxini kiriting');
      return;
    }

    if (measureField?.kind === 'volume') {
      if (!volumeLitr.trim() && !volumeMl.trim()) {
        onError?.('Hajmni litr yoki ml da kiriting (masalan: 1.25 L yoki 500 ml)');
        return;
      }
    } else if (measureField && !sizeValue.trim()) {
      onError?.(`${measureField.label} ni tanlang yoki kiriting`);
      return;
    }

    onError?.('');

    const item = {
      name: name.trim(),
      unit,
      size: buildSize(),
      defaultCost: costNum,
      barcode: barcodeTrimmed,
    };

    if (singleMode) {
      onAddSingle?.(item);
      resetForm();
      return;
    }

    onItemsChange?.([...items, item]);
    resetForm();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        Mahsulot ma&apos;lumotlari
      </p>

      <Field label="Mahsulot nomi" hint="Masalan: Lay's Chips, Cola">
        <TextField
          fullWidth
          placeholder="Nomini kiriting"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={inputSx}
        />
      </Field>

      <Field label="O'lchov birligi">
        <Select
          fullWidth
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value);
            resetMeasureFields();
          }}
          sx={inputSx}
        >
          {MEASURE_UNITS.map((u) => (
            <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
          ))}
        </Select>
      </Field>

      {measureField?.kind === 'volume' && (
        <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-sm font-bold text-blue-900">Bitta shisha hajmi</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nechi litrlik" hint="Masalan: 1 yoki 1.25">
              <TextField
                fullWidth
                type="number"
                inputProps={{ step: '0.1', min: '0' }}
                placeholder="1.5"
                value={volumeLitr}
                onChange={(e) => setVolumeLitr(e.target.value)}
                InputProps={{ endAdornment: <span className="text-gray-400 pr-2">L</span> }}
                sx={inputSx}
              />
            </Field>
            <Field label="yoki millilitr" hint="Masalan: 500">
              <TextField
                fullWidth
                type="number"
                placeholder="500"
                value={volumeMl}
                onChange={(e) => setVolumeMl(e.target.value)}
                InputProps={{ endAdornment: <span className="text-gray-400 pr-2">ml</span> }}
                sx={inputSx}
              />
            </Field>
          </div>
          <p className="text-xs text-blue-700">Zakaz berishda necha dona olish alohida kiritiladi</p>
        </div>
      )}

      {measureField?.kind === 'preset' && (
        <Field label={measureField.label} hint={measureField.helperText}>
          <TextField
            fullWidth
            placeholder="100 yoki ro'yxatdan tanlang"
            value={sizeValue}
            onChange={(e) => setSizeValue(e.target.value)}
            sx={inputSx}
          />
        </Field>
      )}

      {measureField?.kind === 'number' && (
        <Field label={measureField.label} hint={measureField.helperText}>
          <TextField
            fullWidth
            type="number"
            placeholder={measureField.placeholder}
            value={sizeValue}
            onChange={(e) => setSizeValue(e.target.value)}
            InputProps={{
              endAdornment: measureField.suffix ? (
                <span className="text-gray-400 pr-2">{measureField.suffix}</span>
              ) : null,
            }}
            sx={inputSx}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="1 dona kirim narxi (so'm)" hint="Har bir dona/shisha narxi">
          <TextField
            fullWidth
            type="number"
            placeholder="5000"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            sx={inputSx}
          />
        </Field>
        <Field label="Shtrix-kod" hint="Skanerlang yoki qo'lda kiriting">
          <TextField
            fullWidth
            placeholder="Skaner..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            sx={inputSx}
          />
        </Field>
      </div>

      <Button
        variant="contained"
        onClick={handleAdd}
        sx={{ textTransform: 'none', bgcolor: '#4361ee', borderRadius: 2, py: 1.25, fontWeight: 700, '&:hover': { bgcolor: '#3451d1' } }}
      >
        {singleMode ? 'Mahsulotni saqlash' : 'Ro\'yxatga qo\'shish'}
      </Button>

      {!singleMode && items.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item, i) => (
            <Chip
              key={`${item.name}-${i}`}
              label={catalogChipLabel(item)}
              size="small"
              onDelete={() => onItemsChange?.(items.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
