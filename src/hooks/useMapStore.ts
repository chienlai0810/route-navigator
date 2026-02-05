import { create } from 'zustand';
import { Route, PostOffice, DrawingTool, Settings, RouteType } from '@/types';

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
  
  // Settings
  settings: Settings;
  
  // Actions
  setActiveTool: (tool: DrawingTool) => void;
  setSelectedRoute: (id: string | null) => void;
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
  setIsDrawing: (isDrawing: boolean) => void;
  addPolygonPoint: (point: { lat: number; lng: number }) => void;
  clearCurrentPolygon: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

// Mock data
const mockPostOffices: PostOffice[] = [
  {
    id: 'po-1',
    code: 'BC-HN01',
    name: 'Bưu cục Hoàn Kiếm',
    address: '15 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội',
    phone: '024 3825 1234',
    status: 'active',
    coordinates: { lat: 21.0285, lng: 105.8542 },
  },
  {
    id: 'po-2',
    code: 'BC-HN02',
    name: 'Bưu cục Ba Đình',
    address: '25 Liễu Giai, Ba Đình, Hà Nội',
    phone: '024 3762 5678',
    status: 'active',
    coordinates: { lat: 21.0340, lng: 105.8180 },
  },
  {
    id: 'po-3',
    code: 'BC-HN03',
    name: 'Bưu cục Cầu Giấy',
    address: '88 Xuân Thủy, Cầu Giấy, Hà Nội',
    phone: '024 3793 9012',
    status: 'maintenance',
    coordinates: { lat: 21.0380, lng: 105.7820 },
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

export const useMapStore = create<MapState>((set) => ({
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
  
  // Settings
  settings: {
    overlapThreshold: { value: 5, unit: 'percent' },
    routeColors: {
      delivery: 'hsl(142, 76%, 36%)',
      pickup: 'hsl(25, 95%, 53%)',
      all: 'hsl(187, 85%, 43%)',
    },
  },
  
  // Actions
  setActiveTool: (tool) => set({ activeTool: tool, isDrawing: tool === 'draw' }),
  
  setSelectedRoute: (id) => set({ selectedRouteId: id }),
  
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
  
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  
  addPolygonPoint: (point) =>
    set((state) => ({ currentPolygon: [...state.currentPolygon, point] })),
  
  clearCurrentPolygon: () => set({ currentPolygon: [] }),
  
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
