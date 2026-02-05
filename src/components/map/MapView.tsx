import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStore } from "@/hooks/useMapStore";

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

function formatKm2(areaM2: number) {
  return (areaM2 / 1_000_000).toFixed(2);
}

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

export function MapView() {
  const {
    routes,
    postOffices,
    selectedRouteId,
    setSelectedRoute,
    currentPolygon,
    activeTool,
    addPolygonPoint,
    setActiveTool,
  } = useMapStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const postOfficeLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);

  const visibleRoutes = useMemo(
    () => routes.filter((r) => r.isVisible),
    [routes]
  );

  // 1) Initialize the Leaflet map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: true,
    }).setView([21.0285, 105.8542], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    postOfficeLayerRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2) Cursor + interaction mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const container = map.getContainer();
    if (activeTool === "draw") {
      container.style.cursor = "crosshair";
      map.doubleClickZoom.disable();
    } else if (activeTool === "move") {
      container.style.cursor = "move";
      map.doubleClickZoom.enable();
    } else if (activeTool === "delete") {
      container.style.cursor = "not-allowed";
      map.doubleClickZoom.enable();
    } else {
      container.style.cursor = "";
      map.doubleClickZoom.enable();
    }
  }, [activeTool]);

  // 3) Drawing: click to add vertices, dblclick to finish
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: L.LeafletMouseEvent) => {
      if (activeTool !== "draw") return;
      addPolygonPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    const onDblClick = (e: L.LeafletMouseEvent) => {
      if (activeTool !== "draw") return;
      // Prevent zoom
      e.originalEvent?.preventDefault?.();
      e.originalEvent?.stopPropagation?.();

      // For now: finish drawing mode (saving is handled by the top toolbar)
      setActiveTool("select");
    };

    map.on("click", onClick);
    map.on("dblclick", onDblClick);

    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
    };
  }, [activeTool, addPolygonPoint, setActiveTool]);

  // 4) Render routes + markers
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    const postOfficeLayer = postOfficeLayerRef.current;
    const map = mapRef.current;

    if (!routeLayer || !postOfficeLayer || !map) return;

    routeLayer.clearLayers();
    postOfficeLayer.clearLayers();

    // Routes
    visibleRoutes.forEach((route) => {
      const isSelected = selectedRouteId === route.id;

      const polygon = L.polygon(
        route.polygon.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: route.color,
          fillColor: route.color,
          fillOpacity: isSelected ? 0.4 : 0.25,
          weight: isSelected ? 3 : 2,
        }
      );

      polygon.on("click", () => setSelectedRoute(route.id));
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
          <div style="opacity: 0.8;">Diện tích: ${formatKm2(route.area)} km²</div>
          ${route.assignedEmployeeName ? `<div style="opacity: 0.8;">NV: ${route.assignedEmployeeName}</div>` : ""}
        </div>`,
        { sticky: true }
      );

      polygon.addTo(routeLayer);
    });

    // Post offices
    const poIcon = createPostOfficeIcon();
    postOffices.forEach((po) => {
      const marker = L.marker([po.coordinates.lat, po.coordinates.lng], {
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

  // 5) Render current drawing polygon
  useEffect(() => {
    const drawingLayer = drawingLayerRef.current;
    if (!drawingLayer) return;

    drawingLayer.clearLayers();

    if (activeTool !== "draw" || currentPolygon.length === 0) return;

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

  return <div ref={containerRef} className="w-full h-full" />;
}
