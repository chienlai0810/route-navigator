# Hướng dẫn sử dụng Leaflet Geoman trong Route Navigator

## Tổng quan

Ứng dụng đã được tích hợp với **Leaflet Geoman** (leaflet.pm) - một thư viện mạnh mẽ để vẽ và chỉnh sửa các hình dạng trên bản đồ Leaflet.

## Công cụ có sẵn

### 1. **Select Tool** (Chọn) - `V`
- Chế độ mặc định
- Cho phép click và tương tác với các đối tượng trên bản đồ
- Tắt tất cả các chế độ vẽ/chỉnh sửa

### 2. **Draw Tool** (Vẽ tuyến mới) - `D`
- Vẽ polygon (đa giác) mới
- Click để thêm đỉnh
- Double-click hoặc click vào điểm đầu tiên để hoàn thành
- Tự động chuyển về chế độ Select sau khi hoàn thành

**Tính năng:**
- Snapping (dính) vào các đỉnh gần đó (distance: 20px)
- Không cho phép tự cắt (self-intersection)
- Hiển thị đường gợi ý khi vẽ

### 3. **Edit Tool** (Chỉnh sửa đỉnh) - `E`
- Cho phép chỉnh sửa tất cả các polygon đã vẽ
- Kéo thả các đỉnh để thay đổi hình dạng
- Click vào middle marker (điểm giữa) để thêm đỉnh mới
- Click phải vào đỉnh để xóa

**Tính năng:**
- Snapping khi di chuyển đỉnh
- Tự động cập nhật hình dạng khi chỉnh sửa

### 4. **Move Tool** (Di chuyển tuyến) - `M`
- Cho phép kéo thả toàn bộ polygon
- Click và giữ để di chuyển hình dạng
- Không thay đổi hình dạng, chỉ di chuyển vị trí

### 5. **Delete Tool** (Xóa tuyến) - `Del`
- Click vào bất kỳ polygon nào để xóa
- Không cần confirmation (có thể thêm sau)

## Cấu hình hiện tại

### Styling
```javascript
{
  color: 'hsl(var(--primary))',           // Màu viền
  fillColor: 'hsl(var(--primary))',       // Màu tô
  fillOpacity: 0.25,                       // Độ trong suốt
  weight: 2,                               // Độ dày viền
  dashArray: '5, 5' (khi vẽ)              // Nét đứt khi vẽ
}
```

### Events được xử lý
- `pm:create` - Khi hoàn thành vẽ một shape mới
- `pm:edit` - Khi chỉnh sửa một shape
- `pm:remove` - Khi xóa một shape

## Tùy chỉnh thêm

### Thêm các shape khác

Để thêm các loại shape khác (Circle, Rectangle, Line, Marker), cập nhật trong `MapView.tsx`:

```typescript
// Trong phần khởi tạo map
map.pm.addControls({
  position: 'topleft',
  drawMarker: true,      // Cho phép vẽ marker
  drawCircle: true,      // Cho phép vẽ circle
  drawRectangle: true,   // Cho phép vẽ rectangle
  drawPolyline: true,    // Cho phép vẽ polyline
  // ...
});
```

Sau đó thêm các tool tương ứng vào `MapToolbar.tsx`:

```typescript
const tools = [
  // ... các tool hiện tại
  { id: 'drawCircle', icon: Circle, label: 'Vẽ hình tròn', shortcut: 'C' },
  { id: 'drawRectangle', icon: Square, label: 'Vẽ hình chữ nhật', shortcut: 'R' },
];
```

### Tùy chỉnh màu sắc theo loại tuyến

Trong MapView, khi xử lý event `pm:create`:

```typescript
const onDrawEnd = (e: any) => {
  const layer = e.layer;
  
  // Tùy chỉnh màu dựa trên loại tuyến
  layer.setStyle({
    color: 'hsl(var(--route-delivery))',
    fillColor: 'hsl(var(--route-delivery))',
  });
  
  // Lưu vào store
  addRoute({
    // ... route data
  });
};
```

### Lưu và tải polygons

```typescript
// Lưu polygon
const onDrawEnd = (e: any) => {
  const layer = e.layer;
  const geoJSON = layer.toGeoJSON();
  
  // Lưu vào database hoặc store
  savePolygon(geoJSON);
};

// Tải polygon
const loadPolygon = (geoJSON: any) => {
  const layer = L.geoJSON(geoJSON, {
    style: {
      color: 'hsl(var(--primary))',
      fillColor: 'hsl(var(--primary))',
      fillOpacity: 0.25,
    }
  });
  
  layer.addTo(drawingLayerRef.current);
  
  // Enable Geoman cho layer này
  layer.pm.enable();
};
```

## API Reference

### Map Methods
- `map.pm.enableDraw(shape, options)` - Bật chế độ vẽ
- `map.pm.disableDraw()` - Tắt chế độ vẽ
- `map.pm.enableGlobalEditMode()` - Bật chế độ edit cho tất cả layers
- `map.pm.disableGlobalEditMode()` - Tắt chế độ edit
- `map.pm.enableGlobalDragMode()` - Bật chế độ kéo thả
- `map.pm.disableGlobalDragMode()` - Tắt chế độ kéo thả
- `map.pm.enableGlobalRemovalMode()` - Bật chế độ xóa
- `map.pm.disableGlobalRemovalMode()` - Tắt chế độ xóa

### Layer Methods
- `layer.pm.enable()` - Enable editing cho layer cụ thể
- `layer.pm.disable()` - Disable editing
- `layer.pm.toggleEdit()` - Toggle edit mode
- `layer.toGeoJSON()` - Chuyển đổi sang GeoJSON format

## Resources

- [Leaflet Geoman Documentation](https://geoman.io/leaflet-geoman)
- [GitHub Repository](https://github.com/geoman-io/leaflet-geoman)
- [Examples & Demos](https://geoman.io/demo)

## Lưu ý

1. **Performance**: Nếu có nhiều polygons, nên sử dụng `L.LayerGroup` hoặc `L.FeatureGroup` để quản lý
2. **Mobile Support**: Geoman hỗ trợ cả touch events cho mobile
3. **Keyboard Shortcuts**: Có thể thêm keyboard shortcuts cho các tools
4. **Undo/Redo**: Cần implement riêng history management nếu muốn có undo/redo
5. **Validation**: Nên validate polygon trước khi lưu (check self-intersection, minimum area, etc.)
