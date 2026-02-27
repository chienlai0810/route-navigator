import { useState, useEffect } from 'react';
import { Palette, Ruler, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore } from '@/hooks/useMapStore';
import { toast } from 'sonner';
import { 
  useSystemConfig, 
  useUpdateSystemConfig, 
  transformSettingsToApi 
} from '@/hooks/useSystemConfig';

export default function SettingsPage() {
  const { settings } = useMapStore();
  const [localSettings, setLocalSettings] = useState(settings);
  
  // Sử dụng TanStack Query
  const { isLoading: isFetching, error } = useSystemConfig();
  const updateMutation = useUpdateSystemConfig();

  // Sync localSettings với settings từ store
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Hiển thị lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error('Không thể tải cấu hình hệ thống');
    }
  }, [error]);

  const handleSave = async () => {
    const payload = transformSettingsToApi(localSettings);
    
    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Đã lưu cài đặt thành công!');
      },
      onError: () => {
        toast.error('Không thể lưu cài đặt. Vui lòng thử lại!');
      },
    });
  };

  return (
    <div className="h-full p-6 overflow-auto">
      {isFetching ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Đang tải cấu hình...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Thiết lập Tham số</h1>
          <p className="text-muted-foreground">
            Cấu hình các tham số mặc định cho hệ thống
          </p>
        </div>

        {/* Overlap Threshold */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              Ngưỡng chồng lấn tuyến
            </CardTitle>
            <CardDescription>
              Thiết lập ngưỡng cảnh báo khi các tuyến chồng lấn lên nhau
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="threshold">Giá trị</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={localSettings.overlapThreshold.value}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      overlapThreshold: {
                        ...localSettings.overlapThreshold,
                        value: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Đơn vị</Label>
                <Select
                  value={localSettings.overlapThreshold.unit}
                  onValueChange={(value: 'percent' | 'm2') =>
                    setLocalSettings({
                      ...localSettings,
                      overlapThreshold: {
                        ...localSettings.overlapThreshold,
                        unit: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="m2">m²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Khi vùng chồng lấn vượt ngưỡng này, hệ thống sẽ hiển thị cảnh báo.
            </p>
          </CardContent>
        </Card>

        {/* Route Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Màu mặc định theo loại tuyến
            </CardTitle>
            <CardDescription>
              Thiết lập màu sắc hiển thị cho từng loại tuyến trên bản đồ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Delivery Color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: localSettings.routeColors.delivery }}
                  />
                  Giao hàng
                </Label>
                <Input
                  type="color"
                  value={localSettings.routeColors.delivery.startsWith('hsl') 
                    ? '#22c55e' 
                    : localSettings.routeColors.delivery}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      routeColors: {
                        ...localSettings.routeColors,
                        delivery: e.target.value,
                      },
                    })
                  }
                  className="h-12 p-1 cursor-pointer"
                />
              </div>

              {/* Pickup Color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: localSettings.routeColors.pickup }}
                  />
                  Nhận hàng
                </Label>
                <Input
                  type="color"
                  value={localSettings.routeColors.pickup.startsWith('hsl') 
                    ? '#f97316' 
                    : localSettings.routeColors.pickup}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      routeColors: {
                        ...localSettings.routeColors,
                        pickup: e.target.value,
                      },
                    })
                  }
                  className="h-12 p-1 cursor-pointer"
                />
              </div>

              {/* All Color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: localSettings.routeColors.all }}
                  />
                  Tất cả
                </Label>
                <Input
                  type="color"
                  value={localSettings.routeColors.all.startsWith('hsl') 
                    ? '#06b6d4' 
                    : localSettings.routeColors.all}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      routeColors: {
                        ...localSettings.routeColors,
                        all: e.target.value,
                      },
                    })
                  }
                  className="h-12 p-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-3">Xem trước</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg border-2"
                  style={{
                    backgroundColor: `${localSettings.routeColors.delivery}40`,
                    borderColor: localSettings.routeColors.delivery,
                  }}
                />
                <div
                  className="w-16 h-16 rounded-lg border-2"
                  style={{
                    backgroundColor: `${localSettings.routeColors.pickup}40`,
                    borderColor: localSettings.routeColors.pickup,
                  }}
                />
                <div
                  className="w-16 h-16 rounded-lg border-2"
                  style={{
                    backgroundColor: `${localSettings.routeColors.all}40`,
                    borderColor: localSettings.routeColors.all,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending || isFetching}
            className="gradient-primary text-primary-foreground"
          >
            {updateMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
