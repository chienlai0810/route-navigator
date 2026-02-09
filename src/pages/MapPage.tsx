import { useState, useCallback } from 'react';
import { MapView } from '@/components/map/MapView';
import { RouteListPanel } from '@/components/map/RouteListPanel';
import { RouteDetailPanel } from '@/components/map/RouteDetailPanel';
import { NewRouteDrawer } from '@/components/map/NewRouteDrawer';
import { useMapStore } from '@/hooks/useMapStore';
import L from 'leaflet';

export default function MapPage() {
  const { selectedRouteId, showRoutePanel } = useMapStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);

  const handlePolygonCreated = useCallback((polygon: Array<{ lat: number; lng: number }>, layer: L.Layer) => {
    setPendingPolygon(polygon);
    setPendingLayer(layer);
    setDrawerOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    setDrawerOpen(false);
    setPendingPolygon(null);
    // Remove the temporary Geoman layer since we now manage it in the store
    if (pendingLayer) {
      (pendingLayer as any).remove?.();
    }
    setPendingLayer(null);
  }, [pendingLayer]);

  const handleCancelled = useCallback(() => {
    setDrawerOpen(false);
    setPendingPolygon(null);
    // Remove the drawn layer since user cancelled
    if (pendingLayer) {
      (pendingLayer as any).remove?.();
    }
    setPendingLayer(null);
  }, [pendingLayer]);

  return (
    <div className="h-full flex">
      {showRoutePanel && <RouteListPanel />}

      <div className="flex-1 relative">
        <MapView onPolygonCreated={handlePolygonCreated} />

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
          <p className="font-medium mb-2 text-foreground">Chú thích</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--route-delivery))]" />
              <span className="text-muted-foreground">Giao hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--route-pickup))]" />
              <span className="text-muted-foreground">Nhận hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--route-all))]" />
              <span className="text-muted-foreground">Tất cả</span>
            </div>
          </div>
        </div>
      </div>

      {selectedRouteId && <RouteDetailPanel />}

      <NewRouteDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        pendingPolygon={pendingPolygon}
        pendingLayer={pendingLayer}
        onSaved={handleSaved}
        onCancelled={handleCancelled}
      />
    </div>
  );
}
