import axiosInstance from '@/lib/axios';
import { ApiResponse, SystemConfig, SystemConfigPayload } from '@/types';

/**
 * API service cho System Config
 */
export const settingsApi = {
  /**
   * Lấy cấu hình hệ thống
   */
  getSystemConfig: async (): Promise<SystemConfig> => {
    const response = await axiosInstance.get<ApiResponse<SystemConfig>>(
      '/system-config'
    );
    return response.data.data;
  },

  /**
   * Cập nhật cấu hình hệ thống
   */
  updateSystemConfig: async (
    payload: SystemConfigPayload
  ): Promise<SystemConfig> => {
    const response = await axiosInstance.put<ApiResponse<SystemConfig>>(
      '/system-config',
      payload
    );
    return response.data.data;
  },
};