import { RouteType, ProductType } from '@/types';

// Route Type Labels
export const routeTypeLabels: Record<RouteType, string> = {
  delivery: 'Giao hàng',
  pickup: 'Nhận hàng',
  all: 'Tất cả',
};

// Route Type Colors (CSS classes)
export const routeTypeColors: Record<RouteType, string> = {
  delivery: 'route-badge-delivery',
  pickup: 'route-badge-pickup',
  all: 'route-badge-all',
};

// Route Type Options (for select dropdowns)
export const routeTypeOptions: { value: RouteType; label: string }[] = [
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'pickup', label: 'Nhận hàng' },
  { value: 'all', label: 'Tất cả' },
];

// Product Type Options (for select dropdowns)
export const productTypeOptions: { value: ProductType; label: string }[] = [
  { value: 'HH', label: 'HH' },
  { value: 'KH', label: 'KH' },
  { value: 'TH', label: 'TH' },
];
