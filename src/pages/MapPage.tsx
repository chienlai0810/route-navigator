import { MapView } from '@/components/map/MapView';
import { MapToolbar } from '@/components/map/MapToolbar';
import { RouteListPanel } from '@/components/map/RouteListPanel';
import { RouteDetailPanel } from '@/components/map/RouteDetailPanel';
import { useMapStore } from '@/hooks/useMapStore';
import { toast } from 'sonner';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MapPage() {
  const { selectedRouteId, showRoutePanel, activeTool } = useMapStore();

  const handleSave = () => {
    toast.success('Đã lưu thay đổi thành công!');
  };

  return (
    <div className="h-full flex">
      {/* Route List Panel */}
      {showRoutePanel && <RouteListPanel />}

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapView />

        {/* Floating Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <MapToolbar onSave={handleSave} canUndo={true} canRedo={false} />
        </div>

        {/* Drawing Mode Indicator */}
        {activeTool === 'draw' && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse-glow">
              Click để vẽ đỉnh • Double-click để hoàn thành
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1">
          <Button variant="secondary" size="icon" className="shadow-lg">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="shadow-lg">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="shadow-lg mt-2">
            <Crosshair className="w-4 h-4" />
          </Button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 z-10 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
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
