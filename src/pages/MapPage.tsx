import { useState, useCallback, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import { RouteListPanel } from '@/components/map/RouteListPanel';
import { NewRouteDrawer } from '@/components/map/NewRouteDrawer';
import { useMapStore } from '@/hooks/useMapStore';
import L from 'leaflet';
import { EditRoutePanel } from '@/components/map/EditRoutePanel';
import { postOfficesApi } from '@/api/postOffices';
import { routesApi, RouteResponse } from '@/api/routes';
import { useQuery } from '@tanstack/react-query';
import { Route, RouteType } from '@/types';

export default function MapPage() {
  const { selectedRouteId, showRoutePanel, setSelectedRoute, addRoute, routes, settings } = useMapStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);

  const { data: postOffices } = useQuery({
    queryKey: ['post-offices'],
    queryFn: () => postOfficesApi.getAll(),
  });

  // Fetch routes từ API
  const { data: apiRoutes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getAll(),
  });

  // Sync routes từ API vào zustand store
  useEffect(() => {
    if (apiRoutes.length > 0) {
      // Map API response to local Route format
      apiRoutes.forEach((apiRoute: RouteResponse) => {
        // Check if route already exists in store
        const existingRoute = routes.find(r => r.id === apiRoute.id);
        if (existingRoute) return; // Skip if already exists

        // Map type from uppercase to lowercase
        const localType = apiRoute.type.toLowerCase() as RouteType;
        
        // Compute area
        const computeArea = (polygon: Array<{ lat: number; lng: number }>) => {
          if (polygon.length < 3) return 0;
          const R = 6371000;
          let area = 0;
          for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            const lat1 = (polygon[i].lat * Math.PI) / 180;
            const lat2 = (polygon[j].lat * Math.PI) / 180;
            const lng1 = (polygon[i].lng * Math.PI) / 180;
            const lng2 = (polygon[j].lng * Math.PI) / 180;
            area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
          }
          return Math.abs((area * R * R) / 2);
        };

        const area = computeArea(apiRoute.area.coordinates);

        // Create local route from API data
        const localRoute: Route = {
          id: apiRoute.id,
          name: apiRoute.name,
          code: apiRoute.code,
          type: localType,
          productType: apiRoute.productType,
          color: apiRoute.color || settings.routeColors[localType],
          postOfficeId: apiRoute.postOfficeId || (postOffices && postOffices[0]?.id) || '',
          assignedEmployeeName: apiRoute.staffMain,
          assignedEmployeeId: undefined,
          polygon: apiRoute.area.coordinates,
          area,
          isVisible: true,
          createdAt: new Date(apiRoute.createdAt),
          updatedAt: new Date(apiRoute.updatedAt),
        };

        addRoute(localRoute);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRoutes, settings, postOffices]);

  // Đóng NewRouteDrawer khi EditRoutePanel mở
  useEffect(() => {
    if (selectedRouteId && drawerOpen) {
      setDrawerOpen(false);
      if (pendingLayer) {
        (pendingLayer as any).remove?.();
        setPendingLayer(null);
      }
      setPendingPolygon(null);
    }
  }, [selectedRouteId, drawerOpen, pendingLayer]);

  const handlePolygonCreated = useCallback((polygon: Array<{ lat: number; lng: number }>, layer: L.Layer) => {
    // Đóng EditRoutePanel khi mở NewRouteDrawer
    setSelectedRoute(null);
    setPendingPolygon(polygon);
    setPendingLayer(layer);
    setDrawerOpen(true);
  }, [setSelectedRoute]);

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
        <MapView onPolygonCreated={handlePolygonCreated} postOffices={postOffices} />

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

      {selectedRouteId && <EditRoutePanel />}

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
