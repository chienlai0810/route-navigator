import { create } from 'zustand';
import { Route, PostOffice, DrawingTool, Settings, RouteType } from '@/types';
import L from 'leaflet';

interface MapState {
  // Data
  routes: Route[];
  postOffices: PostOffice[];
  selectedRouteId: string | null;
  selectedPostOfficeId: string | null;
  
  // Drawing
  activeTool: DrawingTool;
  isDrawing: boolean;
  currentPolygon: Array<{ lat: number; lng: number }>;
  
  // UI State
  showRoutePanel: boolean;
  filterPostOfficeId: string | null;
  filterRouteType: RouteType | null;
  filterEmployeeId: string | null;
  filterCity: string | null;
  filterDistrict: string | null;
  
  // Settings
  settings: Settings;
  
  // Map instance
  mapInstance: L.Map | null;
  
  // Actions
  setActiveTool: (tool: DrawingTool) => void;
  setSelectedRoute: (id: string | null, zoomTo?: boolean) => void;
  setSelectedPostOffice: (id: string | null) => void;
  toggleRouteVisibility: (id: string) => void;
  addRoute: (route: Route) => void;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  deleteRoute: (id: string) => void;
  addPostOffice: (postOffice: PostOffice) => void;
  updatePostOffice: (id: string, updates: Partial<PostOffice>) => void;
  setShowRoutePanel: (show: boolean) => void;
  setFilterPostOfficeId: (id: string | null) => void;
  setFilterRouteType: (type: RouteType | null) => void;
  setFilterCity: (city: string | null) => void;
  setFilterDistrict: (district: string | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  addPolygonPoint: (point: { lat: number; lng: number }) => void;
  clearCurrentPolygon: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setMapInstance: (map: L.Map | null) => void;
  zoomToRoute: (routeId: string) => void;
}

// Mock data
const mockPostOffices: PostOffice[] = [
  {
    id: 'po-1',
    code: 'BC-HN01',
    name: 'Bưu cục Hoàn Kiếm',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    address: '15 Đinh Tiên Hoàng',
    phone: '024 3825 1234',
    status: 'active',
    coordinates: { lat: 21.0285, lng: 105.8542 },
  },
  {
    id: 'po-2',
    code: 'BC-HN02',
    name: 'Bưu cục Ba Đình',
    city: 'Hà Nội',
    district: 'Ba Đình',
    address: '25 Liễu Giai',
    phone: '024 3762 5678',
    status: 'active',
    coordinates: { lat: 21.0340, lng: 105.8180 },
  },
  {
    id: 'po-3',
    code: 'BC-HN03',
    name: 'Bưu cục Cầu Giấy',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '88 Xuân Thủy',
    phone: '024 3793 9012',
    status: 'maintenance',
    coordinates: { lat: 21.0380, lng: 105.7820 },
  },
  {
    id: 'po-4',
    code: 'BC-HN04',
    name: 'Bưu cục Đống Đa',
    city: 'Hà Nội',
    district: 'Đống Đa',
    address: '123 Xã Đàn',
    phone: '024 3852 7890',
    status: 'active',
    coordinates: { lat: 21.0150, lng: 105.8280 },
  },
  {
    id: 'po-5',
    code: 'BC-HCM01',
    name: 'Bưu cục Quận 1',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    address: '125 Nguyễn Huệ',
    phone: '028 3823 4567',
    status: 'active',
    coordinates: { lat: 10.7756, lng: 106.7019 },
  },
  {
    id: 'po-6',
    code: 'BC-HCM02',
    name: 'Bưu cục Quận 3',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    address: '45 Võ Văn Tần',
    phone: '028 3930 5678',
    status: 'active',
    coordinates: { lat: 10.7824, lng: 106.6926 },
  },
  {
    id: 'po-7',
    code: 'BC-DN01',
    name: 'Bưu cục Hải Châu',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    address: '56 Lê Duẩn',
    phone: '0236 3821 234',
    status: 'active',
    coordinates: { lat: 16.0544, lng: 108.2022 },
  },
  {
    id: 'po-8',
    code: 'BC-DN02',
    name: 'Bưu cục Thanh Khê',
    city: 'Đà Nẵng',
    district: 'Thanh Khê',
    address: '78 Nguyễn Văn Linh',
    phone: '0236 3654 789',
    status: 'maintenance',
    coordinates: { lat: 16.0678, lng: 108.2070 },
  },
];

const mockRoutes: Route[] = [
  {
    id: 'route-1',
    name: 'Tuyến Hoàn Kiếm A1',
    type: 'delivery',
    color: 'hsl(142, 76%, 36%)',
    postOfficeId: 'po-1',
    assignedEmployeeId: 'emp-1',
    assignedEmployeeName: 'Nguyễn Văn A',
    polygon: [
      { lat: 21.0300, lng: 105.8520 },
      { lat: 21.0320, lng: 105.8580 },
      { lat: 21.0280, lng: 105.8600 },
      { lat: 21.0260, lng: 105.8550 },
    ],
    area: 125000,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'route-2',
    name: 'Tuyến Hoàn Kiếm A2',
    type: 'pickup',
    color: 'hsl(25, 95%, 53%)',
    postOfficeId: 'po-1',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Trần Văn B',
    polygon: [
      { lat: 21.0260, lng: 105.8550 },
      { lat: 21.0280, lng: 105.8600 },
      { lat: 21.0240, lng: 105.8620 },
      { lat: 21.0220, lng: 105.8570 },
    ],
    area: 98000,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'route-3',
    name: 'Tuyến Ba Đình B1',
    type: 'all',
    color: 'hsl(187, 85%, 43%)',
    postOfficeId: 'po-2',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'Lê Thị C',
    polygon: [
      { lat: 21.0360, lng: 105.8160 },
      { lat: 21.0380, lng: 105.8220 },
      { lat: 21.0340, lng: 105.8240 },
      { lat: 21.0320, lng: 105.8180 },
    ],
    area: 145000,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useMapStore = create<MapState>((set, get) => ({
  // Initial Data
  routes: mockRoutes,
  postOffices: mockPostOffices,
  selectedRouteId: null,
  selectedPostOfficeId: null,
  
  // Drawing State
  activeTool: null,
  isDrawing: false,
  currentPolygon: [],
  
  // UI State
  showRoutePanel: true,
  filterPostOfficeId: null,
  filterRouteType: null,
  filterEmployeeId: null,
  filterCity: null,
  filterDistrict: null,
  
  // Settings
  settings: {
    overlapThreshold: { value: 5, unit: 'percent' },
    routeColors: {
      delivery: 'hsl(142, 76%, 36%)',
      pickup: 'hsl(25, 95%, 53%)',
      all: 'hsl(187, 85%, 43%)',
    },
  },
  
  // Map instance
  mapInstance: null,
  
  // Actions
  setActiveTool: (tool) => set({ activeTool: tool, isDrawing: tool === 'draw' }),
  
  setSelectedRoute: (id, zoomTo = false) => {
    set({ selectedRouteId: id });
    if (zoomTo && id) {
      get().zoomToRoute(id);
    }
  },
  
  setSelectedPostOffice: (id) => set({ selectedPostOfficeId: id }),
  
  toggleRouteVisibility: (id) =>
    set((state) => ({
      routes: state.routes.map((route) =>
        route.id === id ? { ...route, isVisible: !route.isVisible } : route
      ),
    })),
  
  addRoute: (route) =>
    set((state) => ({ routes: [...state.routes, route] })),
  
  updateRoute: (id, updates) =>
    set((state) => ({
      routes: state.routes.map((route) =>
        route.id === id ? { ...route, ...updates, updatedAt: new Date() } : route
      ),
    })),
  
  deleteRoute: (id) =>
    set((state) => ({
      routes: state.routes.filter((route) => route.id !== id),
      selectedRouteId: state.selectedRouteId === id ? null : state.selectedRouteId,
    })),
  
  addPostOffice: (postOffice) =>
    set((state) => ({ postOffices: [...state.postOffices, postOffice] })),
  
  updatePostOffice: (id, updates) =>
    set((state) => ({
      postOffices: state.postOffices.map((po) =>
        po.id === id ? { ...po, ...updates } : po
      ),
    })),
  
  setShowRoutePanel: (show) => set({ showRoutePanel: show }),
  
  setFilterPostOfficeId: (id) => set({ filterPostOfficeId: id }),
  
  setFilterRouteType: (type) => set({ filterRouteType: type }),
  
  setFilterCity: (city) => set({ filterCity: city, filterDistrict: null }),
  
  setFilterDistrict: (district) => set({ filterDistrict: district }),
  
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  
  addPolygonPoint: (point) =>
    set((state) => ({ currentPolygon: [...state.currentPolygon, point] })),
  
  clearCurrentPolygon: () => set({ currentPolygon: [] }),
  
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  
  setMapInstance: (map) => set({ mapInstance: map }),
  
  zoomToRoute: (routeId) => {
    const state = get();
    const route = state.routes.find(r => r.id === routeId);
    const map = state.mapInstance;
    
    if (!route || !map || route.polygon.length === 0) return;
    
    // Create bounds from polygon points
    const bounds = L.latLngBounds(
      route.polygon.map(p => [p.lat, p.lng] as [number, number])
    );
    
    // Fit bounds with some padding
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16,
      animate: true,
      duration: 0.5,
    });
  },
}));
