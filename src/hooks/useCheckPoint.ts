import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { routesApi, CheckPointPayload, CheckPointResponse } from '@/api/routes';
import { toast } from 'sonner';

export function useCheckPoint() {
  const [isCheckingMode, setIsCheckingMode] = useState(false);
  const [lastCheckedPoint, setLastCheckedPoint] = useState<CheckPointResponse | null>(null);

  const checkPointMutation = useMutation({
    mutationFn: (data: CheckPointPayload) => routesApi.checkPointInPolygon(data),
    onSuccess: (data) => {
      setLastCheckedPoint(data);
      
      if (data.found && data.matchingRoutes.length > 0) {
        const routeNames = data.matchingRoutes.map(r => r.name).join(', ');
        toast.success(`Điểm nằm trong ${data.matchingRoutes.length} tuyến: ${routeNames}`);
      } else {
        toast.info('Điểm không nằm trong tuyến nào');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Kiểm tra điểm thất bại');
    },
  });

  const checkPoint = (latitude: number, longitude: number) => {
    checkPointMutation.mutate({ latitude, longitude });
  };

  const toggleCheckingMode = () => {
    setIsCheckingMode(prev => !prev);
    if (!isCheckingMode) {
      toast.info('Chế độ kiểm tra điểm đã bật. Click vào bản đồ để kiểm tra.');
    } else {
      setLastCheckedPoint(null);
    }
  };

  return {
    isCheckingMode,
    toggleCheckingMode,
    checkPoint,
    lastCheckedPoint,
    isLoading: checkPointMutation.isPending,
  };
}
