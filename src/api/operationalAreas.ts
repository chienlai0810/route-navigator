import axiosInstance from "@/lib/axios";
import { ApiResponse, ProductType } from "@/types";

// GeoJSON Polygon format for API requests (create/update)
export interface OperationalAreaPayload {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of rings, each ring is array of [lng, lat]
}

export interface GeoJsonPoint {
  x: number; // longitude
  y: number; // latitude
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface OperationalAreaGeometry {
  type: 'Polygon';
  points: GeoJsonPoint[];
}

export interface OperationalAreaResponse {
  id: string;
  name: string;
  postOfficeId: string;
  postOfficeName: string | null;
  productType: string; // Format: "HH;TH" or single value "HH"
  area: OperationalAreaGeometry;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationalAreaPayload {
  name: string;
  postOfficeId: string;
  productType: string; // Format: "HH;TH" or single value "HH"
  area: OperationalAreaPayload;
}

export interface UpdateOperationalAreaPayload {
  name?: string;
  postOfficeId?: string;
  productType?: string; // Format: "HH;TH" or single value "HH"
  area?: OperationalAreaPayload;
}

// Query params for filtering operational areas
export interface OperationalAreaQueryParams {
  postOfficeId?: string | null;
  productType?: string | null; // Format: "HH", "TH", or "HH;TH"
  operatingAreaId?: string | null;
}

// Operating area status response
export interface OperatingAreaStatusResponse {
  operatingAreaId: string;
  operatingAreaName: string;
  hasRoutes: boolean;
  routeCount: number;
  canDelete: boolean;
  canUpdate: boolean;
  message: string;
}

export const operationalAreasApi = {
  // Get all operational areas with optional filters
  getAll: async (params?: OperationalAreaQueryParams): Promise<OperationalAreaResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<OperationalAreaResponse[]>>(
      '/operating-areas',
      { params }
    );
    return response.data.data;
  },

  // Get a single operational area by ID
  getById: async (id: string): Promise<OperationalAreaResponse> => {
    const response = await axiosInstance.get<ApiResponse<OperationalAreaResponse>>(
      `/operating-areas/${id}`
    );
    return response.data.data;
  },

  // Create a new operational area
  create: async (payload: CreateOperationalAreaPayload): Promise<OperationalAreaResponse> => {
    const response = await axiosInstance.post<ApiResponse<OperationalAreaResponse>>(
      '/operating-areas',
      payload
    );
    return response.data.data;
  },

  // Update an existing operational area
  update: async (id: string, payload: UpdateOperationalAreaPayload): Promise<OperationalAreaResponse> => {
    const response = await axiosInstance.put<ApiResponse<OperationalAreaResponse>>(
      `/operating-areas/${id}`,
      payload
    );
    return response.data.data;
  },

  // Get operating area status (check if it can be deleted/updated)
  getStatus: async (id: string): Promise<OperatingAreaStatusResponse> => {
    const response = await axiosInstance.get<ApiResponse<OperatingAreaStatusResponse>>(
      `/operating-areas/${id}/status`
    );
    return response.data.data;
  },

  // Delete an operational area
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/operating-areas/${id}`);
  },
};
