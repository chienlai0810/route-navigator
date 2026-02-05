import { useState } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMapStore } from '@/hooks/useMapStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RouteType } from '@/types';

const routeTypeLabels: Record<RouteType, string> = {
  delivery: 'Giao hàng',
  pickup: 'Nhận hàng',
  all: 'Tất cả',
};

// Simple point-in-polygon algorithm
function isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]) {
  let inside = false;
  const x = point.lng, y = point.lat;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

export default function RoutesPage() {
  const { routes, postOffices } = useMapStore();
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [result, setResult] = useState<{
    routeId: string | null;
    routeName?: string;
    routeType?: RouteType;
    postOffice?: string;
    employee?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate geocoding delay
    setTimeout(() => {
      const lat = parseFloat(coordinates.lat) || 21.028;
      const lng = parseFloat(coordinates.lng) || 105.856;
      
      // Find matching route using point-in-polygon
      let foundRoute = null;
      for (const route of routes) {
        if (isPointInPolygon({ lat, lng }, route.polygon)) {
          foundRoute = route;
          break;
        }
      }

      if (foundRoute) {
        const postOffice = postOffices.find((po) => po.id === foundRoute!.postOfficeId);
        setResult({
          routeId: foundRoute.id,
          routeName: foundRoute.name,
          routeType: foundRoute.type,
          postOffice: postOffice?.name,
          employee: foundRoute.assignedEmployeeName,
        });
        toast.success('Tìm thấy tuyến phù hợp!');
      } else {
        setResult({ routeId: null });
        toast.warning('Không tìm thấy tuyến phù hợp');
      }
      
      setIsSearching(false);
    }, 500);
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Xác định Tuyến (Point-in-Polygon)</h1>
          <p className="text-muted-foreground">
            Nhập địa chỉ hoặc tọa độ để xác định tuyến giao/nhận phù hợp
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Tra cứu tuyến
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ giao hàng..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">HOẶC</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Coordinates Input */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Vĩ độ (Latitude)</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={coordinates.lat}
                  onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                  placeholder="21.0285"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Kinh độ (Longitude)</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={coordinates.lng}
                  onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
                  placeholder="105.8542"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full gradient-primary text-primary-foreground"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tìm kiếm...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Xác định tuyến
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div className="animate-fade-in">
            {result.routeId ? (
              <Card className="border-status-active/30 bg-status-active/5">
                <CardHeader>
                  <CardTitle className="text-lg text-status-active flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-status-active/20 flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-status-active" />
                    </div>
                    Đã tìm thấy tuyến phù hợp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tên tuyến</p>
                      <p className="font-semibold">{result.routeName}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Loại tuyến</p>
                      <span className={cn(
                        'route-badge',
                        result.routeType === 'delivery' && 'route-badge-delivery',
                        result.routeType === 'pickup' && 'route-badge-pickup',
                        result.routeType === 'all' && 'route-badge-all'
                      )}>
                        {routeTypeLabels[result.routeType!]}
                      </span>
                    </div>
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Bưu cục</p>
                      <p className="font-semibold">{result.postOffice}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Nhân viên phụ trách</p>
                      <p className="font-semibold">{result.employee || 'Chưa gán'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert variant="destructive" className="border-warning/30 bg-warning/5">
                <AlertTitle className="text-warning flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Không tìm thấy tuyến
                </AlertTitle>
                <AlertDescription className="text-warning/80 mt-2">
                  Vị trí này chưa thuộc tuyến giao/nhận nào trong hệ thống.
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Kiểm tra lại tọa độ đã nhập</li>
                    <li>Liên hệ quản lý để bổ sung vùng tuyến mới</li>
                    <li>Hoặc xử lý thủ công cho đơn hàng này</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{routes.length}</div>
              <p className="text-sm text-muted-foreground">Tổng số tuyến</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-route-delivery">
                {routes.filter((r) => r.type === 'delivery').length}
              </div>
              <p className="text-sm text-muted-foreground">Tuyến giao</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-route-pickup">
                {routes.filter((r) => r.type === 'pickup').length}
              </div>
              <p className="text-sm text-muted-foreground">Tuyến nhận</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
