import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SystemConfig, SystemConfigPayload, Settings } from '@/types';
import { useMapStore } from './useMapStore';
import { settingsApi } from '@/api';

// Query key
export const SYSTEM_CONFIG_KEY = ['system-config'];

// Transform functions
export const transformApiToSettings = (apiConfig: SystemConfig): Settings => {
  return {
    overlapThreshold: {
      value: apiConfig.antiConflictThreshold,
      unit: apiConfig.antiConflictUnit === '%' ? 'percent' as const : 'm2' as const,
    },
    routeColors: {
      delivery: apiConfig.routeColors.DELIVERY,
      pickup: apiConfig.routeColors.PICKUP,
      all: apiConfig.routeColors.ALL,
    },
  };
};

export const transformSettingsToApi = (settings: Settings): SystemConfigPayload => {
  return {
    antiConflictThreshold: settings.overlapThreshold.value,
    antiConflictUnit: settings.overlapThreshold.unit === 'percent' ? '%' : 'm²',
    routeColors: {
      DELIVERY: settings.routeColors.delivery,
      PICKUP: settings.routeColors.pickup,
      ALL: settings.routeColors.all,
    },
  };
};

/**
 * Hook để lấy system config từ API
 * Tự động cập nhật vào Zustand store khi fetch thành công
 */
export const useSystemConfig = () => {
  const updateSettings = useMapStore((state) => state.updateSettings);
  const syncRouteColorsWithSettings = useMapStore((state) => state.syncRouteColorsWithSettings);

  const query = useQuery({
    queryKey: SYSTEM_CONFIG_KEY,
    queryFn: () => settingsApi.getSystemConfig(),
    staleTime: 5 * 60 * 1000, // Cache trong 5 phút
  });

  // Cập nhật store khi data thay đổi
  useEffect(() => {
    if (query.data) {
      const transformedSettings = transformApiToSettings(query.data);
      updateSettings(transformedSettings);
      // Sync màu của routes với settings mới
      syncRouteColorsWithSettings();
    }
  }, [query.data, updateSettings, syncRouteColorsWithSettings]);

  return query;
};

/**
 * Hook để cập nhật system config
 */
export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  const updateSettings = useMapStore((state) => state.updateSettings);
  const syncRouteColorsWithSettings = useMapStore((state) => state.syncRouteColorsWithSettings);

  return useMutation({
    mutationFn: (payload: SystemConfigPayload) => settingsApi.updateSystemConfig(payload),
    onSuccess: (data: SystemConfig) => {
      // Invalidate và refetch
      queryClient.invalidateQueries({ queryKey: SYSTEM_CONFIG_KEY });
      
      // Cập nhật store
      const transformedSettings = transformApiToSettings(data);
      updateSettings(transformedSettings);
      
      // Sync màu của routes với settings mới
      syncRouteColorsWithSettings();
    },
  });
};
