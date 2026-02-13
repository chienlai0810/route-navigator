import axiosInstance from "@/lib/axios";

// Types cho Routes
export interface Route {
  id: string;
  name: string;
  description?: string;
  startPoint: {
    lat: number;
    lng: number;
  };
  endPoint: {
    lat: number;
    lng: number;
  };
  waypoints?: Array<{
    lat: number;
    lng: number;
  }>;
  distance?: number;
  duration?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// API service cho Routes
export const routesApi = {
  // Lấy danh sách tuyến đường
  getAll: async () => {
    const response = await axiosInstance.get<Route[]>('/routes');
    return response.data;
  },

  // Lấy thông tin một tuyến đường
  getById: async (id: string) => {
    const response = await axiosInstance.get<Route>(`/routes/${id}`);
    return response.data;
  },

  // Tạo tuyến đường mới
  create: async (data: Omit<Route, 'id'>) => {
    const response = await axiosInstance.post<Route>('/routes', data);
    return response.data;
  },

  // Cập nhật thông tin tuyến đường
  update: async (id: string, data: Partial<Route>) => {
    const response = await axiosInstance.put<Route>(`/routes/${id}`, data);
    return response.data;
  },

  // Xóa tuyến đường
  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/routes/${id}`);
    return response.data;
  },
};
