import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.gridlayer.googlemutant";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useMapStore } from "@/hooks/useMapStore";
import { PostOffice } from "@/types";
import { routeTypeLabels } from "@/constants";

// Fix for default marker icons (Leaflet expects image assets)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function createPostOfficeIcon() {
  // Use CSS variables so this stays theme-consistent
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 9999px;
        background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px -6px hsl(var(--foreground) / 0.35);
        border: 2px solid hsl(var(--background));
      ">
        <svg style="width: 20px; height: 20px; color: hsl(var(--primary-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

interface MapViewProps {
  onPolygonCreated?: (polygon: Array<{ lat: number; lng: number }>, layer: L.Layer) => void;
  postOffices?: PostOffice[];
}

export function MapView({ onPolygonCreated, postOffices }: MapViewProps) {
  const {
    routes,
    selectedRouteId,
    setSelectedRoute,
    currentPolygon,
    activeTool,
    setActiveTool,
    updateRoute,
    setMapInstance,
    saveOriginalPolygon,
    editingRouteId,
    editMode,
  } = useMapStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const postOfficeLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  // Track layer-to-route mapping
  const layerToRouteMap = useRef<Map<number, string>>(new Map());
  const routeToLayerMap = useRef<Map<string, L.Polygon>>(new Map());

  
  // Map layer type state
  const [layerType, setLayerType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const visibleRoutes = useMemo(
    () => routes.filter((r) => r.isVisible),
    [routes]
  );

  console.log('Visible routes:', visibleRoutes);

  // 1) Initialize the Leaflet map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: true,
    }).setView([21.0285, 105.8542], 14);

    // L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //   attribution:
    //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    // }).addTo(map);

    const initialTileLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution: '&copy; Google Maps',
    }).addTo(map);
    
    tileLayerRef.current = initialTileLayer;

    routeLayerRef.current = L.layerGroup().addTo(map);
    postOfficeLayerRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapInstance(map);

    // Initialize Leaflet Geoman after map is fully ready
    map.whenReady(() => {
      map.pm.addControls({
        position: 'topleft',
        drawMarker: true,
        drawCircleMarker: false,
        drawText: false,
        drawPolyline: false,
        drawRectangle: false,
        drawPolygon: true,
        drawCircle: false,
        editMode: false,
        dragMode: false,
        cutPolygon: false,
        removalMode: false,
        rotateMode: false,
        customControls: true,
      });
    });

    return () => {
      setMapInstance(null);
      map.remove();
      mapRef.current = null;
    };
  }, [setMapInstance]);

  // Handle layer type change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;

    // Remove current tile layer
    map.removeLayer(tileLayerRef.current);

    // Add new tile layer based on type
    let lyrsParam = 'm'; // default roadmap
    switch (layerType) {
      case 'satellite':
        lyrsParam = 's';
        break;
      case 'hybrid':
        lyrsParam = 'y';
        break;
      case 'terrain':
        lyrsParam = 'p';
        break;
      case 'roadmap':
      default:
        lyrsParam = 'm';
        break;
    }

    const newTileLayer = L.tileLayer(`https://mt1.google.com/vt/lyrs=${lyrsParam}&x={x}&y={y}&z={z}`, {
      attribution: '&copy; Google Maps',
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [layerType]);

  // 2) Cursor + interaction mode with Geoman integration
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.pm) return;

    const container = map.getContainer();
    
    // Disable all Geoman modes first
    map.pm.disableDraw();
    map.pm.disableGlobalEditMode();
    map.pm.disableGlobalDragMode();
    map.pm.disableGlobalRemovalMode();

    if (activeTool === "draw") {
      container.style.cursor = "crosshair";
      map.doubleClickZoom.disable();
      // Enable Polygon drawing mode
      map.pm.enableDraw('Polygon', {
        snappable: true,
        snapDistance: 20,
        allowSelfIntersection: false,
        templineStyle: {
          color: 'hsl(var(--primary))',
          weight: 2,
          dashArray: '5, 5',
        },
        hintlineStyle: {
          color: 'hsl(var(--primary))',
          dashArray: '5, 5',
        },
        pathOptions: {
          color: 'hsl(var(--primary))',
          fillColor: 'hsl(var(--primary))',
          fillOpacity: 0.25,
          weight: 2,
        },
      });
    } else if (activeTool === "edit") {
      container.style.cursor = "pointer";
      map.doubleClickZoom.enable();
      // Enable edit mode for all layers
      map.pm.enableGlobalEditMode({
        snappable: true,
        snapDistance: 20,
      });
    } else if (activeTool === "move") {
      container.style.cursor = "move";
      map.doubleClickZoom.enable();
      // Enable drag mode for all layers
      map.pm.enableGlobalDragMode();
    } else if (activeTool === "delete") {
      container.style.cursor = "not-allowed";
      map.doubleClickZoom.enable();
      // Enable removal mode
      map.pm.enableGlobalRemovalMode();
    } else {
      container.style.cursor = "";
      map.doubleClickZoom.enable();
    }
  }, [activeTool]);

  // 3) Geoman event listeners
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // When a shape is created
    const onDrawEnd = (e: any) => {
      const layer = e.layer;
      console.log('Shape created:', layer);
      
      // Layer is already added to the map by Geoman
      // Just track it in our drawing layer group for management
      if (drawingLayerRef.current && !drawingLayerRef.current.hasLayer(layer)) {
        drawingLayerRef.current.addLayer(layer);
      }

      // Get coordinates and notify parent
      if (layer instanceof L.Polygon) {
        const coords = (layer.getLatLngs()[0] as L.LatLng[]).map((ll) => ({
          lat: ll.lat,
          lng: ll.lng,
        }));
        onPolygonCreated?.(coords, layer);
      }

      // Switch back to select mode after drawing
      setActiveTool('select');
    };

    // When a shape is edited
    const onEdit = (e: any) => {
      console.log('Shape edited:', e);
      
      const layer = e.layer;
      if (layer instanceof L.Polygon) {
        const layerId = L.Util.stamp(layer);
        const routeId = layerToRouteMap.current.get(layerId);
        
        if (routeId) {
          const coords = layer.getLatLngs()[0] as L.LatLng[];
          // Calculate area in m²
          const calculateArea = (latlngs: L.LatLng[]) => {
            if (latlngs.length < 3) return 0;
            const R = 6371000;
            let area = 0;
            for (let i = 0; i < latlngs.length; i++) {
              const j = (i + 1) % latlngs.length;
              const lat1 = (latlngs[i].lat * Math.PI) / 180;
              const lat2 = (latlngs[j].lat * Math.PI) / 180;
              const lng1 = (latlngs[i].lng * Math.PI) / 180;
              const lng2 = (latlngs[j].lng * Math.PI) / 180;
              area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
            }
            return Math.abs((area * R * R) / 2);
          };
          
          const areaM2 = calculateArea(coords);
          
          // Update route in store immediately
          updateRoute(routeId, {
            polygon: coords.map(c => ({ lat: c.lat, lng: c.lng })),
            area: areaM2,
          });
        }
      }
    };

    // When a shape is removed
    const onRemove = (e: any) => {
      console.log('Shape removed:', e);
    };

    // Register event listeners
    map.on('pm:create', onDrawEnd);
    map.on('pm:edit', onEdit);
    map.on('pm:remove', onRemove);

    return () => {
      map.off('pm:create', onDrawEnd);
      map.off('pm:edit', onEdit);
      map.off('pm:remove', onRemove);
    };
  }, [setActiveTool, onPolygonCreated, updateRoute]);

  // 4) Render routes + markers
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    const postOfficeLayer = postOfficeLayerRef.current;
    const map = mapRef.current;

    if (!routeLayer || !postOfficeLayer || !map) return;

    // Track which routes we're processing
    const processedRouteIds = new Set<string>();

    // Update or create polygons for visible routes
    visibleRoutes.forEach((route) => {
      processedRouteIds.add(route.id);
      const isSelected = selectedRouteId === route.id;
      
      // Save original polygon if not already saved
      saveOriginalPolygon(route.id, route.polygon);
      
      // Check if layer already exists
      let polygon = routeToLayerMap.current.get(route.id);
      
      if (polygon && routeLayer.hasLayer(polygon)) {
        // Update polygon coordinates (important for reset functionality)
        const newLatLngs = route.polygon.map((p) => [p.lat, p.lng] as [number, number]);
        polygon.setLatLngs(newLatLngs);
        
        // Update style
        polygon.setStyle({
          color: route.color,
          fillColor: route.color,
          fillOpacity: isSelected ? 0.4 : 0.25,
          weight: isSelected ? 3 : 2,
        });
        
        // Update tooltip
        polygon.unbindTooltip();
        polygon.bindTooltip(
          `<div style="font-size: 12px; line-height: 1.35;">
            <div style="font-weight: 600; margin-bottom: 2px;">${route.name}</div>
            <div style="opacity: 0.8;">Loại tuyến: ${routeTypeLabels[route.type]}</div>
            ${route.productType && route.productType.length > 0 ? `<div style="opacity: 0.8;">Loại hàng hóa: ${route.productType.join(', ')}</div>` : ""}
            ${route.assignedEmployeeName ? `<div style="opacity: 0.8;">NV: ${route.assignedEmployeeName}</div>` : ""}
          </div>`,
          { sticky: true }
        );
      } else {
        // Create new polygon
        polygon = L.polygon(
          route.polygon.map((p) => [p.lat, p.lng] as [number, number]),
          {
            color: route.color,
            fillColor: route.color,
            fillOpacity: isSelected ? 0.4 : 0.25,
            weight: isSelected ? 3 : 2,
            pmIgnore: false,
          }
        );

        // Track layer-route mapping
        const layerId = L.Util.stamp(polygon);
        layerToRouteMap.current.set(layerId, route.id);
        routeToLayerMap.current.set(route.id, polygon);

        // polygon.on("click", () => setSelectedRoute(route.id, true));
        polygon.on("dblclick", (e) => {
          L.DomEvent.stopPropagation(e);
          if (e.originalEvent) {
            e.originalEvent.preventDefault();
          }
          setSelectedRoute(route.id, true);
        });
      polygon.on("mouseover", () => {
        polygon.setStyle({ weight: 3, fillOpacity: 0.35 });
      });
      polygon.on("mouseout", () => {
        const stillSelected = selectedRouteId === route.id;
        polygon.setStyle({
          weight: stillSelected ? 3 : 2,
          fillOpacity: stillSelected ? 0.4 : 0.25,
        });
      });

        polygon.bindTooltip(
          `<div style="font-size: 12px; line-height: 1.35;">
            <div style="font-weight: 600; margin-bottom: 2px;">${route.name}</div>
            <div style="opacity: 0.8;">Loại tuyến: ${routeTypeLabels[route.type]}</div>
            ${route.productType && route.productType.length > 0 ? `<div style="opacity: 0.8;">Loại hàng hóa: ${route.productType.join(', ')}</div>` : ""}
            ${route.assignedEmployeeName ? `<div style="opacity: 0.8;">NV: ${route.assignedEmployeeName}</div>` : ""}
          </div>`,
          { sticky: true }
        );

        polygon.addTo(routeLayer);
      }
    });
    
    // Remove layers for routes that are no longer visible or deleted
    routeToLayerMap.current.forEach((layer, routeId) => {
      if (!processedRouteIds.has(routeId)) {
        const layerId = L.Util.stamp(layer);
        layerToRouteMap.current.delete(layerId);
        routeToLayerMap.current.delete(routeId);
        routeLayer.removeLayer(layer);
      }
    });

    // Post offices - clear and recreate
    postOfficeLayer.clearLayers();

    // Post offices
    const poIcon = createPostOfficeIcon();
    postOffices?.forEach((po) => {
      const marker = L.marker([po.location.coordinates[1], po.location.coordinates[0]], {
        icon: poIcon,
      });

      marker.bindTooltip(
        `<div style="font-size: 12px; line-height: 1.35;">
          <div style="font-weight: 600; margin-bottom: 2px;">${po.name}</div>
          <div style="opacity: 0.8;">${po.code}</div>
          <div style="opacity: 0.7;">${po.address}</div>
        </div>`,
        { direction: "top" }
      );

      marker.addTo(postOfficeLayer);
    });
  }, [postOffices, visibleRoutes, selectedRouteId, setSelectedRoute]);

  // 5) Render current drawing polygon (legacy click-based drawing only)
  // Note: This effect is for the legacy drawing system. Geoman shapes are managed separately.
  useEffect(() => {
    const drawingLayer = drawingLayerRef.current;
    if (!drawingLayer) return;

    // Only manage temporary drawing visualization when actively in draw mode
    // Don't clear layers from Geoman when switching modes
    if (activeTool !== "draw") return;

    // Clear only temporary shapes when in draw mode
    drawingLayer.eachLayer((layer: any) => {
      // Only remove layers that are temporary (from legacy click system)
      // Keep layers that were added by Geoman (they have _pmTempLayer or are complete)
      if (layer.options?.dashArray === "5, 5" && !layer.pm) {
        drawingLayer.removeLayer(layer);
      }
    });

    if (currentPolygon.length === 0) return;

    const latlngs = currentPolygon.map((p) => [p.lat, p.lng] as [number, number]);

    if (latlngs.length < 3) {
      L.polyline(latlngs, {
        color: "hsl(var(--primary))",
        weight: 2,
        dashArray: "5, 5",
      }).addTo(drawingLayer);
      return;
    }

    L.polygon(latlngs, {
      color: "hsl(var(--primary))",
      fillColor: "hsl(var(--primary))",
      fillOpacity: 0.25,
      weight: 2,
      dashArray: "5, 5",
    }).addTo(drawingLayer);
  }, [activeTool, currentPolygon]);

  // Enable/disable polygon editing when editingRouteId or editMode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Cleanup all polygons - remove listeners and disable all modes
    routeToLayerMap.current.forEach((polygon) => {
      if (polygon.pm) {
        polygon.off('pm:edit');
        polygon.off('pm:drag');
        polygon.off('pm:dragstart');
        polygon.off('pm:dragend');
        polygon.pm.disable();
        polygon.pm.disableLayerDrag();
        const element = polygon.getElement();
        if (element) {
          (element as HTMLElement).style.cursor = '';
        }
      }
    });

    // Enable editing on the selected route if editingRouteId is set
    if (editingRouteId && editMode) {
      const polygon = routeToLayerMap.current.get(editingRouteId);
      if (polygon && polygon.pm) {
        
        // Listen for edit events
        const handleEdit = (e: any) => {
          const layer = e.layer || e.target;
          if (layer) {
            const newLatLngs = layer.getLatLngs()[0];
            const newPolygon = newLatLngs.map((latlng: L.LatLng) => ({
              lat: latlng.lat,
              lng: latlng.lng,
            }));
            // Update the route in store with new polygon
            updateRoute(editingRouteId, { polygon: newPolygon });
          }
        };

        if (editMode === 'vertices') {
          // Enable vertex editing only
          polygon.pm.enable({
            allowSelfIntersection: false,
            preventMarkerRemoval: true,
            draggable: false,
            snappable: true,
            snapDistance: 20,
            hideMiddleMarkers: false,
          });
          polygon.on('pm:edit', handleEdit);
          const element = polygon.getElement();
          if (element) {
            (element as HTMLElement).style.cursor = 'default';
          }
        } else if (editMode === 'drag') {
          // Enable dragging the entire polygon
          polygon.pm.enable({
            draggable: true,
            snappable: true,
            snapDistance: 20,
            hideMiddleMarkers: true,
          });
          polygon.pm.enableLayerDrag();
          polygon.on('pm:drag', handleEdit);
          polygon.on('pm:dragstart', handleEdit);
          polygon.on('pm:dragend', handleEdit);
          const element = polygon.getElement();
          if (element) {
            (element as HTMLElement).style.cursor = 'move';
          }
        }
      }
    }
  }, [editingRouteId, editMode, updateRoute]);

  const layerOptions = [
    { value: 'roadmap' as const, label: 'Bản đồ', icon: '🗺️' },
    { value: 'hybrid' as const, label: 'Vệ tinh', icon: '🛰️' },
    // { value: 'hybrid' as const, label: 'Hybrid', icon: '🌍' },
    // { value: 'terrain' as const, label: 'Địa hình', icon: '⛰️' },
  ];

  const currentLayer = layerOptions.find(opt => opt.value === layerType);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Layer Switcher */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="bg-background border-2 border-border hover:bg-accent hover:border-primary text-foreground px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium min-w-[140px] justify-between"
            title="Chuyển đổi loại bản đồ"
          >
            <span className="flex items-center gap-2">
              <span>{currentLayer?.icon}</span>
              <span>{currentLayer?.label}</span>
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${showLayerMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showLayerMenu && (
            <div className="absolute top-full mt-2 right-0 bg-background border-2 border-border rounded-lg shadow-xl overflow-hidden min-w-[140px]">
              {layerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setLayerType(option.value);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 ${
                    layerType === option.value ? 'bg-accent/50 font-semibold' : ''
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
