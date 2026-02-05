import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '@/hooks/useMapStore';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom post office marker
const createPostOfficeIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, hsl(213, 94%, 28%) 0%, hsl(213, 94%, 35%) 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">
        <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

function MapEvents() {
  const map = useMap();
  const { activeTool, addPolygonPoint } = useMapStore();

  useEffect(() => {
    if (activeTool === 'draw') {
      map.getContainer().style.cursor = 'crosshair';
    } else if (activeTool === 'move') {
      map.getContainer().style.cursor = 'move';
    } else if (activeTool === 'delete') {
      map.getContainer().style.cursor = 'not-allowed';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [activeTool, map]);

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (activeTool === 'draw') {
        addPolygonPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [activeTool, addPolygonPoint, map]);

  return null;
}

export function MapView() {
  const {
    routes,
    postOffices,
    selectedRouteId,
    setSelectedRoute,
    currentPolygon,
    activeTool,
  } = useMapStore();

  const mapRef = useRef<L.Map>(null);

  // Center on Hanoi
  const defaultCenter: [number, number] = [21.0285, 105.8542];
  const defaultZoom = 14;

  const visibleRoutes = routes.filter((route) => route.isVisible);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents />

        {/* Render route polygons */}
        {visibleRoutes.map((route) => (
          <Polygon
            key={route.id}
            positions={route.polygon.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: route.color,
              fillColor: route.color,
              fillOpacity: selectedRouteId === route.id ? 0.4 : 0.25,
              weight: selectedRouteId === route.id ? 3 : 2,
            }}
            eventHandlers={{
              click: () => setSelectedRoute(route.id),
            }}
          >
            <Tooltip sticky>
              <div className="text-sm">
                <strong>{route.name}</strong>
                <br />
                <span className="text-xs">
                  Diện tích: {(route.area / 1000).toFixed(1)} km²
                </span>
                {route.assignedEmployeeName && (
                  <>
                    <br />
                    <span className="text-xs">NV: {route.assignedEmployeeName}</span>
                  </>
                )}
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* Current drawing polygon */}
        {activeTool === 'draw' && currentPolygon.length > 0 && (
          <Polygon
            positions={currentPolygon.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: 'hsl(213, 94%, 55%)',
              fillColor: 'hsl(213, 94%, 55%)',
              fillOpacity: 0.3,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}

        {/* Post office markers */}
        {postOffices.map((po) => (
          <Marker
            key={po.id}
            position={[po.coordinates.lat, po.coordinates.lng]}
            icon={createPostOfficeIcon()}
          >
            <Tooltip>
              <div className="text-sm">
                <strong>{po.name}</strong>
                <br />
                <span className="text-xs">{po.code}</span>
                <br />
                <span className="text-xs opacity-70">{po.address}</span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
