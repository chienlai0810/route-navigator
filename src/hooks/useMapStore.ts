import { create } from 'zustand';
import { Route, PostOffice, DrawingTool, Settings, RouteType } from '@/types';
import L from 'leaflet';

interface MapState {
  // Data
  routes: Route[];
  postOffices: PostOffice[];
  selectedRouteId: string | null;
  selectedPostOfficeId: string | null;
  editingRouteId: string | null;
  editMode: 'vertices' | 'drag' | null;
  
  // Original polygons for reset functionality
  originalPolygons: Map<string, Array<{ lat: number; lng: number }>>;
  
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
  
  // Highlighted routes for check point feature
  highlightedRouteIds: string[];
  checkPointLocation: { lat: number; lng: number } | null;
  
  // Settings
  settings: Settings;
  
  // Map instance
  mapInstance: L.Map | null;
  
  // Actions
  setActiveTool: (tool: DrawingTool) => void;
  setSelectedRoute: (id: string | null, zoomTo?: boolean) => void;
  setSelectedPostOffice: (id: string | null) => void;
  setEditingRouteId: (id: string | null) => void;
  setEditMode: (mode: 'vertices' | 'drag' | null) => void;
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
  syncRouteColorsWithSettings: () => void;
  setMapInstance: (map: L.Map | null) => void;
  zoomToRoute: (routeId: string) => void;
  resetAllPolygons: () => void;
  saveOriginalPolygon: (routeId: string, polygon: Array<{ lat: number; lng: number }>) => void;
  revertPolygon: (routeId: string) => void;
  setHighlightedRouteIds: (ids: string[]) => void;
  setCheckPointLocation: (location: { lat: number; lng: number } | null) => void;
}


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
  routes: [],
  postOffices: [],
  selectedRouteId: null,
  selectedPostOfficeId: null,
  editingRouteId: null,
  editMode: null,
  
  // Original polygons - initialize with current routes
  originalPolygons: new Map(mockRoutes.map(r => [r.id, [...r.polygon]])),
  
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
  
  // Highlighted routes
  highlightedRouteIds: [],
  checkPointLocation: null,
  
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
  
  setEditingRouteId: (id) => set({ editingRouteId: id }),
  
  setEditMode: (mode) => set({ editMode: mode }),
  
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
  
  syncRouteColorsWithSettings: () =>
    set((state) => ({
      routes: state.routes.map((route) => ({
        ...route,
        color: state.settings.routeColors[route.type],
      })),
    })),
  
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
  
  resetAllPolygons: () => {
    const state = get();
    set({
      routes: state.routes.map((route) => {
        const originalPolygon = state.originalPolygons.get(route.id);
        if (originalPolygon) {
          // Calculate area in m²
          const calculateArea = (latlngs: Array<{ lat: number; lng: number }>) => {
            if (latlngs.length < 3) return 0;
            const R = 6371000;
            let area = 0;
            for (let i = 0; i < latlngs.length; i++) {
              const j = (i + 1) % latlngs.length;
              const lat1 = (latlngs[i].lat * Math.PI) / 180;
              const lat2 = (latlngs[j].lat * Math.PI) / 180;
              const lng1 = (latlngs[i].lng * Math.PI) / 180;
              const lng2 = (latlngs[j].lng * Math.PI) / 180;
              area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
            }
            return Math.abs((area * R * R) / 2);
          };
          
          const areaM2 = calculateArea(originalPolygon);
          return { 
            ...route, 
            polygon: [...originalPolygon],
            area: areaM2,
            updatedAt: new Date() 
          };
        }
        return route;
      }),
    });
  },
  
  saveOriginalPolygon: (routeId, polygon) => {
    set((state) => {
      const newOriginalPolygons = new Map(state.originalPolygons);
      if (!newOriginalPolygons.has(routeId)) {
        newOriginalPolygons.set(routeId, [...polygon]);
      }
      return { originalPolygons: newOriginalPolygons };
    });
  },
  
  revertPolygon: (routeId) => {
    set((state) => {
      const originalPolygon = state.originalPolygons.get(routeId);
      if (originalPolygon) {
        return {
          routes: state.routes.map((route) =>
            route.id === routeId 
              ? { ...route, polygon: [...originalPolygon] }
              : route
          ),
        };
      }
      return state;
    });
  },
  
  setHighlightedRouteIds: (ids) => set({ highlightedRouteIds: ids }),
  
  setCheckPointLocation: (location) => set({ checkPointLocation: location }),
}));
