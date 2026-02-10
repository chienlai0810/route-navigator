import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore } from '@/hooks/useMapStore';
import { RouteType, Route } from '@/types';
import { MapPin, Palette, X } from 'lucide-react';

interface NewRouteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPolygon: Array<{ lat: number; lng: number }> | null;
  pendingLayer: L.Layer | null;
  onSaved: () => void;
  onCancelled: () => void;
}

const routeTypeOptions: { value: RouteType; label: string }[] = [
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'pickup', label: 'Nhận hàng' },
  { value: 'all', label: 'Tất cả' },
];

export function NewRouteDrawer({
  open,
  onOpenChange,
  pendingPolygon,
  pendingLayer,
  onSaved,
  onCancelled,
}: NewRouteDrawerProps) {
  const { postOffices, addRoute, settings } = useMapStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<RouteType>('delivery');
  const [postOfficeId, setPostOfficeId] = useState(postOffices[0]?.id ?? '');
  const [color, setColor] = useState(settings.routeColors.delivery);
  const [employeeName, setEmployeeName] = useState('');

  // Update color when type changes
  useEffect(() => {
    setColor(settings.routeColors[type]);
  }, [type, settings.routeColors]);

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setName('');
      setType('delivery');
      setPostOfficeId(postOffices[0]?.id ?? '');
      setColor(settings.routeColors.delivery);
      setEmployeeName('');
    }
  }, [open, postOffices, settings.routeColors]);

  const computeArea = (polygon: Array<{ lat: number; lng: number }>) => {
    // Shoelace formula approximation in m²
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

  const handleSave = () => {
    if (!pendingPolygon || !name.trim()) return;

    const area = computeArea(pendingPolygon);
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name: name.trim(),
      type,
      color,
      postOfficeId,
      assignedEmployeeId: employeeName ? `emp-${Date.now()}` : undefined,
      assignedEmployeeName: employeeName || undefined,
      polygon: pendingPolygon,
      area,
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addRoute(newRoute);
    onSaved();
  };

  const handleCancel = () => {
    onCancelled();
  };

  const areaDisplay = pendingPolygon ? computeArea(pendingPolygon) : 0;

  if (!open) return null;

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Tạo tuyến mới</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Nhập thông tin cho tuyến vừa vẽ trên bản đồ.
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Route Name */}
        <div className="space-y-2">
          <Label htmlFor="route-name">Tên tuyến *</Label>
          <Input
            id="route-name"
            placeholder="VD: Tuyến Hoàn Kiếm A3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Route Type */}
        <div className="space-y-2">
          <Label>Loại tuyến</Label>
          <Select value={type} onValueChange={(v) => setType(v as RouteType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {routeTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Post Office */}
        <div className="space-y-2">
          <Label>Bưu cục</Label>
          <Select value={postOfficeId} onValueChange={setPostOfficeId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {postOffices.map((po) => (
                <SelectItem key={po.id} value={po.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{po.name}</span>
                    <span className="text-muted-foreground text-xs">({po.code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Màu tuyến</Label>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-border shrink-0"
              style={{ backgroundColor: color }}
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="hsl(142, 76%, 36%)"
              className="flex-1"
            />
            <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* Employee */}
        <div className="space-y-2">
          <Label htmlFor="employee-name">Nhân viên phụ trách</Label>
          <Input
            id="employee-name"
            placeholder="VD: Nguyễn Văn A"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
        </div>

        {/* Area Info */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-1">
          <p className="text-sm text-muted-foreground">Diện tích vùng vẽ</p>
          <p className="font-semibold text-lg">
            {(areaDisplay / 1_000_000).toFixed(2)} km²
          </p>
          <p className="text-xs text-muted-foreground">
            {areaDisplay.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} m²
          </p>
        </div>

        {/* Vertices */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Số đỉnh polygon</p>
          <p className="font-medium">{pendingPolygon?.length ?? 0} đỉnh</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCancel}>
            Hủy
          </Button>
          <Button 
            className="flex-1 gradient-primary" 
            onClick={handleSave} 
            disabled={!name.trim()}
          >
            Lưu tuyến
          </Button>
        </div>
      </div>
    </div>
  );
}
