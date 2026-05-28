export const productConfig = {
  1: {
    types: [
      { value: 'shakarli', label: 'Shakarli' },
      { value: 'shakarsiz', label: 'Shakarsiz' },
    ],
    sizes: ['0.5L', '1.0L', '1.5L', '2.0L'],
  },
  2: {
    types: [
      { value: 'shakarli', label: 'Shakarli' },
      { value: 'shakarsiz', label: 'Shakarsiz' },
    ],
    sizes: ['0.5L', '1.0L', '1.5L', '2.0L'],
  },
  3: {
    types: [
      { value: 'tuzli', label: 'Tuzli' },
      { value: 'tuzsiz', label: 'Tuzsiz' },
    ],
    sizes: ['300g', '500g'],
  },
  4: {
    types: [
      { value: 'tuzli', label: 'Tuzli' },
      { value: 'tuzsiz', label: 'Tuzsiz' },
    ],
    sizes: ['26g', '50g', '90g', '140g'],
  },
  5: {
    types: [{ value: 'standart', label: 'Standart' }],
    sizes: ['50g', '80g'],
  },
  6: {
    types: [{ value: 'standart', label: 'Standart' }],
    sizes: ['200g', '400g'],
  },
  7: {
    types: [{ value: 'standart', label: 'Standart' }],
    sizes: ['500g', '1000g'],
  },
};

export const defaultProductConfig = {
  types: [{ value: 'standart', label: 'Standart' }],
  sizes: ['1 ta', '5 ta', '10 ta'],
};

export const typeLabels = {
  tuzli: 'Tuzli',
  tuzsiz: 'Tuzsiz',
  shakarli: 'Shakarli',
  shakarsiz: 'Shakarsiz',
  standart: 'Standart',
};

export function getProductConfig(productId) {
  return productConfig[productId] ?? defaultProductConfig;
}
