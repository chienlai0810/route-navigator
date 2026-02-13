import axiosInstance from "@/lib/axios";

// Types cho Employees
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  status?: 'active' | 'inactive';
}

// API service cho Employees
export const employeesApi = {
  // Lấy danh sách nhân viên
  getAll: async () => {
    const response = await axiosInstance.get<Employee[]>('/employees');
    return response.data;
  },

  // Lấy thông tin một nhân viên
  getById: async (id: string) => {
    const response = await axiosInstance.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  // Tạo nhân viên mới
  create: async (data: Omit<Employee, 'id'>) => {
    const response = await axiosInstance.post<Employee>('/employees', data);
    return response.data;
  },

  // Cập nhật thông tin nhân viên
  update: async (id: string, data: Partial<Employee>) => {
    const response = await axiosInstance.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  // Xóa nhân viên
  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/employees/${id}`);
    return response.data;
  },
};
