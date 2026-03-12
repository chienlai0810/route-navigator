import axiosInstance from "@/lib/axios";
import { ApiResponse, ProductType } from "@/types";

// Types cho API Routes
export type RouteType = 'DELIVERY' | 'PICKUP' | 'ALL';

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface GeoJsonPoint {
  x: number; // longitude
  y: number; // latitude
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface RouteAreaLineString {
  type: "LineString";
  coordinates: GeoJsonPoint[];
}

// GeoJSON Polygon format for API requests (create/update)
export interface RouteAreaPayload {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of rings, each ring is array of [lng, lat]
}

// API Response format (includes additional fields)
export interface RouteArea {
  type: 'Polygon';
  points: GeoJsonPoint[];
  coordinates: RouteAreaLineString[];
}

export interface RouteResponse {
  id: string;
  code: string;
  name: string;
  type: RouteType;
  productType: string; // Format: "HH;TH" or single value "HH"
  postOfficeId: string | null;
  postOfficeName: string | null;
  operatingAreaId: string | null;
  staffMain: string;
  staffSub: string | null;
  area: RouteArea;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutePayload {
  code: string;
  name: string;
  type: RouteType;
  productType: string; // Format: "HH;TH" or single value "HH"
  staffMain: string;
  area: RouteAreaPayload;
  postOfficeId: string;
  operatingAreaId?: string;
}

export interface UpdateRoutePayload {
  code?: string;
  name?: string;
  type?: RouteType;
  productType?: string; // Format: "HH;TH" or single value "HH"
  postOfficeId?: string;
  staffMain?: string;
  area?: RouteAreaPayload;
  operatingAreaId?: string;
}

// Check Point in Polygon Types
export interface CheckPointPayload {
  latitude: number;
  longitude: number;
  productType?: string; // Optional: 'HH', 'KH', 'TH'
}

export interface MatchingRoute {
  id: string;
  code: string;
  name: string;
  type: RouteType;
  color: string | null;
}

export interface CheckPointResponse {
  found: boolean;
  latitude: number;
  longitude: number;
  matchingRoutes: MatchingRoute[];
  postOffice: any | null; // Can be typed more specifically if needed
}

// Query params for filtering routes
export interface RouteQueryParams {
  postOfficeId?: string | null;
  type?: RouteType | null;
  productType?: string | null; // Format: "HH", "TH", or "HH;TH"
  operatingAreaId?: string | null;
}

// API service cho Routes
export const routesApi = {
  // Lấy danh sách tuyến đường
  getAll: async (params?: RouteQueryParams): Promise<RouteResponse[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.postOfficeId) {
      queryParams.append('postOfficeId', params.postOfficeId);
    }
    
    if (params?.type) {
      queryParams.append('type', params.type);
    }

    if (params?.productType) {
      queryParams.append('productType', params.productType);
    }
    
    if (params?.operatingAreaId) {
      queryParams.append('operatingAreaId', params.operatingAreaId);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/routes?${queryString}` : '/routes';
    
    const response = await axiosInstance.get<ApiResponse<RouteResponse[]>>(url);
    return response.data.data;
  },

  // Lấy thông tin một tuyến đường
  getById: async (id: string): Promise<RouteResponse> => {
    const response = await axiosInstance.get<ApiResponse<RouteResponse>>(`/routes/${id}`);
    return response.data.data;
  },

  // Tạo tuyến đường mới
  create: async (data: CreateRoutePayload): Promise<RouteResponse> => {
    const response = await axiosInstance.post<ApiResponse<RouteResponse>>('/routes', data);
    return response.data.data;
  },

  // Cập nhật thông tin tuyến đường
  update: async (id: string, data: UpdateRoutePayload): Promise<RouteResponse> => {
    const response = await axiosInstance.put<ApiResponse<RouteResponse>>(`/routes/${id}`, data);
    return response.data.data;
  },

  // Xóa tuyến đường
  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/routes/${id}`);
    return response.data;
  },

  // Kiểm tra điểm có nằm trong tuyến đường nào không
  checkPointInPolygon: async (data: CheckPointPayload): Promise<CheckPointResponse> => {
    const response = await axiosInstance.post<ApiResponse<CheckPointResponse>>('/gis/check-point', data);
    return response.data.data;
  },
};
