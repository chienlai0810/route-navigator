export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface GeoJsonPoint {
  x: number; // longitude
  y: number; // latitude
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export type PostOfficeStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface PostOffice {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  location: GeoJsonPoint;
  status: PostOfficeStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PostOfficePayload {
  code: string;
  name: string;
  address: string;
  phone: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: PostOfficeStatus;
}

export type RouteType = 'delivery' | 'pickup' | 'all';

export type ProductType = 'HH' | 'KH' | 'TH';

export interface Route {
  id: string;
  name: string;
  code?: string;
  type: RouteType;
  productType?: ProductType[];
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

export interface OperationalArea {
  id: string;
  name: string;
  postOfficeId: string;
  postOfficeName?: string;
  productType: ProductType[];
  color: string;
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

export interface SystemConfig {
  id: string;
  antiConflictThreshold: number;
  antiConflictUnit: string;
  routeColors: {
    ALL: string;
    PICKUP: string;
    DELIVERY: string;
  };
  lastUpdated: string;
  updatedBy: string;
}

export interface SystemConfigPayload {
  antiConflictThreshold: number;
  antiConflictUnit: string;
  routeColors: {
    ALL: string;
    PICKUP: string;
    DELIVERY: string;
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
