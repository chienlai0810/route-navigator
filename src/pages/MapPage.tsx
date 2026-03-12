import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MapView } from '@/components/map/MapView';
import { RouteListPanel } from '@/components/map/RouteListPanel';
import { NewRouteDrawer } from '@/components/map/NewRouteDrawer';
import { useMapStore } from '@/hooks/useMapStore';
import L from 'leaflet';
import { EditRoutePanel } from '@/components/map/EditRoutePanel';
import { EditOperatingArea } from '@/components/map/EditOperatingArea';
import { postOfficesApi } from '@/api/postOffices';
import { routesApi, RouteResponse } from '@/api/routes';
import { operationalAreasApi, OperationalAreaResponse } from '@/api/operationalAreas';
import { useQuery } from '@tanstack/react-query';
import { Route, RouteType, OperationalArea } from '@/types';

export default function MapPage() {
  const { 
    selectedRouteId,
    selectedOperationalAreaId, 
    showRoutePanel, 
    setSelectedRoute,
    setSelectedOperationalArea, 
    setRoutes,
    setOperationalAreas,
    settings,
    filterPostOfficeId,
    filterProductType,
    filterOperationalAreaId
  } = useMapStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);

  const { data: postOffices } = useQuery({
    queryKey: ['post-offices'],
    queryFn: () => postOfficesApi.getAll(),
  });

  // Fetch routes từ API
  const { data: apiRoutes = [] } = useQuery({
    queryKey: ['routes', filterPostOfficeId, filterProductType, filterOperationalAreaId],
    queryFn: () => {
      return routesApi.getAll({
        postOfficeId: filterPostOfficeId,
        productType: filterProductType,
        operatingAreaId: filterOperationalAreaId,
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
        operatingAreaId: apiRoute.operatingAreaId || '',
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

  // Fetch operational areas từ API
  const { data: apiOperationalAreas = [] } = useQuery({
    queryKey: ['operational-areas', filterPostOfficeId, filterProductType],
    queryFn: () => operationalAreasApi.getAll({
      postOfficeId: filterPostOfficeId,
      productType: filterProductType,
    }),
  });

  // Transform API operational areas to local format (memoized)
  const localOperationalAreas = useMemo(() => {
    if (apiOperationalAreas.length === 0) return [];
    
    return apiOperationalAreas.map((apiArea: OperationalAreaResponse) => {
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
      const polygon = apiArea.area.points.map(point => ({
        lat: point.y,
        lng: point.x
      }));

      const area = computeArea(polygon);

      // Parse productType from string format "HH;TH" to array
      const productTypeArray: ('HH' | 'KH' | 'TH')[] = apiArea.productType 
        ? apiArea.productType.split(';').filter(Boolean) as ('HH' | 'KH' | 'TH')[]
        : [];

      // Create local operational area from API data
      // Use a purple color for operational areas to distinguish from routes
      return {
        id: apiArea.id,
        name: apiArea.name,
        postOfficeId: apiArea.postOfficeId,
        postOfficeName: apiArea.postOfficeName,
        productType: productTypeArray,
        color: apiArea.color || '#9333ea', // Purple color for operational areas
        polygon,
        area,
        isVisible: true,
        createdAt: new Date(apiArea.createdAt),
        updatedAt: new Date(apiArea.updatedAt),
      };
    });
  }, [apiOperationalAreas]);

  // Sync operational areas to zustand store
  const prevOperationalAreasRef = useRef<string>('');
  useEffect(() => {
    const areasKey = localOperationalAreas.map(a => a.id).sort().join(',');
    
    if (prevOperationalAreasRef.current !== areasKey) {
      prevOperationalAreasRef.current = areasKey;
      setOperationalAreas(localOperationalAreas);
    }
  }, [localOperationalAreas, setOperationalAreas]);

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

  // Đóng NewRouteDrawer khi EditRoutePanel hoặc EditOperatingArea mở
  useEffect(() => {
    if ((selectedRouteId || selectedOperationalAreaId) && drawerOpen) {
      setDrawerOpen(false);
      if (pendingLayer) {
        (pendingLayer as any).remove?.();
        setPendingLayer(null);
      }
      setPendingPolygon(null);
    }
  }, [selectedRouteId, selectedOperationalAreaId, drawerOpen, pendingLayer]);

  const handlePolygonCreated = useCallback((polygon: Array<{ lat: number; lng: number }>, layer: L.Layer) => {
    // Đóng EditRoutePanel và EditOperatingArea khi mở NewRouteDrawer
    setSelectedRoute(null);
    setSelectedOperationalArea(null);
    setPendingPolygon(polygon);
    setPendingLayer(layer);
    setDrawerOpen(true);
  }, [setSelectedRoute, setSelectedOperationalArea]);

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
      {showRoutePanel && <RouteListPanel postOffices={postOffices} operatingAreas={localOperationalAreas} />}

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
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-purple-500 border-dashed"
              />
              <span className="text-muted-foreground">Vùng hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      {selectedRouteId && <EditRoutePanel postOffices={postOffices} />}
      {selectedOperationalAreaId && <EditOperatingArea postOffices={postOffices} />}

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
