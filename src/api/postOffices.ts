import axiosInstance from "@/lib/axios";
import { PostOffice, ApiResponse, PostOfficePayload } from "@/types";

export interface GetPostOfficesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// API service cho Post Offices
export const postOfficesApi = {
  // Lấy danh sách bưu cục
  getAll: async (params?: GetPostOfficesParams): Promise<PostOffice[]> => {
    const response = await axiosInstance.get<ApiResponse<PostOffice[]>>(
      "/post-offices",
      { params }
    );
    return response.data.data;
  },

  // Lấy thông tin một bưu cục
  getById: async (id: string): Promise<PostOffice> => {
    const response = await axiosInstance.get<ApiResponse<PostOffice>>(`/post-offices/${id}`);
    return response.data.data;
  },

  // Tạo bưu cục mới
  createPostOffice: async (data: PostOfficePayload): Promise<PostOffice> => {
    const response = await axiosInstance.post<ApiResponse<PostOffice>>('/post-offices', data);
    return response.data.data;
  },

  // Cập nhật thông tin bưu cục
  updatePostOffice: async (id: string, data: Partial<PostOfficePayload>): Promise<PostOffice> => {
    const response = await axiosInstance.put<ApiResponse<PostOffice>>(`/post-offices/${id}`, data);
    return response.data.data;
  },

  // Xóa bưu cục
  deletePostOffice: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/post-offices/${id}`);
  },
};