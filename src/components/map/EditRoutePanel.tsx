import { useState, useEffect } from 'react';
import { X, User, MapPin, Calendar, Edit2, Trash2, Save, Palette } from 'lucide-react';
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
import { RouteType } from '@/types';
import { cn } from '@/lib/utils';

const routeTypeLabels: Record<RouteType, string> = {
  delivery: 'Giao hàng',
  pickup: 'Nhận hàng',
  all: 'Tất cả',
};

const routeTypeColors: Record<RouteType, string> = {
  delivery: 'route-badge-delivery',
  pickup: 'route-badge-pickup',
  all: 'route-badge-all',
};

const routeTypeOptions: { value: RouteType; label: string }[] = [
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'pickup', label: 'Nhận hàng' },
  { value: 'all', label: 'Tất cả' },
];

export function EditRoutePanel() {
  const { 
    routes, 
    selectedRouteId, 
    setSelectedRoute, 
    postOffices, 
    updateRoute,
  } = useMapStore();

  const route = routes.find((r) => r.id === selectedRouteId);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<RouteType>('delivery');
  const [postOfficeId, setPostOfficeId] = useState('');
  const [color, setColor] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  // Update form when route changes
  useEffect(() => {
    if (route) {
      setName(route.name);
      setType(route.type);
      setPostOfficeId(route.postOfficeId);
      setColor(route.color);
      setEmployeeName(route.assignedEmployeeName || '');
    }
  }, [route]);

  if (!route) return null;

  const postOffice = postOffices.find((po) => po.id === route.postOfficeId);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form
    setName(route.name);
    setType(route.type);
    setPostOfficeId(route.postOfficeId);
    setColor(route.color);
    setEmployeeName(route.assignedEmployeeName || '');
  };

  const handleSave = () => {
    if (!name.trim()) return;

    updateRoute(route.id, {
      name: name.trim(),
      type,
      postOfficeId,
      color,
      assignedEmployeeName: employeeName || undefined,
      assignedEmployeeId: employeeName ? route.assignedEmployeeId : undefined,
    });

    setIsEditing(false);
  };

  return (
    <div className="w-80 info-panel animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">{isEditing ? 'Chỉnh sửa Tuyến' : 'Chi tiết Tuyến'}</h2>
          <Button variant="ghost" size="icon" onClick={() => setSelectedRoute(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleEdit}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Chỉnh sửa
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {isEditing ? (
          // Edit Mode
          <>
            {/* Route Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-route-name">Tên tuyến *</Label>
              <Input
                id="edit-route-name"
                placeholder="VD: Tuyến Hoàn Kiếm A3"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            {/* <div className="space-y-2">
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
            </div> */}

            {/* Employee */}
            <div className="space-y-2">
              <Label htmlFor="edit-employee-name">Nhân viên phụ trách</Label>
              <Input
                id="edit-employee-name"
                placeholder="VD: Nguyễn Văn A"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
          </>
        ) : (
          // View Mode
          <>
            {/* Route Name & Type */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <h3 className="font-semibold text-lg">{route.name}</h3>
              </div>
              <span className={cn('route-badge', routeTypeColors[route.type])}>
                {routeTypeLabels[route.type]}
              </span>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {/* Post Office */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Bưu cục</span>
                </div>
                <p className="font-medium">{postOffice?.name}</p>
                <p className="text-xs text-muted-foreground">{postOffice?.code}</p>
              </div>

              {/* Assigned Employee */}
              {route.assignedEmployeeName && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span>Nhân viên phụ trách</span>
                  </div>
                  <p className="font-medium">{route.assignedEmployeeName}</p>
                </div>
              )}

              {/* Dates */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Thời gian</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tạo:</span>
                    <p className="font-medium">{route.createdAt.toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cập nhật:</span>
                    <p className="font-medium">{route.updatedAt.toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer - Show only in edit mode */}
      {isEditing && (
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
              <Save className="w-4 h-4 mr-1.5" />
              Lưu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
