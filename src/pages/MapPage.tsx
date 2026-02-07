import { MapView } from '@/components/map/MapView';
import { RouteListPanel } from '@/components/map/RouteListPanel';
import { RouteDetailPanel } from '@/components/map/RouteDetailPanel';
import { useMapStore } from '@/hooks/useMapStore';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MapPage() {
  const { selectedRouteId, showRoutePanel } = useMapStore();

  return (
    <div className="h-full flex">
      {/* Route List Panel */}
      {showRoutePanel && <RouteListPanel />}

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapView />

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
          <p className="font-medium mb-2 text-foreground">Chú thích</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-route-delivery" />
              <span className="text-muted-foreground">Giao hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-route-pickup" />
              <span className="text-muted-foreground">Nhận hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-route-all" />
              <span className="text-muted-foreground">Tất cả</span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Detail Panel */}
      {selectedRouteId && <RouteDetailPanel />}
    </div>
  );
}
