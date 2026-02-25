import axiosInstance from "@/lib/axios";
import { ApiResponse, ProductType } from "@/types";

// Types cho API Routes
export type RouteType = 'DELIVERY' | 'PICKUP' | 'ALL';

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteArea {
  type: 'Polygon';
  coordinates: RouteCoordinate[];
}

export interface RouteResponse {
  id: string;
  code: string;
  name: string;
  type: RouteType;
  productType: string; // Format: "HH;TH" or single value "HH"
  postOfficeId: string | null;
  postOfficeName: string | null;
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
  area: RouteArea;
}

export interface UpdateRoutePayload {
  code?: string;
  name?: string;
  type?: RouteType;
  productType?: string; // Format: "HH;TH" or single value "HH"
  staffMain?: string;
  area?: RouteArea;
}

// API service cho Routes
export const routesApi = {
  // Lấy danh sách tuyến đường
  getAll: async (): Promise<RouteResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<RouteResponse[]>>('/routes');
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
};
