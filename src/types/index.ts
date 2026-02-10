export interface PostOffice {
  id: string;
  code: string;
  name: string;
  city: string; // Tỉnh/Thành phố
  district: string; // Quận/Huyện
  address: string;
  phone: string;
  status: 'active' | 'maintenance';
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type RouteType = 'delivery' | 'pickup' | 'all';

export interface Route {
  id: string;
  name: string;
  type: RouteType;
  color: string;
  postOfficeId: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  polygon: Array<{ lat: number; lng: number }>;
  area: number; // in m²
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  postOfficeId: string;
  assignedRouteIds: string[];
}

export interface Settings {
  overlapThreshold: {
    value: number;
    unit: 'percent' | 'm2';
  };
  routeColors: {
    delivery: string;
    pickup: string;
    all: string;
  };
}

export interface Order {
  id: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  assignedRouteId?: string;
  assignedPostOfficeId?: string;
  assignedEmployeeId?: string;
}

export type DrawingTool = 'select' | 'draw' | 'edit' | 'move' | 'delete' | null;

export interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
}
