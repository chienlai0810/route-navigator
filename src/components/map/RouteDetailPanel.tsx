import { X, User, MapPin, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/hooks/useMapStore';
import { RouteType } from '@/types';
import { cn } from '@/lib/utils';

const routeTypeLabels: Record<RouteType, string> = {
  delivery: 'Giao hàng',
  pickup: 'Nhận hàng',
  all: 'Tất cả',
};

const routeTypeColors: Record<RouteType, string> = {
  delivery: 'route-badge-delivery',
  pickup: 'route-badge-pickup',
  all: 'route-badge-all',
};

export function RouteDetailPanel() {
  const { routes, selectedRouteId, setSelectedRoute, postOffices, setActiveTool, deleteRoute } = useMapStore();

  const route = routes.find((r) => r.id === selectedRouteId);

  if (!route) return null;

  const postOffice = postOffices.find((po) => po.id === route.postOfficeId);

  return (
    <div className="w-80 info-panel animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold">Chi tiết Tuyến</h2>
        <Button variant="ghost" size="icon" onClick={() => setSelectedRoute(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Route Name & Type */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: route.color }}
            />
            <h3 className="font-semibold text-lg">{route.name}</h3>
          </div>
          <span className={cn('route-badge', routeTypeColors[route.type])}>
            {routeTypeLabels[route.type]}
          </span>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {/* Post Office */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MapPin className="w-4 h-4" />
              <span>Bưu cục</span>
            </div>
            <p className="font-medium">{postOffice?.name}</p>
            <p className="text-xs text-muted-foreground">{postOffice?.code}</p>
          </div>

          {/* Assigned Employee */}
          {route.assignedEmployeeName && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="w-4 h-4" />
                <span>Nhân viên phụ trách</span>
              </div>
              <p className="font-medium">{route.assignedEmployeeName}</p>
            </div>
          )}

          {/* Area */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Diện tích</div>
            <p className="font-semibold text-xl">{(route.area / 1000).toFixed(2)} km²</p>
            <p className="text-xs text-muted-foreground">{route.area.toLocaleString()} m²</p>
          </div>

          {/* Vertices */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Số đỉnh polygon</div>
            <p className="font-medium">{route.polygon.length} đỉnh</p>
          </div>

          {/* Dates */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Thời gian</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Tạo:</span>
                <p className="font-medium">{route.createdAt.toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cập nhật:</span>
                <p className="font-medium">{route.updatedAt.toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
