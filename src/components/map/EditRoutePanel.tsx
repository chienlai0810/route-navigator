import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, User, MapPin, Calendar, Edit2, Trash2, Save, Palette, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useMapStore } from '@/hooks/useMapStore';
import { RouteType } from '@/types';
import { routesApi, UpdateRoutePayload } from '@/api/routes';
import { cn } from '@/lib/utils';
import { routeTypeLabels, routeTypeColors, routeTypeOptions, productTypeOptions } from '@/constants';

const formSchema = z.object({
  name: z.string().min(1, 'Tên tuyến là bắt buộc'),
  code: z.string().min(1, 'Mã tuyến là bắt buộc'),
  type: z.enum(['delivery', 'pickup', 'all'] as const),
  productType: z.array(z.enum(['HH', 'KH', 'TH'] as const)).min(1, 'Chọn ít nhất một loại hàng hóa'),
  employeeName: z.string().min(1, 'Nhân viên phụ trách là bắt buộc'),
});

type FormValues = z.infer<typeof formSchema>;

export function EditRoutePanel() {
  const { 
    routes, 
    selectedRouteId, 
    setSelectedRoute, 
    postOffices, 
    updateRoute,
    setEditingRouteId,
    revertPolygon,
    editMode,
    setEditMode,
  } = useMapStore();

  const route = routes.find((r) => r.id === selectedRouteId);
  const queryClient = useQueryClient();

  // Mutation for updating route
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoutePayload }) => 
      routesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Cập nhật tuyến thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Cập nhật tuyến thất bại!');
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPolygon, setIsEditingPolygon] = useState(false);
  const previousRouteIdRef = useRef<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      code: '',
      type: 'delivery',
      productType: [],
      employeeName: '',
    },
  });

  // Update form when route changes
  useEffect(() => {
    if (route) {
      form.reset({
        name: route.name,
        code: route.code || '',
        type: route.type,
        productType: route.productType || [],
        employeeName: route.assignedEmployeeName || '',
      });
    }
  }, [route, form]);

  // Sync editingRouteId and editMode with polygon editing state
  useEffect(() => {
    if (isEditingPolygon && selectedRouteId && editMode) {
      setEditingRouteId(selectedRouteId);
    } else {
      setEditingRouteId(null);
    }
  }, [isEditingPolygon, selectedRouteId, setEditingRouteId, editMode]);

  // Reset editing state when route changes
  useEffect(() => {
    // If route changed and was editing, revert the old polygon
    if (previousRouteIdRef.current && previousRouteIdRef.current !== selectedRouteId && (isEditing || isEditingPolygon)) {
      revertPolygon(previousRouteIdRef.current);
      setIsEditing(false);
      setIsEditingPolygon(false);
      setEditMode(null);
    }
    
    // Update ref to current route
    previousRouteIdRef.current = selectedRouteId;
  }, [selectedRouteId, isEditing, isEditingPolygon, revertPolygon, setEditMode]);

  if (!route) return null;

  const postOffice = postOffices.find((po) => po.id === route.postOfficeId);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditVertices = () => {
    setIsEditingPolygon(true);
    setEditMode('vertices');
  };

  const handleEditDrag = () => {
    setIsEditingPolygon(true);
    setEditMode('drag');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingPolygon(false);
    setEditMode(null);
    // Revert polygon to original state
    if (route) {
      revertPolygon(route.id);
      // Reset form to route values
      form.reset({
        name: route.name,
        code: route.code || '',
        type: route.type,
        productType: route.productType || [],
        employeeName: route.assignedEmployeeName || '',
      });
    }
  };

  // Convert internal polygon format to GeoJSON Polygon format
  const convertPolygonToRouteArea = (polygon: Array<{ lat: number; lng: number }>) => {
    // Convert to array of [longitude, latitude] pairs
    const coordinates = polygon.map(point => [point.lng, point.lat] as [number, number]);
    
    // Ensure the polygon is closed (first point equals last point)
    if (coordinates.length > 0) {
      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];
      
      // Check if loop is not closed
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([firstPoint[0], firstPoint[1]]);
      }
    }
    
    return {
      type: 'Polygon' as const,
      coordinates: [coordinates] // GeoJSON Polygon requires array of rings
    };
  };

  const handleSave = async (values: FormValues) => {
    if (!route) return;

    // Get fresh route data (includes updated polygon if edited)
    const currentRoute = routes.find((r) => r.id === route.id);
    if (!currentRoute) return;

    // Map type to uppercase for API
    const apiType = values.type.toUpperCase() as 'DELIVERY' | 'PICKUP' | 'ALL';

    // Convert productType array to semicolon-separated string
    const productTypeString = values.productType.join(';');

    // Create payload for API with current polygon data
    const payload: UpdateRoutePayload = {
      code: values.code.trim(),
      name: values.name.trim(),
      type: apiType,
      productType: productTypeString,
      staffMain: values.employeeName.trim(),
      area: convertPolygonToRouteArea(currentRoute.polygon),
    };

    try {
      // Call API to update route
      await updateMutation.mutateAsync({ id: currentRoute.id, data: payload });

      // Update local store
      updateRoute(currentRoute.id, {
        name: values.name.trim(),
        code: values.code.trim(),
        type: values.type,
        productType: values.productType,
        assignedEmployeeName: values.employeeName.trim(),
        assignedEmployeeId: currentRoute.assignedEmployeeId || `emp-${Date.now()}`,
      });

      setIsEditing(false);
      setIsEditingPolygon(false);
      setEditMode(null);
    } catch (error) {
      // Error already handled by mutation's onError
      console.error('Failed to update route:', error);
    }
  };

  const handleClose = () => {
    // Revert polygon if currently editing
    if ((isEditing || isEditingPolygon) && route) {
      revertPolygon(route.id);
      setIsEditing(false);
      setIsEditingPolygon(false);
      setEditMode(null);
    }
    setSelectedRoute(null);
  };

  return (
    <div className="w-80 info-panel animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">{isEditing || isEditingPolygon ? 'Chỉnh sửa Tuyến' : 'Chi tiết Tuyến'}</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
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
        {isEditing && (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleEditVertices}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Sửa đỉnh
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleEditDrag}
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Di chuyển
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {isEditing ? (
          // Edit Mode
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              {/* Route Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã tuyến *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: T-HK-A3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Route Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên tuyến *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Tuyến Hoàn Kiếm A3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Route Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại tuyến *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {routeTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Type */}
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại hàng hóa *</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={productTypeOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Chọn loại hàng hóa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee */}
              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhân viên phụ trách *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Nguyễn Văn A"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
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
              {route.code && (
                <p className="text-sm text-muted-foreground mb-2">Mã: <span className='font-semibold text-foreground'>{route.code}</span></p>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Loại tuyến:</span>
                  <span className={cn('route-badge', routeTypeColors[route.type])}>
                    {routeTypeLabels[route.type]}
                  </span>
                </div>
                {route.productType && route.productType.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Loại hàng hóa:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {route.productType.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
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
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleCancel} 
              type="button"
              disabled={updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button 
              className="flex-1 gradient-primary" 
              onClick={form.handleSubmit(handleSave)}
              disabled={!form.formState.isValid || updateMutation.isPending}
              type="button"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              Lưu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
