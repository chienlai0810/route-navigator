import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  const { 
    selectedRouteId, 
    showRoutePanel, 
    setSelectedRoute, 
    setRoutes,
    settings,
    filterPostOfficeId,
    filterRouteType,
  } = useMapStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);

  const { data: postOffices } = useQuery({
    queryKey: ['post-offices'],
    queryFn: () => postOfficesApi.getAll(),
  });

  // Fetch routes từ API với filter params
  const { data: apiRoutes = [] } = useQuery({
    queryKey: ['routes', filterPostOfficeId, filterRouteType],
    queryFn: () => {
      // Convert local RouteType to API RouteType (uppercase)
      const apiRouteType = filterRouteType 
        ? (filterRouteType.toUpperCase() as 'DELIVERY' | 'PICKUP' | 'ALL')
        : null;
      
      return routesApi.getAll({
        postOfficeId: filterPostOfficeId,
        type: apiRouteType,
      });
    },
  });

  // Transform API routes to local Route format (memoized)
  const localRoutes = useMemo(() => {
    if (apiRoutes.length === 0) return [];
    
    return apiRoutes.map((apiRoute: RouteResponse) => {
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

      // Convert GeoJSON points to polygon coordinates
      const polygon = apiRoute.area.points.map(point => ({
        lat: point.y,
        lng: point.x
      }));

      const area = computeArea(polygon);

      // Parse productType from string format "HH;TH" to array
      const productTypeArray: ('HH' | 'KH' | 'TH')[] = apiRoute.productType 
        ? apiRoute.productType.split(';').filter(Boolean) as ('HH' | 'KH' | 'TH')[]
        : [];

      // Create local route from API data
      return {
        id: apiRoute.id,
        name: apiRoute.name,
        code: apiRoute.code,
        type: localType,
        productType: productTypeArray,
        color: apiRoute.color || settings.routeColors[localType],
        postOfficeId: apiRoute.postOfficeId || (postOffices && postOffices[0]?.id) || '',
        assignedEmployeeName: apiRoute.staffMain,
        assignedEmployeeId: undefined,
        polygon,
        area,
        isVisible: true,
        createdAt: new Date(apiRoute.createdAt),
        updatedAt: new Date(apiRoute.updatedAt),
      };
    });
  }, [apiRoutes, settings, postOffices]);

  // Sync routes to zustand store (only when localRoutes change)
  const prevRoutesRef = useRef<string>('');
  useEffect(() => {
    // Create a stable comparison key based on route IDs
    const routesKey = localRoutes.map(r => r.id).sort().join(',');
    
    // Only update if routes actually changed
    if (prevRoutesRef.current !== routesKey) {
      prevRoutesRef.current = routesKey;
      setRoutes(localRoutes);
    }
  }, [localRoutes, setRoutes]);

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
      {showRoutePanel && <RouteListPanel postOffices={postOffices} />}

      <div className="flex-1 relative">
        <MapView onPolygonCreated={handlePolygonCreated} postOffices={postOffices} />

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
          <p className="font-medium mb-2 text-foreground">Chú thích</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: settings.routeColors.delivery }}
              />
              <span className="text-muted-foreground">Giao hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: settings.routeColors.pickup }}
              />
              <span className="text-muted-foreground">Nhận hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: settings.routeColors.all }}
              />
              <span className="text-muted-foreground">Tất cả</span>
            </div>
          </div>
        </div>
      </div>

      {selectedRouteId && <EditRoutePanel postOffices={postOffices} />}

      <NewRouteDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        pendingPolygon={pendingPolygon}
        pendingLayer={pendingLayer}
        onSaved={handleSaved}
        onCancelled={handleCancelled}
        postOffices={postOffices}
      />
    </div>
  );
}
