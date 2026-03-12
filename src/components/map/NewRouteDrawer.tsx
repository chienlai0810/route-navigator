import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMapStore } from '@/hooks/useMapStore';
import { RouteType, Route, PostOffice, OperationalArea } from '@/types';
import { routesApi, CreateRoutePayload } from '@/api/routes';
import { operationalAreasApi, CreateOperationalAreaPayload } from '@/api/operationalAreas';
import { postOfficesApi } from '@/api/postOffices';
import { X, Loader2 } from 'lucide-react';
import { routeTypeOptions, productTypeOptions } from '@/constants';

interface NewRouteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPolygon: Array<{ lat: number; lng: number }> | null;
  pendingLayer: L.Layer | null;
  onSaved: () => void;
  onCancelled: () => void;
  postOffices?: PostOffice[];
}

// Form schema for Route
const routeFormSchema = z.object({
  name: z.string().min(1, 'Tên tuyến là bắt buộc'),
  code: z.string().min(1, 'Mã tuyến là bắt buộc'),
  type: z.enum(['delivery', 'pickup', 'all'] as const),
  productType: z.array(z.enum(['HH', 'KH', 'TH'] as const)).min(1, 'Chọn ít nhất một loại hàng hóa'),
  postOfficeId: z.string().min(1, 'Bưu cục là bắt buộc'),
  operationalAreaId: z.string().optional(),
  employeeName: z.string().min(1, 'Nhân viên phụ trách là bắt buộc'),
});

// Form schema for Operational Area
const operationalAreaFormSchema = z.object({
  name: z.string().min(1, 'Tên vùng hoạt động là bắt buộc'),
  postOfficeId: z.string().min(1, 'Bưu cục là bắt buộc'),
  productType: z.array(z.enum(['HH', 'KH', 'TH'] as const)).min(1, 'Chọn ít nhất một loại hàng hóa'),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;
type OperationalAreaFormValues = z.infer<typeof operationalAreaFormSchema>;

export function NewRouteDrawer({
  open,
  pendingPolygon,
  onSaved,
  onCancelled,
  postOffices,
}: NewRouteDrawerProps) {
  const { addRoute, settings } = useMapStore();
  const queryClient = useQueryClient();
  const [featureType, setFeatureType] = useState<'route' | 'operational-area'>('route');

  // Mutation for creating route
  const createRouteMutation = useMutation({
    mutationFn: (data: CreateRoutePayload) => routesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Tạo tuyến mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Tạo tuyến thất bại!');
    },
  });

  // Mutation for creating operational area
  const createOperationalAreaMutation = useMutation({
    mutationFn: (data: CreateOperationalAreaPayload) => operationalAreasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-areas'] });
      toast.success('Tạo vùng hoạt động thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Tạo vùng hoạt động thất bại!');
    },
  });

  const routeForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      code: '',
      type: 'delivery',
      productType: [],
      postOfficeId: '',
      operationalAreaId: '',
      employeeName: '',
    },
  });

  const operationalAreaForm = useForm<OperationalAreaFormValues>({
    resolver: zodResolver(operationalAreaFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      postOfficeId: '',
      productType: [],
    },
  });

  const type = routeForm.watch('type');
  const selectedPostOfficeId = routeForm.watch('postOfficeId');
  const selectedProductType = routeForm.watch('productType');

  // Fetch operational areas based on selected postOfficeId and productType
  const { data: operationalAreas = [] } = useQuery({
    queryKey: ['operational-areas-for-route', selectedPostOfficeId, selectedProductType],
    queryFn: () => {
      if (!selectedPostOfficeId || !selectedProductType || selectedProductType.length === 0) {
        return Promise.resolve([]);
      }
      const productTypeString = selectedProductType.join(';');
      return operationalAreasApi.getAll({
        postOfficeId: selectedPostOfficeId,
        productType: productTypeString,
      });
    },
    enabled: !!selectedPostOfficeId && selectedProductType.length > 0,
  });

  // Reset forms when drawer opens/closes or feature type changes
  useEffect(() => {
    if (open) {
      setFeatureType('route');
      routeForm.reset({
        name: '',
        code: '',
        type: 'delivery',
        productType: [],
        postOfficeId: '',
        operationalAreaId: '',
        employeeName: '',
      });
      operationalAreaForm.reset({
        name: '',
        postOfficeId: '',
        productType: [],
      });
    }
  }, [open]);

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

  const handleSaveRoute = async (values: RouteFormValues) => {
    if (!pendingPolygon) return;

    const area = computeArea(pendingPolygon);
    const color = settings.routeColors[values.type];

    // Map type to uppercase for API
    const apiType = values.type.toUpperCase() as 'DELIVERY' | 'PICKUP' | 'ALL';

    // Convert productType array to semicolon-separated string
    const productTypeString = values.productType.join(';');

    // Create payload for API
    const payload: CreateRoutePayload = {
      code: values.code.trim(),
      name: values.name.trim(),
      type: apiType,
      productType: productTypeString,
      postOfficeId: values.postOfficeId,
      staffMain: values.employeeName.trim(),
      area: convertPolygonToRouteArea(pendingPolygon),
      operatingAreaId: values.operationalAreaId || undefined,
    };

    try {
      // Call API to create route
      const apiResponse = await createRouteMutation.mutateAsync(payload);

      // Parse productType from API response
      const productTypeArray: ('HH' | 'KH' | 'TH')[] = apiResponse.productType 
        ? apiResponse.productType.split(';').filter(Boolean) as ('HH' | 'KH' | 'TH')[]
        : [];

      // Convert API polygon format back to internal format
      const polygonFromApi = apiResponse.area.points.map(point => ({
        lat: point.y,
        lng: point.x
      }));

      // Add route to local store with API response data
      const newRoute: Route = {
        id: apiResponse.id,
        name: apiResponse.name,
        code: apiResponse.code,
        type: values.type,
        productType: productTypeArray,
        color,
        postOfficeId: apiResponse.postOfficeId || values.postOfficeId,
        assignedEmployeeId: `emp-${Date.now()}`,
        assignedEmployeeName: apiResponse.staffMain,
        polygon: polygonFromApi,
        area,
        isVisible: true,
        createdAt: apiResponse.createdAt ? new Date(apiResponse.createdAt) : new Date(),
        updatedAt: apiResponse.updatedAt ? new Date(apiResponse.updatedAt) : new Date(),
      };

      addRoute(newRoute);
      onSaved();
    } catch (error) {
      // Error already handled by mutation's onError
      console.error('Failed to create route:', error);
    }
  };

  const handleSaveOperationalArea = async (values: OperationalAreaFormValues) => {
    if (!pendingPolygon) return;

    // Convert productType array to semicolon-separated string
    const productTypeString = values.productType.join(';');

    // Create payload for API
    const payload: CreateOperationalAreaPayload = {
      name: values.name.trim(),
      postOfficeId: values.postOfficeId,
      productType: productTypeString,
      area: convertPolygonToRouteArea(pendingPolygon),
    };

    try {
      // Call API to create operational area
      await createOperationalAreaMutation.mutateAsync(payload);
      onSaved();
    } catch (error) {
      // Error already handled by mutation's onError
      console.error('Failed to create operational area:', error);
    }
  };

  const handleSave = async () => {
    if (featureType === 'route') {
      await routeForm.handleSubmit(handleSaveRoute)();
    } else {
      await operationalAreaForm.handleSubmit(handleSaveOperationalArea)();
    }
  };

  const handleCancel = () => {
    onCancelled();
  };

  const areaDisplay = pendingPolygon ? computeArea(pendingPolygon) : 0;
  const isLoading = createRouteMutation.isPending || createOperationalAreaMutation.isPending;

  if (!open) return null;

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Tạo mới</h2>
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
          Nhập thông tin cho vùng vừa vẽ trên bản đồ.
        </p>
      </div>

      {/* Feature Type Selection */}
      <div className="p-4 border-b border-border">
        <RadioGroup value={featureType} onValueChange={(value) => setFeatureType(value as 'route' | 'operational-area')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="route" id="route" />
            <Label htmlFor="route" className="cursor-pointer">Tuyến đường</Label>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <RadioGroupItem value="operational-area" id="operational-area" />
            <Label htmlFor="operational-area" className="cursor-pointer">Vùng hoạt động bưu cục</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Form Content */}
      {featureType === 'route' ? (
        <Form {...routeForm} key="route-form">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Post Office */}
            <FormField
              control={routeForm.control}
              name="postOfficeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bưu cục *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bưu cục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {postOffices?.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.name} ({po.code})
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
              control={routeForm.control}
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

            {/* Operational Area */}
            <FormField
              control={routeForm.control}
              name="operationalAreaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vùng hoạt động</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedPostOfficeId || selectedProductType.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vùng hoạt động" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {operationalAreas.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Không có vùng hoạt động
                        </div>
                      ) : (
                        operationalAreas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Route Code */}
            <FormField
              control={routeForm.control}
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
              control={routeForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tuyến *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Tuyến Hoàn Kiếm A3"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Route Type */}
            <FormField
              control={routeForm.control}
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

            {/* Employee */}
            <FormField
              control={routeForm.control}
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
          </div>
        </Form>
      ) : (
        <Form {...operationalAreaForm} key="operational-area-form">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Name */}
            <FormField
              control={operationalAreaForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên vùng hoạt động *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Vùng KH Cầu Giấy 01"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Post Office */}
            <FormField
              control={operationalAreaForm.control}
              name="postOfficeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bưu cục *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bưu cục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {postOffices?.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.name} ({po.code})
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
              control={operationalAreaForm.control}
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
          </div>
        </Form>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleCancel} 
            type="button"
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button 
            className="flex-1 gradient-primary" 
            onClick={handleSave}
            disabled={
              (featureType === 'route' ? !routeForm.formState.isValid : !operationalAreaForm.formState.isValid) || isLoading
            }
            type="button"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {featureType === 'route' ? 'Lưu tuyến' : 'Lưu vùng hoạt động'}
          </Button>
        </div>
      </div>
    </div>
  );
}
