import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useMapStore } from '@/hooks/useMapStore';
import { RouteType, Route } from '@/types';
import { routesApi, CreateRoutePayload } from '@/api/routes';
import { X, Loader2 } from 'lucide-react';
import { routeTypeOptions, productTypeOptions } from '@/constants';

interface NewRouteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPolygon: Array<{ lat: number; lng: number }> | null;
  pendingLayer: L.Layer | null;
  onSaved: () => void;
  onCancelled: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Tên tuyến là bắt buộc'),
  code: z.string().min(1, 'Mã tuyến là bắt buộc'),
  type: z.enum(['delivery', 'pickup', 'all'] as const),
  productType: z.array(z.enum(['HH', 'KH', 'TH'] as const)).min(1, 'Chọn ít nhất một loại hàng hóa'),
  employeeName: z.string().min(1, 'Nhân viên phụ trách là bắt buộc'),
});

type FormValues = z.infer<typeof formSchema>;

export function NewRouteDrawer({
  open,
  pendingPolygon,
  onSaved,
  onCancelled,
}: NewRouteDrawerProps) {
  const { postOffices, addRoute, settings } = useMapStore();
  const queryClient = useQueryClient();

  // Mutation for creating route
  const createMutation = useMutation({
    mutationFn: (data: CreateRoutePayload) => routesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Tạo tuyến mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Tạo tuyến thất bại!');
    },
  });

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

  const type = form.watch('type');

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        code: '',
        type: 'delivery',
        productType: [],
        employeeName: '',
      });
    }
  }, [open, form]);

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

  const handleSave = async (values: FormValues) => {
    if (!pendingPolygon) return;

    const area = computeArea(pendingPolygon);
    const postOfficeId = postOffices[0]?.id ?? '';
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
      staffMain: values.employeeName.trim(),
      area: convertPolygonToRouteArea(pendingPolygon),
    };

    try {
      // Call API to create route
      const apiResponse = await createMutation.mutateAsync(payload);

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
        postOfficeId,
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
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
                    autoFocus
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

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleCancel} 
            type="button"
            disabled={createMutation.isPending}
          >
            Hủy
          </Button>
          <Button 
            className="flex-1 gradient-primary" 
            onClick={form.handleSubmit(handleSave)}
            disabled={!form.formState.isValid || createMutation.isPending}
            type="button"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lưu tuyến
          </Button>
        </div>
      </div>
    </div>
  );
}
